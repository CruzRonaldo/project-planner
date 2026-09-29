from pathlib import Path

from django.conf import settings

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build


class GoogleDriveConfigurationError(Exception):
    """Error en la configuración de Google Drive."""


class GoogleDriveNotConnectedError(Exception):
    """Google Drive todavía no fue autorizado."""


def _get_client_file():
    """
    Obtiene y valida el archivo JSON del cliente OAuth.
    """

    client_file = Path(
        settings.GOOGLE_DRIVE_OAUTH_CLIENT_FILE
    )

    if not client_file.is_file():
        raise GoogleDriveConfigurationError(
            "No se encontró el archivo "
            "secrets/google-drive-oauth-client.json."
        )

    return client_file


def create_oauth_flow(state=None):
    """
    Crea el flujo OAuth utilizando la credencial
    descargada desde Google Cloud.
    """

    flow = Flow.from_client_secrets_file(
        str(_get_client_file()),
        scopes=settings.GOOGLE_DRIVE_SCOPES,
        state=state,

        # Se desactiva PKCE automático porque la aplicación
        # reconstruye el flujo cuando Google regresa al callback.
        autogenerate_code_verifier=False,
    )

    flow.redirect_uri = (
        settings.GOOGLE_DRIVE_REDIRECT_URI
    )

    return flow


def create_authorization_url():
    """
    Genera la URL donde el usuario autorizará
    el acceso a Google Drive.
    """

    flow = create_oauth_flow()

    authorization_url, state = (
        flow.authorization_url(
            access_type="offline",

            # Solicita que Google entregue un refresh token.
            prompt="consent",

            # Conserva permisos que el usuario ya autorizó.
            include_granted_scopes="true",
        )
    )

    return authorization_url, state


def save_credentials(credentials):
    """
    Guarda de manera privada el token OAuth.
    """

    token_file = Path(
        settings.GOOGLE_DRIVE_TOKEN_FILE
    )

    token_file.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    token_file.write_text(
        credentials.to_json(),
        encoding="utf-8",
    )


def process_oauth_callback(
    authorization_response,
    state,
):
    """
    Intercambia el código recibido de Google
    por los tokens de acceso.
    """

    if not authorization_response:
        raise GoogleDriveConfigurationError(
            "Google no devolvió una respuesta de autorización."
        )

    if not state:
        raise GoogleDriveConfigurationError(
            "No se encontró el estado del flujo OAuth."
        )

    flow = create_oauth_flow(
        state=state,
    )

    flow.fetch_token(
        authorization_response=authorization_response,
    )

    credentials = flow.credentials

    if credentials is None or not credentials.token:
        raise GoogleDriveConfigurationError(
            "Google no devolvió un token de acceso válido."
        )

    save_credentials(credentials)

    return credentials


def load_credentials():
    """
    Carga el token guardado y lo renueva
    automáticamente cuando expire.
    """

    token_file = Path(
        settings.GOOGLE_DRIVE_TOKEN_FILE
    )

    if not token_file.is_file():
        return None

    try:
        credentials = (
            Credentials.from_authorized_user_file(
                str(token_file),
                scopes=settings.GOOGLE_DRIVE_SCOPES,
            )
        )

    except (OSError, ValueError):
        return None

    if (
        credentials.expired
        and credentials.refresh_token
    ):
        credentials.refresh(Request())
        save_credentials(credentials)

    if not credentials.valid:
        return None

    return credentials


def get_drive_service():
    """
    Construye el cliente autenticado
    de Google Drive API.
    """

    credentials = load_credentials()

    if credentials is None:
        raise GoogleDriveNotConnectedError(
            "Google Drive todavía no está conectado."
        )

    return build(
        "drive",
        "v3",
        credentials=credentials,
        cache_discovery=False,
    )


def get_connection_information():
    """
    Comprueba la conexión y devuelve
    la cuenta de Google autorizada.
    """

    service = get_drive_service()

    information = (
        service.about()
        .get(
            fields=(
                "user(displayName,emailAddress)"
            )
        )
        .execute()
    )

    user = information.get(
        "user",
        {},
    )

    return {
        "connected": True,
        "display_name": user.get(
            "displayName",
            "",
        ),
        "email": user.get(
            "emailAddress",
            "",
        ),
    }