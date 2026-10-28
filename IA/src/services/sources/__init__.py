"""Adaptadores de fontes externas usados pelo coletor de pesquisa."""

from .base import AdapterResult, SourceAdapter
from .registry import collect_current_sources, select_source_adapters

__all__ = [
    "AdapterResult",
    "SourceAdapter",
    "collect_current_sources",
    "select_source_adapters",
]
