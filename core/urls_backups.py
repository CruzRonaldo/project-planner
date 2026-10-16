from django.urls import path
from .views_backups import (
    backup_history_view, download_backup_view,
    export_database_view, restore_database_view,
)

urlpatterns = [
    path("", backup_history_view, name="backup_history"),
    path("export/", export_database_view, name="export_database"),
    path("restore/", restore_database_view, name="restore_database"),
    path("<str:filename>/download/", download_backup_view, name="download_backup"),
]
