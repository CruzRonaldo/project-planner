import mimetypes
from pathlib import Path

from django.conf import settings
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload


FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
APP_FOLDER_NAME = "Project Planner"
FILE_FIELDS = (
    "id,name,mimeType,size,createdTime,modifiedTime,"
    "webViewLink,webContentLink,iconLink,parents"
)


class GoogleDriveConfigurationError(Exception):
    """Error en la configuración de Google Drive."""


class GoogleDriveNotConnectedError(Exception):
    """Google Drive todavía no fue autorizado."""


def _get_client_file():
    client_file = Path(settings.GOOGLE_DRIVE_OAUTH_CLIENT_FILE)

    if not client_file.is_file():
        raise GoogleDriveConfigurationError(
            "No se encontró secrets/google-drive-oauth-client.json."
        )

    return client_file


def create_oauth_flow(state=None):
    """Crea el flujo OAuth utilizando la credencial descargada."""

    # Se desactiva PKCE automático porque el flujo se reconstruye en el
    # callback de Django. Así se evita el error "Missing code verifier".
    flow = Flow.from_client_secrets_file(
        str(_get_client_file()),
        scopes=settings.GOOGLE_DRIVE_SCOPES,
        state=state,
        autogenerate_code_verifier=False,
    )
    flow.redirect_uri = settings.GOOGLE_DRIVE_REDIRECT_URI
    return flow


def create_authorization_url():
    """Genera la URL donde el usuario autorizará Google Drive."""

    flow = create_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent select_account",
        include_granted_scopes="true",
    )
    return authorization_url, state


def save_credentials(credentials):
    """Guarda de manera privada el token OAuth."""

    token_file = Path(settings.GOOGLE_DRIVE_TOKEN_FILE)
    token_file.parent.mkdir(parents=True, exist_ok=True)
    token_file.write_text(credentials.to_json(), encoding="utf-8")


def process_oauth_callback(authorization_response, state):
    """Intercambia el código recibido de Google por los tokens."""

    flow = create_oauth_flow(state=state)
    flow.fetch_token(authorization_response=authorization_response)
    save_credentials(flow.credentials)
    return flow.credentials


def load_credentials():
    """Carga el token y lo renueva automáticamente cuando expire."""

    token_file = Path(settings.GOOGLE_DRIVE_TOKEN_FILE)

    if not token_file.is_file():
        return None

    try:
        credentials = Credentials.from_authorized_user_file(
            str(token_file),
            scopes=settings.GOOGLE_DRIVE_SCOPES,
        )
    except (OSError, ValueError):
        return None

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        save_credentials(credentials)

    if not credentials.valid:
        return None

    return credentials


def get_drive_service():
    """Construye el cliente autenticado de Google Drive."""

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
    """Comprueba la conexión y devuelve la cuenta autorizada."""

    service = get_drive_service()
    information = (
        service.about()
        .get(fields="user(displayName,emailAddress)")
        .execute()
    )
    user = information.get("user", {})

    return {
        "connected": True,
        "display_name": user.get("displayName", ""),
        "email": user.get("emailAddress", ""),
    }


def _escape_drive_query_value(value):
    """Escapa texto que se usará dentro de una consulta de Drive."""

    return str(value).replace("\\", "\\\\").replace("'", "\\'")


def _normalize_file(item):
    """Convierte la respuesta de Drive en un objeto cómodo para React."""

    raw_size = item.get("size")

    return {
        "id": item.get("id", ""),
        "name": item.get("name", ""),
        "mime_type": item.get("mimeType", ""),
        "is_folder": item.get("mimeType") == FOLDER_MIME_TYPE,
        "size": int(raw_size) if raw_size else None,
        "created_time": item.get("createdTime"),
        "modified_time": item.get("modifiedTime"),
        "web_view_link": item.get("webViewLink"),
        "web_content_link": item.get("webContentLink"),
        "icon_link": item.get("iconLink"),
        "parents": item.get("parents", []),
    }


def get_file_metadata(file_id):
    """Obtiene los metadatos de un archivo o carpeta."""

    service = get_drive_service()
    item = (
        service.files()
        .get(fileId=file_id, fields=FILE_FIELDS)
        .execute()
    )
    return _normalize_file(item)


def ensure_app_folder():
    """Obtiene o crea la carpeta raíz privada de Project Planner."""

    service = get_drive_service()
    folder_name = _escape_drive_query_value(APP_FOLDER_NAME)
    result = (
        service.files()
        .list(
            q=(
                f"name = '{folder_name}' and "
                f"mimeType = '{FOLDER_MIME_TYPE}' and "
                "'root' in parents and trashed = false"
            ),
            pageSize=1,
            fields=f"files({FILE_FIELDS})",
        )
        .execute()
    )
    folders = result.get("files", [])

    if folders:
        return _normalize_file(folders[0])

    folder = (
        service.files()
        .create(
            body={
                "name": APP_FOLDER_NAME,
                "mimeType": FOLDER_MIME_TYPE,
                "parents": ["root"],
                "appProperties": {
                    "project_planner_root": "true",
                },
            },
            fields=FILE_FIELDS,
        )
        .execute()
    )
    return _normalize_file(folder)


