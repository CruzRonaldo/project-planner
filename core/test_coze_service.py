from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from core.services.coze_service import is_coze_configured, stream_coze_response


@override_settings(
    COZE_API_TOKEN='test-token',
    COZE_BOT_ID='test-bot',
    COZE_API_BASE_URL='https://api.coze.com',
    COZE_REQUEST_TIMEOUT=30,
    COZE_AUTO_SAVE_HISTORY=False,
)
class CozeServiceTests(SimpleTestCase):
    @patch('core.services.coze_service.requests.post')
    def test_streams_coze_delta_events_as_plain_text(self, mock_post):
        response = MagicMock()
        response.iter_lines.return_value = [
            b'event:conversation.message.delta',
            b'data:{"role":"assistant","type":"answer","content_type":"text","content":"Hola "}',
            b'event:conversation.message.delta',
            b'data:{"role":"assistant","type":"answer","content_type":"text","content":"desde Coze"}',
            b'data:[DONE]',
        ]
        mock_post.return_value = response

        chunks = list(stream_coze_response(
            user_query='Consulta autorizada',
            user_role='Técnico',
            user_id='42',
            system_instruction='Responde con precisión.',
        ))

        self.assertEqual(''.join(chunks), 'Hola desde Coze')
        request_kwargs = mock_post.call_args.kwargs
        self.assertEqual(request_kwargs['json']['user_id'], 'project-planner-42')
        self.assertFalse(request_kwargs['json']['auto_save_history'])
        self.assertNotIn('test-token', str(request_kwargs['json']))
        self.assertEqual(request_kwargs['headers']['Authorization'], 'Bearer test-token')

    @patch('core.services.coze_service.requests.post')
    def test_ignores_tool_events_and_returns_only_completed_text_answer(self, mock_post):
        response = MagicMock()
        response.iter_lines.return_value = [
            b'event:conversation.message.completed',
            b'data:{"role":"assistant","type":"verbose","content_type":"text","content":"evento interno"}',
            b'event:conversation.message.completed',
            b'data:{"role":"assistant","type":"function_call","content_type":"object_string","content":"{\\"tool\\":\\"search\\"}"}',
            b'event:conversation.message.completed',
            b'data:{"role":"assistant","type":"answer","content_type":"text","content":"Respuesta final"}',
            b'data:[DONE]',
        ]
        mock_post.return_value = response

        result = ''.join(stream_coze_response(
            user_query='Consulta',
            user_role='Admin',
            user_id='1',
        ))

        self.assertEqual(result, 'Respuesta final')

    @override_settings(COZE_API_TOKEN='', COZE_BOT_ID='')
    @patch('core.services.coze_service.requests.post')
    def test_missing_configuration_does_not_call_coze(self, mock_post):
        result = ''.join(stream_coze_response(
            user_query='Consulta',
            user_role='Admin',
            user_id='1',
        ))

        self.assertIn('faltan COZE_API_TOKEN o COZE_BOT_ID', result)
        mock_post.assert_not_called()
        self.assertFalse(is_coze_configured())

    @override_settings(COZE_API_BASE_URL='http://api.coze.com')
    @patch('core.services.coze_service.requests.post')
    def test_rejects_non_https_base_url(self, mock_post):
        result = ''.join(stream_coze_response(
            user_query='Consulta',
            user_role='Admin',
            user_id='1',
        ))

        self.assertIn('URL HTTPS válida', result)
        mock_post.assert_not_called()
