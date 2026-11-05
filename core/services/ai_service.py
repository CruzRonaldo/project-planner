import logging
import os
import requests
from django.conf import settings
from openai import OpenAI
import openai
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


def _get_openrouter_api_key() -> str:
    """Obtiene la clave de OpenRouter desde settings o variables de entorno."""
    key = getattr(settings, 'OPENROUTER_API_KEY', '') or os.environ.get('OPENROUTER_API_KEY', '')
    return key.strip() if key else ''


def _get_gemini_api_key() -> str:
    """Obtiene la clave de Google Gemini desde settings o variables de entorno."""
    key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
    return key.strip() if key else ''


def _get_huggingface_api_key() -> str:
    """Obtiene la clave de Hugging Face desde settings o variables de entorno."""
    key = getattr(settings, 'HUGGINGFACE_API_KEY', '') or os.environ.get('HUGGINGFACE_API_KEY', '')
    return key.strip() if key else ''


def _get_openrouter_client() -> OpenAI:
    """Configura e instancia el cliente de OpenAI apuntando al endpoint de OpenRouter."""
    api_key = _get_openrouter_api_key()
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY no está configurada en settings ni en variables de entorno.")

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        default_headers={
            "HTTP-Referer": "https://projectplanner.com",
            "X-Title": "Project Planner",
        },
    )


def get_embedding(text: str) -> list[float]:
    """Genera un vector embedding de 768 dimensiones para el texto dado
    utilizando el modelo oficial de embeddings de Google Gemini (gemini-embedding-001).
    Mantiene compatibilidad exacta con VectorField(dimensions=768) de PostgreSQL.
    """
    api_key = _get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY no está configurada en settings ni en variables de entorno.")

    model_name = "gemini-embedding-001"

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.embed_content(
            model=model_name,
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=768,
                task_type="RETRIEVAL_DOCUMENT",
            ),
        )
        if response.embeddings and len(response.embeddings) > 0:
            values = response.embeddings[0].values
            if values and len(values) == 768:
                return [float(x) for x in values]
            elif values:
                return [float(x) for x in values[:768]]
        raise RuntimeError("No se recibieron valores de vector en la respuesta de Gemini.")
    except Exception as exc:
        logger.warning("Fallo en client SDK de google-genai con %s (%s). Intentando endpoint REST directo...", model_name, exc)
        try:
            rest_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:embedContent?key={api_key}"
            payload = {
                "model": f"models/{model_name}",
                "content": {
                    "parts": [{"text": text}]
                },
                "outputDimensionality": 768,
            }
            rest_resp = requests.post(rest_url, json=payload, timeout=25)
            if rest_resp.status_code == 200:
                data = rest_resp.json()
                values = data.get("embedding", {}).get("values")
                if values and len(values) == 768:
                    return [float(x) for x in values]
                elif values:
                    return [float(x) for x in values[:768]]
            elif rest_resp.status_code == 429:
                raise RuntimeError("Límite de cuota excedido en Google Gemini (Error 429).")
            elif rest_resp.status_code == 400:
                raise RuntimeError(f"Clave de API inválida o error en solicitud Gemini: {rest_resp.text}")
            elif rest_resp.status_code == 404:
                raise RuntimeError(f"Modelo de embeddings no encontrado (HTTP 404): {rest_resp.text}")
        except Exception as rest_exc:
            logger.debug("Fallback REST de Gemini también falló: %s", rest_exc)

        logger.error("Error al generar embedding con Google Gemini: %s", exc)
        raise RuntimeError(f"Error al generar embedding con Google Gemini: {exc}")


def _build_rag_prompt(user_query: str, context_chunks: list) -> str:
    """Construye el prompt con inyección de contexto documental recuperado."""
    if context_chunks:
        formatted_chunks = []
        for i, chunk in enumerate(context_chunks):
            title = getattr(chunk, 'title', None)
            content = getattr(chunk, 'content', str(chunk))
            header = f"[Documento #{i+1} - {title}]" if title else f"[Documento #{i+1}]"
            formatted_chunks.append(f"{header}\n{content}")
        context_block = "\n\n---\n\n".join(formatted_chunks)
    else:
        context_block = (
            "No se encontraron fragmentos de documentación técnica directamente indexados en la base de datos. "
            "Aplica las directrices generales de gestión de proyectos y arquitectura técnica de Project Planner."
        )

    return f"""INFORMACIÓN DE CONTEXTO TÉCNICO (Base de Conocimientos Project Planner):
{context_block}

============================================================
CONSULTA DEL USUARIO:
{user_query}

PAUTAS DE RESPUESTA:
- Utiliza la información de contexto técnico anterior para responder con alta precisión.
- Organiza tu respuesta en formato Markdown profesional (listas ordenadas, viñetas, negritas y bloques de código si aplica).
- Sé directo, conciso y técnico. Si la consulta involucra datos no presentes en el contexto, acláralo cortésmente."""