def list_files(folder_id=None):
    """Lista el contenido de una carpeta administrada por la aplicación."""

    service = get_drive_service()
    root_folder = ensure_app_folder()
    current_folder_id = folder_id or root_folder["id"]
    current_folder = get_file_metadata(current_folder_id)

    if not current_folder["is_folder"]:
        raise GoogleDriveConfigurationError(
            "El identificador recibido no corresponde a una carpeta."
        )

    escaped_folder_id = _escape_drive_query_value(current_folder_id)
    result = (
        service.files()
        .list(
            q=f"'{escaped_folder_id}' in parents and trashed = false",
            pageSize=100,
            orderBy="folder,name",
            fields=f"files({FILE_FIELDS}),nextPageToken",
        )
        .execute()
    )

    return {
        "root_folder": root_folder,
        "current_folder": current_folder,
        "files": [_normalize_file(item) for item in result.get("files", [])],
        "has_more": bool(result.get("nextPageToken")),
    }


def create_folder(name, parent_id=None):
    """Crea una carpeta dentro de Project Planner."""

    clean_name = str(name or "").strip()

    if not clean_name:
        raise GoogleDriveConfigurationError(
            "Debes ingresar un nombre para la carpeta."
        )

    if len(clean_name) > 200:
        raise GoogleDriveConfigurationError(
            "El nombre de la carpeta no puede superar 200 caracteres."
        )

    service = get_drive_service()
    root_folder = ensure_app_folder()
    destination_id = parent_id or root_folder["id"]
    destination = get_file_metadata(destination_id)

    if not destination["is_folder"]:
        raise GoogleDriveConfigurationError(
            "La ubicación seleccionada no es una carpeta."
        )

    folder = (
        service.files()
        .create(
            body={
                "name": clean_name,
                "mimeType": FOLDER_MIME_TYPE,
                "parents": [destination_id],
            },
            fields=FILE_FIELDS,
        )
        .execute()
    )
    return _normalize_file(folder)


def upload_file(uploaded_file, folder_id=None):
    """Sube un archivo recibido por Django a Google Drive."""

    if uploaded_file is None:
        raise GoogleDriveConfigurationError(
            "Debes seleccionar un archivo para subir."
        )

    service = get_drive_service()
    root_folder = ensure_app_folder()
    destination_id = folder_id or root_folder["id"]
    destination = get_file_metadata(destination_id)

    if not destination["is_folder"]:
        raise GoogleDriveConfigurationError(
            "La ubicación seleccionada no es una carpeta."
        )

    guessed_type, _ = mimetypes.guess_type(uploaded_file.name)
    content_type = (
        getattr(uploaded_file, "content_type", None)
        or guessed_type
        or "application/octet-stream"
    )

    uploaded_file.seek(0)
    media = MediaIoBaseUpload(
        uploaded_file,
        mimetype=content_type,
        chunksize=1024 * 1024,
        resumable=True,
    )
    item = (
        service.files()
        .create(
            body={
                "name": uploaded_file.name,
                "parents": [destination_id],
            },
            media_body=media,
            fields=FILE_FIELDS,
        )
        .execute()
    )
    return _normalize_file(item)


def rename_file(file_id, new_name):
    """Cambia el nombre de un archivo o carpeta."""

    clean_name = str(new_name or "").strip()

    if not clean_name:
        raise GoogleDriveConfigurationError(
            "Debes ingresar el nuevo nombre."
        )

    item = (
        get_drive_service()
        .files()
        .update(
            fileId=file_id,
            body={"name": clean_name},
            fields=FILE_FIELDS,
        )
        .execute()
    )
    return _normalize_file(item)


def delete_file(file_id):
    """Envía un archivo o carpeta a la papelera de Google Drive."""

    service = get_drive_service()
    root_folder = ensure_app_folder()

    if file_id == root_folder["id"]:
        raise GoogleDriveConfigurationError(
            "La carpeta principal Project Planner no se puede eliminar."
        )

    service.files().update(
        fileId=file_id,
        body={"trashed": True},
        fields="id,trashed",
    ).execute()


def classify_drive_link_type(item):
    """Traduce el MIME de Google al tipo almacenado por DriveLink."""

    mime_type = item.get("mime_type", "")

    if item.get("is_folder"):
        return "FOLDER"
    if "spreadsheet" in mime_type or "excel" in mime_type:
        return "SPREADSHEET"
    if any(value in mime_type for value in ("document", "pdf", "word", "text")):
        return "DOCUMENT"
    return "OTHER"
