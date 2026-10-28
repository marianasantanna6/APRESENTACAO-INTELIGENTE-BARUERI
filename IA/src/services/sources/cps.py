"""Adaptador do Repositório Institucional do Conhecimento do Centro Paula Souza."""

from __future__ import annotations

from typing import Any

from config.settings import RIC_CPS_BASE_URL
from models.research_data import ResearchSource
from services.sources.base import AdapterResult
from services.sources.common import accessed_at, compact_text, first_string, normalized_text
from services.sources.http import SourceHttpClient


_CPS_TERMS = {
    "centro", "paula", "souza", "cps", "fatec", "etec", "tecnologo",
    "tecnologica", "ensino", "educacao", "gestao", "inovacao",
}


class CpsRepositorySourceAdapter:
    """Consulta a API REST do DSpace usada pelo RIC-CPS."""

    source_name = "Repositório do Centro Paula Souza"

    def __init__(self, client: SourceHttpClient | None = None) -> None:
        self.client = client or SourceHttpClient()

    @staticmethod
    def is_relevant(query: str) -> bool:
        terms = set(normalized_text(query).split())
        return bool(terms.intersection(_CPS_TERMS))

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        if not self.is_relevant(query):
            return AdapterResult(self.source_name, status="skipped", message="Repositório institucional não é prioritário para a consulta.")
        try:
            payload = self.client.get_json(
                f"{RIC_CPS_BASE_URL}/server/api/discover/search/objects",
                params={"query": query, "size": max(1, min(limit, 10))},
            )
            sources = self._normalize_search(payload)
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta ao RIC-CPS indisponível ({type(exc).__name__}).")
        return AdapterResult(
            self.source_name,
            sources=sources[:limit],
            status="available" if sources else "no_results",
            message=None if sources else "O repositório não retornou documentos com resumo utilizável.",
        )

    def _normalize_search(self, payload: object) -> list[ResearchSource]:
        if not isinstance(payload, dict):
            return []
        embedded = payload.get("_embedded") or {}
        search_result = embedded.get("searchResult") if isinstance(embedded, dict) else {}
        result_embedded = search_result.get("_embedded") if isinstance(search_result, dict) else {}
        objects = result_embedded.get("objects", []) if isinstance(result_embedded, dict) else []
        sources: list[ResearchSource] = []
        for entry in objects:
            indexable = ((entry.get("_embedded") or {}).get("indexableObject") or {}) if isinstance(entry, dict) else {}
            metadata = indexable.get("metadata") or {}
            if not isinstance(metadata, dict):
                continue
            title = first_string(metadata, "dc.title", "dc.title.alternative")
            abstract = first_string(metadata, "dc.description.abstract", "dc.description")
            if not title or not abstract:
                continue
            identifier = first_string(metadata, "dc.identifier.uri") or indexable.get("uuid")
            public_url = identifier if isinstance(identifier, str) and identifier.startswith("http") else None
            if not public_url:
                uuid = indexable.get("uuid")
                public_url = f"{RIC_CPS_BASE_URL}/items/{uuid}" if isinstance(uuid, str) else RIC_CPS_BASE_URL
            sources.append(ResearchSource(
                id="",
                title=compact_text(title, max_length=500),
                url=public_url,
                extract=compact_text(abstract),
                consulted_at=accessed_at(),
                source_name=self.source_name,
                identifier=str(identifier) if identifier else None,
                published_at=first_string(metadata, "dc.date.issued", "dc.date.available"),
                author=first_string(metadata, "dc.contributor.author", "dc.contributor.advisor"),
                metadata={"tipo": first_string(metadata, "dc.type"), "comunidade": indexable.get("type")},
            ))
        return sources
