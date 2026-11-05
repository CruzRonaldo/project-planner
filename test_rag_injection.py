"""Script de inyeccion de prueba para RAG en Project Planner.

Vectoriza una regla de negocio clave con Google Gemini (gemini-embedding-001) y la almacena en PostgreSQL (pgvector).
"""
import os
import sys

# 1. Configurar entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from core.models import DocumentEmbedding
from core.services.ai_service import get_embedding

TEXT_TO_INJECT = (
    "Regla de Negocio de Project Planner: Para que un hito del proyecto pase a estado 'Finalizado', "
    "el desarrollador debe subir el codigo con el prefijo [RELEASE] y el lider del equipo tecnico debe aprobar "
    "el Pull Request en el sistema."
)

TITLE = "Regla de Negocio: Finalizacion de Hitos y Aprobacion de PR"


def inject_document():
    print("=" * 70)
    print("INYECCION DE DOCUMENTO DE PRUEBA RAG (GOOGLE GEMINI + POSTGRESQL/PGVECTOR)")
    print("=" * 70)
    print(f"\nTexto a indexar:\n\"{TEXT_TO_INJECT}\"\n")

    # 1. Vectorizar con Google Gemini Embeddings (gemini-embedding-001)
    print("-> 1. Generando embedding con Google Gemini (gemini-embedding-001)...")
    try:
        vector = get_embedding(TEXT_TO_INJECT)
        dim = len(vector)
        print(f"   [OK] Vector generado exitosamente.")
        print(f"   [OK] Dimensiones: {dim}")
        print(f"   [OK] Muestra inicial (primeros 5 valores): {vector[:5]}")
        if dim != 768:
            print(f"   [AVISO] Las dimensiones ({dim}) no coinciden con las 768 esperadas.")
    except Exception as exc:
        print(f"   [ERROR] Fallo al generar embedding con Gemini: {exc}")
        return False

    # 2. Guardar en PostgreSQL
    print("\n-> 2. Guardando registro en modelo 'DocumentEmbedding' (PostgreSQL con pgvector)...")
    try:
        doc = DocumentEmbedding.objects.create(
            title=TITLE,
            content=TEXT_TO_INJECT,
            embedding=vector,
        )
        print(f"   [OK] Documento guardado exitosamente en base de datos.")
        print(f"   [OK] ID: {doc.id}")
        print(f"   [OK] Titulo: {doc.title}")
        print(f"   [OK] Longitud del vector persistido: {len(doc.embedding)}")
        print(f"   [OK] Fecha de creacion: {doc.created_at}")
        return True
    except Exception as exc:
        print(f"   [ERROR] Fallo al guardar en PostgreSQL: {exc}")
        return False


if __name__ == '__main__':
    success = inject_document()
    print("\n" + "=" * 70)
    if success:
        print("RESULTADO: Inyeccion completada con exito en PostgreSQL.")
    else:
        print("RESULTADO: La inyeccion no se pudo completar. Revisa los detalles arriba.")
    print("=" * 70)
    sys.exit(0 if success else 1)
