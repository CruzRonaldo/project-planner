"""Módulo de compatibilidad hacia atrás.

Reexporta las funciones migratorias hacia OpenRouter y Hugging Face desde ai_service.py.
"""
from .ai_service import (
    get_embedding,
    generate_rag_response,
    get_chat_response,
    _format_error_message,
)

__all__ = [
    'get_embedding',
    'generate_rag_response',
    'get_chat_response',
    '_format_error_message',
]
