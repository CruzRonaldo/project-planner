import time
from django.http import JsonResponse
from django.db import connection

def test_db_connection(request):
    """
    Endpoint para probar la conectividad directa entre Backend (Django) y la Base de Datos (MySQL).
    """
    start_time = time.time()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()

            # Obtener nombre de la base de datos y versión del motor
            cursor.execute("SELECT DATABASE(), VERSION();")
            row = cursor.fetchone()
            db_name = row[0] if row else 'Desconocida'
            db_version = row[1] if row else 'Desconocida'

        latency_ms = round((time.time() - start_time) * 1000, 2)

        return JsonResponse({
            'status': 'success',
            'connected': True,
            'database': {
                'engine': connection.vendor,
                'name': db_name,
                'version': db_version,
                'latency_ms': latency_ms,
            },
            'message': '¡Conexión exitosa con la base de datos MySQL!'
        }, status=200)

    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return JsonResponse({
            'status': 'error',
            'connected': False,
            'database': {
                'engine': getattr(connection, 'vendor', 'mysql'),
                'latency_ms': latency_ms,
                'error_detail': str(e),
            },
            'message': f'Error al conectar con la base de datos: {str(e)}'
        }, status=500)