def _get_system_instruction(user_role: str) -> str:
    """Retorna la instrucción del sistema adaptada al rol del usuario."""
    role_lower = str(user_role).strip().lower()
    is_admin = role_lower in ['admin', 'administrador', 'project manager', 'manager']

    if is_admin:
        return (
            "Eres el Asistente Técnico y Estratégico de 'Project Planner', especializado en la arquitectura "
            "del sistema, gestión de hitos, portafolio, recursos técnicos y directrices administrativas.\n"
            "Te diriges a un Administrador / Project Manager. Responde de forma ejecutiva, precisa y basada en datos."
        )
    return (
        "Eres el Asistente Técnico y Operativo de 'Project Planner', especializado en la documentación, "
        "procedimientos en campo, incidencias y ejecución de tareas del equipo técnico.\n"
        "Te diriges a un miembro del Equipo Técnico. Responde de forma práctica, clara y orientada a la acción. "
        "DIRECTIVA DE SEGURIDAD ESTRICTA (ZERO-LEAKAGE): Tienes estrictamente prohibido revelar datos administrativos "
        "sensibles, presupuestos confidenciales, nóminas, respaldos o auditorías forenses a usuarios sin rol de Administrador."
    )


def _format_error_message(exc: Exception) -> str:
    """Detecta errores de cuota (429), autenticación o red en OpenRouter/HuggingFace y genera mensajes legibles."""
    err_str = str(exc)
    err_lower = err_str.lower()

    if isinstance(exc, openai.RateLimitError) or "429" in err_str or "rate limit" in err_lower or "quota" in err_lower:
        return (
            "⚠️ Se ha alcanzado temporalmente el límite de cuota gratuita en OpenRouter (Error 429). "
            "Por favor, espera unos instantes antes de enviar un nuevo mensaje."
        )
    if isinstance(exc, openai.AuthenticationError) or "401" in err_str or "unauthorized" in err_lower:
        return (
            "⚠️ Error de autenticación con el proveedor de IA (OpenRouter/HuggingFace). "
            "Por favor, revisa la configuración de las API Keys en el servidor."
        )
    if isinstance(exc, (openai.APIConnectionError, requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
        return (
            "⚠️ No se pudo conectar con el servicio de IA (Error de conexión / tiempo de espera agotado). "
            "Verifica la conectividad de red del servidor."
        )
    return f"Ocurrió un error al procesar la respuesta con el asistente de IA: {err_str}"


def _stream_rag_response(user_query: str, context_chunks: list, user_role: str = 'user'):
    """Generador interno para streaming con yield utilizando OpenRouter (OpenAI SDK)."""
    api_key = _get_openrouter_api_key()
    if not api_key:
        yield (
            "El Asistente de IA está temporalmente deshabilitado: no se ha configurado "
            "la clave `OPENROUTER_API_KEY` en el servidor Django. Por favor, contacte al administrador del sistema."
        )
        return

    rag_prompt = _build_rag_prompt(user_query, context_chunks)
    system_instruction = _get_system_instruction(user_role)

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": rag_prompt},
    ]

    try:
        client = _get_openrouter_client()
        response = client.chat.completions.create(
            model="stealth/crouton-alpha",
            messages=messages,
            stream=True,
            extra_headers={
                "HTTP-Referer": "https://projectplanner.com",
                "X-Title": "Project Planner",
            },
        )
        for chunk in response:
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                content = getattr(delta, 'content', None)
                if content:
                    yield content
    except Exception as exc:
        logger.exception("Error al generar respuesta RAG con OpenRouter: %s", exc)
        yield f"\n{_format_error_message(exc)}"


def _sync_rag_response(user_query: str, context_chunks: list, user_role: str = 'user') -> str:
    """Función interna síncrona sin yield utilizando OpenRouter (OpenAI SDK)."""
    api_key = _get_openrouter_api_key()
    if not api_key:
        return (
            "El Asistente de IA está temporalmente deshabilitado: no se ha configurado "
            "la clave `OPENROUTER_API_KEY` en el servidor Django. Por favor, contacte al administrador del sistema."
        )

    rag_prompt = _build_rag_prompt(user_query, context_chunks)
    system_instruction = _get_system_instruction(user_role)

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": rag_prompt},
    ]

    try:
        client = _get_openrouter_client()
        response = client.chat.completions.create(
            model="stealth/crouton-alpha",
            messages=messages,
            stream=False,
            extra_headers={
                "HTTP-Referer": "https://projectplanner.com",
                "X-Title": "Project Planner",
            },
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content or "No recibí contenido de respuesta del modelo."
        return "No recibí contenido de respuesta del modelo."
    except Exception as exc:
        logger.exception("Error al generar respuesta RAG síncrona con OpenRouter: %s", exc)
        return _format_error_message(exc)


def generate_rag_response(user_query: str, context_chunks: list, user_role: str = 'user', stream: bool = True):
    """Construye un prompt enriquecido con RAG combinando la consulta del usuario

    con los fragmentos más relevantes recuperados de la base de datos (pgvector).
    Soporta retorno en streaming (generador yield) o texto completo (str).
    """
    if stream:
        return _stream_rag_response(user_query, context_chunks, user_role)
    return _sync_rag_response(user_query, context_chunks, user_role)


def get_chat_response(prompt: str, user_role: str = 'user'):
    """Genera una respuesta en streaming sin RAG previo (compatibilidad hacia atrás)."""
    return generate_rag_response(user_query=prompt, context_chunks=[], user_role=user_role, stream=True)

