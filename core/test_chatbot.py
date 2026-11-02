from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from core.authentication import issue_session_token
from core.services.gemini_service import get_embedding, generate_rag_response

User = get_user_model()


class ChatbotEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='Password123!',
        )
        self.tech_user = User.objects.create_user(
            username='tech_test',
            email='tech@test.com',
            password='Password123!',
            is_staff=False,
            is_superuser=False,
        )

    @patch('core.chatbot_views.generate_rag_response')
    @patch('core.chatbot_views.get_embedding')
    def test_chatbot_admin_authenticated(self, mock_get_embedding, mock_generate_rag_response):
        mock_get_embedding.return_value = [0.1] * 768

        def fake_stream(user_query, context_chunks, user_role, stream):
            yield "Respuesta "
            yield "simulada "
            yield "para Admin"

        mock_generate_rag_response.side_effect = fake_stream
        token = issue_session_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(
            '/api/chatbot/',
            {'message': 'Hola, ¿cómo estás?'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        chunks = [c.decode('utf-8') if isinstance(c, bytes) else c for c in response.streaming_content]
        full_text = "".join(chunks)
        self.assertEqual(full_text, 'Respuesta simulada para Admin')

    @patch('core.chatbot_views.generate_rag_response')
    @patch('core.chatbot_views.get_embedding')
    def test_chatbot_tech_user_authenticated(self, mock_get_embedding, mock_generate_rag_response):
        mock_get_embedding.return_value = [0.1] * 768

        def fake_stream(user_query, context_chunks, user_role, stream):
            yield "Respuesta "
            yield "para Técnico"

        mock_generate_rag_response.side_effect = fake_stream
        token = issue_session_token(self.tech_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(
            '/api/chatbot/',
            {'message': '¿Cuáles son mis tareas?'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        chunks = [c.decode('utf-8') if isinstance(c, bytes) else c for c in response.streaming_content]
        full_text = "".join(chunks)
        self.assertEqual(full_text, 'Respuesta para Técnico')

    def test_chatbot_missing_message(self):
        token = issue_session_token(self.tech_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(
            '/api/chatbot/',
            {'message': '   '},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('status'), 'error')

    @patch('core.chatbot_views.generate_rag_response')
    @patch('core.chatbot_views.get_embedding')
    def test_rag_chatbot_json_response(self, mock_get_embedding, mock_generate_rag_response):
        mock_get_embedding.return_value = [0.05] * 768
        mock_generate_rag_response.return_value = 'Respuesta RAG estructurada con contexto de proyecto'

        token = issue_session_token(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(
            '/api/chatbot/rag/',
            {'message': '¿Cómo se registran los hitos en el sistema?', 'stream': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'success')
        self.assertEqual(response.data.get('response'), 'Respuesta RAG estructurada con contexto de proyecto')
        self.assertIn('context_chunks', response.data)

    @patch('core.services.gemini_service.genai.embed_content')
    def test_gemini_service_get_embedding(self, mock_embed_content):
        mock_embed_content.return_value = {'embedding': [0.123] * 768}
        vector = get_embedding("Texto de prueba para embedding")
        self.assertEqual(len(vector), 768)
        self.assertEqual(vector[0], 0.123)

    @patch('core.services.gemini_service.genai.GenerativeModel')
    def test_gemini_service_generate_rag_response_text(self, mock_model_class):
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Respuesta técnica fundamentada en contexto"
        mock_instance.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_instance

        result = generate_rag_response(
            user_query="¿Cuál es el procedimiento de backup?",
            context_chunks=["Fragmento de manual: Backups automáticos cada 24h."],
            user_role="Admin",
            stream=False,
        )

        self.assertEqual(result, "Respuesta técnica fundamentada en contexto")
