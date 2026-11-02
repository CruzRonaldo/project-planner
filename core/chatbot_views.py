import logging
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from pgvector.django import CosineDistance

from .authentication import PasswordBoundAuthentication

SimpleUserAuthentication = PasswordBoundAuthentication
from .models import DocumentEmbedding
from .services.gemini_service import get_embedding, generate_rag_response, get_chat_response

logger = logging.getLogger(__name__)


def _extract_user_role(request):
    """Extrae el rol del usuario autenticado (Admin vs. Técnico) desde la sesión/token."""
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        is_admin = bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))
        return "Admin" if is_admin else "Técnico"
    return request.data.get('user_role') or request.data.get('role') or "Técnico"


class RAGChatbotView(APIView):
    """POST /api/chatbot/rag/ (y /api/chatbot/search/)

    Endpoint de Búsqueda Semántica y RAG (Retrieval-Augmented Generation).
    1. Recibe la consulta en `message` o `query`.
    2. Convierte la consulta a vector (768 dimensiones) usando `get_embedding`.
    3. Recupera los 3 fragmentos más relevantes de `DocumentEmbedding` vía `CosineDistance`.
    4. Inyecta el contexto en Gemini mediante `generate_rag_response`.
    5. Devuelve la respuesta en formato JSON o streaming según `stream=true/false`.
    """
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        message = (
            request.data.get('message')
            or request.data.get('query')
            or request.data.get('prompt')
            or ''
        ).strip()

        if not message:
            return Response(
                {
                    'status': 'error',
                    'message': "El campo 'message' o 'query' es obligatorio.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_role = _extract_user_role(request)
        want_stream = str(request.data.get('stream', request.query_params.get('stream', 'false'))).lower() in ('1', 'true', 'yes')

        # 1. Recuperación vectorial con pgvector
        top_chunks = []
        try:
            query_vector = get_embedding(message)
            top_chunks = list(
                DocumentEmbedding.objects
                .annotate(distance=CosineDistance('embedding', query_vector))
                .order_by('distance')[:3]
            )
            logger.info("RAG recuperó %d fragmentos de contexto para: %s", len(top_chunks), message[:50])
        except Exception as exc:
            logger.warning("No se pudo completar la búsqueda vectorial en pgvector: %s. Procediendo sin contexto.", exc)

        # 2. Generación de respuesta con inyección de contexto
        try:
            if want_stream:
                stream_generator = generate_rag_response(
                    user_query=message,
                    context_chunks=top_chunks,
                    user_role=user_role,
                    stream=True,
                )
                response = StreamingHttpResponse(
                    stream_generator,
                    content_type='text/plain; charset=utf-8',
                )
                response['Cache-Control'] = 'no-cache'
                response['X-Accel-Buffering'] = 'no'
                return response

            rag_text = generate_rag_response(
                user_query=message,
                context_chunks=top_chunks,
                user_role=user_role,
                stream=False,
            )

            context_data = [
                {
                    'id': doc.id,
                    'title': doc.title,
                    'content': doc.content,
                    'distance': round(float(doc.distance), 4) if hasattr(doc, 'distance') and doc.distance is not None else None,
                }
                for doc in top_chunks
            ]

            return Response(
                {
                    'status': 'success',
                    'query': message,
                    'role': user_role,
                    'context_chunks_count': len(top_chunks),
                    'context_chunks': context_data,
                    'response': rag_text,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception("Error al generar la respuesta RAG: %s", exc)
            return Response(
                {
                    'status': 'error',
                    'message': f"Error al procesar la respuesta RAG: {str(exc)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChatbotView(APIView):
    """POST /api/chatbot/

    Endpoint principal del Chatbot con soporte RAG y streaming.
    Aplica búsqueda semántica con pgvector e inyección de contexto de forma transparente.
    """
    authentication_classes = [SimpleUserAuthentication]
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        message = (request.data.get('message') or request.data.get('prompt') or '').strip()
        if not message:
            return Response(
                {
                    'status': 'error',
                    'message': "El campo 'message' es obligatorio.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_role = _extract_user_role(request)

        # Intento de recuperación RAG en pgvector
        top_chunks = []
        try:
            query_vector = get_embedding(message)
            top_chunks = list(
                DocumentEmbedding.objects
                .order_by(CosineDistance('embedding', query_vector))[:3]
            )
        except Exception as exc:
            logger.debug("Búsqueda RAG en ChatbotView omitida o en fallback: %s", exc)

        try:
            stream_generator = generate_rag_response(
                user_query=message,
                context_chunks=top_chunks,
                user_role=user_role,
                stream=True,
            )
            response = StreamingHttpResponse(
                stream_generator,
                content_type='text/plain; charset=utf-8',
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response
        except Exception as exc:
            logger.exception("Error en ChatbotView: %s", exc)
            return Response(
                {
                    'status': 'error',
                    'message': f"Error al procesar la solicitud con el asistente: {str(exc)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
