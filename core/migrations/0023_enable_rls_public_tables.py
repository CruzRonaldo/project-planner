from django.db import migrations


class PostgresOnlyRunSQL(migrations.RunSQL):
    """
    Ejecuta RunSQL únicamente si el motor de base de datos es PostgreSQL.
    En SQLite (entorno de pruebas automáticas) no realiza ninguna operación.
    """
    def database_forwards(self, app_label, schema_editor, from_state, to_state):
        if schema_editor.connection.vendor == 'postgresql':
            super().database_forwards(app_label, schema_editor, from_state, to_state)

    def database_backwards(self, app_label, schema_editor, from_state, to_state):
        if schema_editor.connection.vendor == 'postgresql':
            super().database_backwards(app_label, schema_editor, from_state, to_state)


ENABLE_RLS_SQL = """
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND (tablename LIKE 'core_%' OR tablename LIKE 'auth_%' OR tablename LIKE 'django_%')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;
"""

DISABLE_RLS_REVERSE_SQL = """
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND (tablename LIKE 'core_%' OR tablename LIKE 'auth_%' OR tablename LIKE 'django_%')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_create_audit_purge_log'),
    ]

    operations = [
        PostgresOnlyRunSQL(
            sql=ENABLE_RLS_SQL,
            reverse_sql=DISABLE_RLS_REVERSE_SQL,
        ),
    ]
