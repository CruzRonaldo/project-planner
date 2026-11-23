"""Adaptador opcional para la API de Coze.

La integración permanece desactivada por defecto. Este módulo se ejecuta solo
cuando ``AI_CHAT_PROVIDER=coze`` y ``COZE_ENABLED=True``. Las credenciales se
leen exclusivamente desde la configuración de Django y nunca se exponen al
frontend.
"""

import json
import logging
from collections.abc import Generator
from urllib.parse import urlparse

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class CozeConfigurationError(RuntimeError):
    """Indica que faltan parámetros obligatorios para usar Coze."""


class CozeAPIError(RuntimeError):
    """Representa un error controlado al comunicarse con Coze."""


def is_coze_configured() -> bool:
    """Devuelve ``True`` cuando las credenciales mínimas están configuradas."""
    return bool(
        getattr(settings, "COZE_API_TOKEN", "").strip()
        and getattr(settings, "COZE_BOT_ID", "").strip()
        and getattr(settings, "COZE_API_BASE_URL", "").strip()
    )


def _configuration() -> tuple[str, str, str, int]:
    token = getattr(settings, "COZE_API_TOKEN", "").strip()
    bot_id = getattr(settings, "COZE_BOT_ID", "").strip()
    base_url = getattr(settings, "COZE_API_BASE_URL", "https://api.coze.com").strip().rstrip("/")
    timeout = max(1, min(int(getattr(settings, "COZE_REQUEST_TIMEOUT", 30)), 120))

    if not token or not bot_id:
        raise CozeConfigurationError(
            "Coze está seleccionado, pero faltan COZE_API_TOKEN o COZE_BOT_ID en el servidor."
        )
    parsed_url = urlparse(base_url)
    if parsed_url.scheme != "https" or not parsed_url.hostname:
        raise CozeConfigurationError("COZE_API_BASE_URL debe ser una URL HTTPS válida.")
    return token, bot_id, base_url, timeout


def _safe_error_message(exc: Exception) -> str:
    """Convierte errores técnicos en mensajes seguros para el usuario final."""
    if isinstance(exc, CozeConfigurationError):
        return str(exc)
    if isinstance(exc, requests.exceptions.Timeout):
        return "Coze no respondió dentro del tiempo esperado. Intenta nuevamente en unos minutos."
    if isinstance(exc, requests.exceptions.ConnectionError):
        return "No fue posible conectar con Coze. Verifica la conectividad del servidor."
    if isinstance(exc, requests.exceptions.HTTPError) and exc.response is not None:
        status_code = exc.response.status_code
        if status_code in (401, 403):
            return "Coze rechazó la autenticación configurada en el servidor."
        if status_code == 429:
            return "Coze alcanzó temporalmente su límite de solicitudes. Intenta nuevamente más tarde."
        if status_code >= 500:
            return "Coze no está disponible temporalmente. Intenta nuevamente más tarde."
    return "No fue posible obtener una respuesta del asistente mediante Coze."


def _message_content(payload: dict) -> str:
    """Obtiene texto de las variantes de eventos devueltas por Coze."""
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    content = data.get("content", "") if isinstance(data, dict) else ""
    return content if isinstance(content, str) else ""


def _is_text_answer(payload: dict) -> bool:
    """Acepta solo mensajes finales de texto generados por el asistente."""
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    if not isinstance(data, dict):
        return False
    return (
        data.get("role") == "assistant"
        and data.get("type") == "answer"
        and data.get("content_type") == "text"
    )


def stream_coze_response(
    *,
    user_query: str,
    user_role: str,
    user_id: str,
    system_instruction: str = "",
    conversation_id: str | None = None,
) -> Generator[str, None, None]:
    """Envía una consulta a Coze y normaliza su SSE a fragmentos de texto.

    ``user_id`` debe ser un identificador interno de Project Planner. No debe
    utilizarse el correo del usuario. Django conserva la autenticación, RBAC y
    recuperación de contexto antes de invocar este adaptador.
    """
    response = None
    try:
        token, bot_id, base_url, timeout = _configuration()
        internal_user_id = f"project-planner-{user_id}"
        combined_prompt = (
            f"INSTRUCCIONES PARA EL ROL {user_role}:\n{system_instruction}\n\n"
            f"MENSAJE Y CONTEXTO AUTORIZADO:\n{user_query}"
        )
        payload = {
            "bot_id": bot_id,
            "user_id": internal_user_id,
            "stream": True,
            "auto_save_history": bool(getattr(settings, "COZE_AUTO_SAVE_HISTORY", False)),
            "additional_messages": [
                {
                    "role": "user",
                    "content": combined_prompt,
                    "content_type": "text",
                }
            ],
        }
        params = {"conversation_id": conversation_id} if conversation_id else None
        response = requests.post(
            f"{base_url}/v3/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            params=params,
            json=payload,
            stream=True,
            timeout=(5, timeout),
        )
        response.raise_for_status()

        current_event = ""
        emitted_delta = False
        for raw_line in response.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            if isinstance(raw_line, bytes):
                raw_line = raw_line.decode("utf-8", errors="replace")
            line = raw_line.strip()
            if line.startswith("event:"):
                current_event = line.removeprefix("event:").strip()
                continue
            if not line.startswith("data:"):
                continue

            raw_data = line.removeprefix("data:").strip()
            if raw_data == "[DONE]":
                break
            try:
                event_payload = json.loads(raw_data)
            except json.JSONDecodeError:
                logger.debug("Coze devolvió un evento SSE no JSON; se omitió.")
                continue

            event_name = current_event or str(event_payload.get("event", ""))
            if event_name == "conversation.message.delta" and _is_text_answer(event_payload):
                content = _message_content(event_payload)
                if content:
                    emitted_delta = True
                    yield content
            elif (
                event_name == "conversation.message.completed"
                and not emitted_delta
                and _is_text_answer(event_payload)
            ):
                content = _message_content(event_payload)
                if content:
                    yield content
            elif event_name == "conversation.chat.failed":
                raise CozeAPIError("Coze informó que no pudo completar la conversación.")
    except Exception as exc:
        logger.warning("Falló la solicitud al proveedor Coze (%s).", type(exc).__name__)
        yield _safe_error_message(exc)
    finally:
        if response is not None:
            response.close()


def get_coze_response(**kwargs) -> str:
    """Devuelve en un único texto la respuesta normalizada de Coze."""
    return "".join(stream_coze_response(**kwargs))
