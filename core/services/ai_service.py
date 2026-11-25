"""Servicio de Inteligencia Artificial y RAG (Retrieval-Augmented Generation).

Proporciona capacidades de generación de embeddings vectoriales de 768 dimensiones
con Google Gemini (gemini-embedding-001) compatibles con pgvector en PostgreSQL,
así como orquestación de prompts contextuales y completado conversacional
a través de OpenRouter y modelos de lenguaje de vanguardia.
"""
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
    """Obtiene la clave de OpenRouter desde settings o variables de entorno.

    Returns:
        str: Clave de API de OpenRouter limpia o cadena vacía si no está definida.
    """
    key = getattr(settings, 'OPENROUTER_API_KEY', '') or os.environ.get('OPENROUTER_API_KEY', '')
    return key.strip() if key else ''


def _get_gemini_api_key() -> str:
    """Obtiene la clave de Google Gemini desde settings o variables de entorno.

    Returns:
        str: Clave de API de Gemini limpia o cadena vacía si no está definida.
    """
    key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
    return key.strip() if key else ''


def _get_huggingface_api_key() -> str:
    """Obtiene la clave de Hugging Face desde settings o variables de entorno.

    Returns:
        str: Clave de API de Hugging Face limpia o cadena vacía si no está definida.
    """
    key = getattr(settings, 'HUGGINGFACE_API_KEY', '') or os.environ.get('HUGGINGFACE_API_KEY', '')
    return key.strip() if key else ''


