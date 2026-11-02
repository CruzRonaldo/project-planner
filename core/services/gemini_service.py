import logging
import os
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)


def _get_api_key() -> str:
    """Obtiene la clave de API de Gemini desde settings o variables de entorno."""
    key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')
    return key.strip() if key else ''


def get_embedding(text: str) -> list[float]:
    """Genera un vector embedding de 768 dimensiones para el texto dado

    utilizando el modelo oficial de embeddings de Google Gemini (text-embedding-004).
    """
    api_key = _get_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY no está configurada en settings ni en variables de entorno.")

    genai.configure(api_key=api_key)

    # Intentar con el modelo estándar text-embedding-004 (768 dimensiones)
    model_candidates = [
        "models/text-embedding-004",
        "text-embedding-004",
        "models/gemini-embedding-001",
    ]

    last_error = None
    for model_name in model_candidates:
        try:
            result = genai.embed_content(
                model=model_name,
                content=text,
                task_type="retrieval_query",
                output_dimensionality=768,
            )
            embedding = result.get('embedding')
            if embedding:
                return embedding
        except Exception as exc:
            last_error = exc
            logger.debug("Fallo al generar embedding con %s: %s", model_name, exc)

    logger.error("No se pudo generar embedding con ningún modelo disponible: %s", last_error)
    raise RuntimeError(f"Error al generar embedding con Gemini: {last_error}")


def _build_rag_prompt(user_query: str, context_chunks: list) -> str:
    """Construye el prompt con inyección de contexto."""
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
        "Te diriges a un miembro del Equipo Técnico. Responde de forma práctica, clara y orientada a la acción."
    )


def _stream_rag_response(user_query: str, context_chunks: list, user_role: str = 'user'):
    """Generador interno para streaming con yield."""
    api_key = _get_api_key()
    if not api_key:
        yield (
            "El Asistente de IA está temporalmente deshabilitado: no se ha configurado "
            "la clave `GEMINI_API_KEY`. Por favor, contacte al administrador del sistema."
        )
        return

    genai.configure(api_key=api_key)
    rag_prompt = _build_rag_prompt(user_query, context_chunks)
    system_instruction = _get_system_instruction(user_role)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-3.8-flash",
            system_instruction=system_instruction,
        )
        response = model.generate_content(rag_prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as exc:
        logger.exception("Error al generar respuesta RAG con Gemini: %s", exc)
        yield f"\nOcurrió un error al procesar la respuesta con el asistente de IA: {str(exc)}"


def _sync_rag_response(user_query: str, context_chunks: list, user_role: str = 'user') -> str:
    """Función interna síncrona sin yield."""
    api_key = _get_api_key()
    if not api_key:
        return (
            "El Asistente de IA está temporalmente deshabilitado: no se ha configurado "
            "la clave `GEMINI_API_KEY`. Por favor, contacte al administrador del sistema."
        )

    genai.configure(api_key=api_key)
    rag_prompt = _build_rag_prompt(user_query, context_chunks)
    system_instruction = _get_system_instruction(user_role)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-3.8-flash",
            system_instruction=system_instruction,
        )
        response = model.generate_content(rag_prompt, stream=False)
        return response.text if response and response.text else "No recibí contenido de respuesta del modelo."
    except Exception as exc:
        logger.exception("Error al generar respuesta RAG síncrona con Gemini: %s", exc)
        return f"Ocurrió un error al procesar la respuesta con el asistente de IA: {str(exc)}"


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
