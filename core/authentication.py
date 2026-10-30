from django.contrib.auth import get_user_model
from django.core import signing
from django.utils.crypto import constant_time_compare
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


SESSION_TOKEN_SALT = 'project-planner.session'
SESSION_TOKEN_MAX_AGE = 60 * 60 * 24 * 30


def issue_session_token(user):
    """Crea un token firmado que deja de ser válido al cambiar la contraseña."""
    return signing.dumps(
        {
            'user_id': user.pk,
            'auth_hash': user.get_session_auth_hash(),
        },
        salt=SESSION_TOKEN_SALT,
        compress=True,
    )


class PasswordBoundAuthentication(BaseAuthentication):
    """Autentica tokens firmados y vinculados a la contraseña vigente."""

    def authenticate_header(self, request):
        return 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.removeprefix('Bearer ').strip()
        if not token:
            raise AuthenticationFailed('Token de sesión no proporcionado.')

        try:
            payload = signing.loads(
                token,
                salt=SESSION_TOKEN_SALT,
                max_age=SESSION_TOKEN_MAX_AGE,
            )
            user_id = payload.get('user_id')
            token_auth_hash = payload.get('auth_hash', '')
        except signing.SignatureExpired as exc:
            raise AuthenticationFailed('La sesión expiró. Inicie sesión nuevamente.') from exc
        except (signing.BadSignature, AttributeError, TypeError, ValueError) as exc:
            raise AuthenticationFailed('La sesión no es válida. Inicie sesión nuevamente.') from exc

        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, TypeError, ValueError) as exc:
            raise AuthenticationFailed('Usuario no encontrado o sesión inválida.') from exc

        if not user.is_active:
            raise AuthenticationFailed('Esta cuenta de usuario fue desactivada.')

        if not constant_time_compare(token_auth_hash, user.get_session_auth_hash()):
            raise AuthenticationFailed(
                'La sesión fue cerrada porque las credenciales de la cuenta cambiaron.'
            )

        return user, token