def _get_openrouter_client() -> OpenAI:
    """Configura e instancia el cliente de OpenAI apuntando al endpoint de OpenRouter.

    Returns:
        OpenAI: Cliente instanciado con cabeceras de identificación de Project Planner.

    Raises:
        ValueError: Si OPENROUTER_API_KEY no se encuentra configurada en settings ni en variables de entorno.
    """
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
    """Genera un vector embedding de 768 dimensiones para el texto dado.

    Utiliza el modelo oficial de embeddings de Google Gemini (gemini-embedding-001)
    a través del SDK oficial `google-genai` con `output_dimensionality=768` y
    `task_type="RETRIEVAL_DOCUMENT"`. Cuenta con fallback automático al endpoint REST
    directo de Generative Language API en caso de fallos transitorios de red.
    Mantiene compatibilidad exacta con la columna VectorField(dimensions=768) de PostgreSQL (pgvector).

    Args:
        text: Texto plano a vectorizar para indexación o búsqueda por similitud de cosenos.

    Returns:
        list[float]: Lista de 768 números flotantes que representan las coordenadas del embedding.

    Raises:
        ValueError: Si GEMINI_API_KEY no está presente en la configuración.
        RuntimeError: Si tanto la llamada al SDK de Gemini como el fallback REST fallan.
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
    """Construye e inyecta el contexto documental recuperado dentro del prompt para el modelo de lenguaje.

    Formatea los fragmentos documentales recuperados mediante búsqueda vectorial en PostgreSQL (pgvector)
    con encabezados enumerados y títulos, aplicando directrices de estructura profesional en Markdown.

    Args:
        user_query: Pregunta o instrucción técnica formulada por el usuario.
        context_chunks: Lista de fragmentos documentales (instancias de DocumentChunk o cadenas).

    Returns:
        str: Prompt enriquecido con bloque de contexto técnico delimitado y pautas de respuesta.
    """
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


def get_rag_context(user_query: str, context_chunks: list) -> str:
    """Obtiene el prompt enriquecido con contexto RAG para la consulta del usuario.

    Alias público de `_build_rag_prompt` para compatibilidad de interfaces externas.

    Args:
        user_query: Consulta o requerimiento del usuario.
        context_chunks: Colección de fragmentos vectoriales recuperados.

    Returns:
        str: Prompt formateado con contexto y pautas de respuesta.
    """
    return _build_rag_prompt(user_query, context_chunks)


def _get_system_instruction(user_role: str) -> str:
    """Retorna la instrucción del sistema adaptada al rol jerárquico del usuario.

    Aplica la directiva de seguridad estricta (Zero-Leakage) para roles no administrativos,
    impidiendo la revelación de datos financieros, salarios o respaldos forenses.

    Args:
        user_role: Rol del usuario autenticado ('admin', 'user', 'manager', etc.).

    Returns:
        str: Instrucción del sistema (system prompt) configurada para el LLM.
    """
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
    """Detecta excepciones de cuota (429), autenticación (401) o conectividad y genera mensajes legibles.

    Args:
        exc: Excepción capturada durante la ejecución de la petición.

    Returns:
        str: Mensaje descriptivo con icono de advertencia adecuado para la interfaz.
    """
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
    """Generador interno para streaming con yield utilizando OpenRouter (OpenAI SDK).

    Args:
        user_query: Texto de la pregunta del usuario.
        context_chunks: Lista de fragmentos documentales recuperados.
        user_role: Rol del usuario para adaptar las directivas del sistema.

    Yields:
        str: Fragmentos sucesivos de texto (deltas) conforme son emitidos por el modelo.
    """
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
    """Función interna síncrona sin yield utilizando OpenRouter (OpenAI SDK).

    Args:
        user_query: Pregunta del usuario.
        context_chunks: Lista de fragmentos documentales recuperados.
        user_role: Rol del usuario.

    Returns:
        str: Texto completo de respuesta devuelto por el modelo.
    """
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


def _use_coze_provider() -> bool:
    """Indica si Coze fue seleccionado y habilitado explícitamente."""
    provider = str(getattr(settings, 'AI_CHAT_PROVIDER', 'openrouter')).strip().lower()
    enabled = bool(getattr(settings, 'COZE_ENABLED', False))
    if provider == 'coze' and not enabled:
        logger.warning("AI_CHAT_PROVIDER=coze, pero COZE_ENABLED=False; se mantiene OpenRouter.")
    return provider == 'coze' and enabled


def generate_rag_response(
    user_query: str,
    context_chunks: list,
    user_role: str = 'user',
    stream: bool = True,
    user_id: str | None = None,
    conversation_id: str | None = None,
):
    """Construye un prompt enriquecido con RAG combinando la consulta del usuario

    con los fragmentos más relevantes recuperados de la base de datos (pgvector).
    Soporta retorno en streaming (generador yield) o texto completo (str).

    Args:
        user_query: Pregunta técnica formulada por el usuario.
        context_chunks: Lista de fragmentos recuperados por similitud de cosenos.
        user_role: Rol jerárquico del usuario ('admin' o 'user').
        stream: Si es True, retorna un generador iterable; si es False, retorna un string síncrono.

    Returns:
        Generator[str, None, None] | str: Flujo en tiempo real o respuesta textual unificada.
    """
    if _use_coze_provider():
        from .coze_service import get_coze_response, stream_coze_response

        include_rag_context = bool(getattr(settings, 'COZE_INCLUDE_RAG_CONTEXT', False))
        if context_chunks and not include_rag_context:
            logger.info(
                "El contexto RAG local no se enviará a Coze porque COZE_INCLUDE_RAG_CONTEXT=False."
            )
        coze_kwargs = {
            'user_query': (
                _build_rag_prompt(user_query, context_chunks)
                if include_rag_context
                else user_query
            ),
            'user_role': user_role,
            'user_id': str(user_id or 'anonymous'),
            'system_instruction': _get_system_instruction(user_role),
            'conversation_id': conversation_id,
        }
        if stream:
            return stream_coze_response(**coze_kwargs)
        return get_coze_response(**coze_kwargs)

    if stream:
        return _stream_rag_response(user_query, context_chunks, user_role)
    return _sync_rag_response(user_query, context_chunks, user_role)


def chat_completion(user_query: str, context_chunks: list = None, user_role: str = 'user', stream: bool = False):
    """Genera el completado conversacional del chatbot de Project Planner.

    Alias público de alto nivel para orquestar respuestas con o sin fragmentos RAG.

    Args:
        user_query: Consulta enviada por el usuario.
        context_chunks: Fragmentos vectoriales opcionales recuperados de la base de datos.
        user_role: Rol del usuario para adaptar directivas zero-leakage.
        stream: Si debe responder en modo streaming (True) o bloque síncrono (False).

    Returns:
        Generator[str, None, None] | str: Respuesta del modelo.
    """
    chunks = context_chunks or []
    return generate_rag_response(user_query=user_query, context_chunks=chunks, user_role=user_role, stream=stream)


def get_chat_response(prompt: str, user_role: str = 'user'):
    """Genera una respuesta en streaming sin RAG previo (compatibilidad hacia atrás).

    Args:
        prompt: Mensaje enviado por el usuario.
        user_role: Rol del usuario para ajustar el comportamiento del asistente.

    Returns:
        Generator[str, None, None]: Generador yield de fragmentos de texto en tiempo real.
    """
    return generate_rag_response(user_query=prompt, context_chunks=[], user_role=user_role, stream=True)

