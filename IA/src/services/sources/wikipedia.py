"""Adaptador que preserva a coleta de Wikipédia já existente."""

from __future__ import annotations

from dataclasses import replace

from services.sources.base import AdapterResult
from services.wiki_service import fetch_wikipedia_context


class WikipediaSourceAdapter:
    source_name = "Wikipédia"

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        try:
            context = fetch_wikipedia_context(query)
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta à Wikipédia indisponível ({type(exc).__name__}).")
        if context is None:
            return AdapterResult(self.source_name, status="no_results", message="A Wikipédia não retornou resumos utilizáveis.")
        sources = [
            replace(
                source,
                id="",
                source_name=self.source_name,
                identifier=str(source.metadata.get("pageid")) if source.metadata.get("pageid") is not None else None,
                updated_at=source.metadata.get("timestamp") if isinstance(source.metadata.get("timestamp"), str) else None,
                author="Wikimedia contributors",
            )
            for source in context.fontes
        ]
        return AdapterResult(self.source_name, sources=sources[:limit], status="available")
