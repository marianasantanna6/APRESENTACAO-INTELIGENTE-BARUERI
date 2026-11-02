"""Adaptador da API pública do OpenAlex para literatura acadêmica."""

from __future__ import annotations

from typing import Any

from config.settings import OPENALEX_API_KEY, OPENALEX_API_URL, OPENALEX_MAILTO
from models.research_data import ResearchSource
from services.sources.base import AdapterResult
from services.sources.common import accessed_at, compact_text
from services.sources.http import SourceHttpClient


_ACADEMIC_TERMS = {
    "artigo", "artigos", "academico", "academica", "cientifico", "cientifica",
    "literatura", "evidencia", "evidencias", "pesquisa", "teoria", "revisao",
    "tecnologia", "gestao", "politica", "solucao", "solucoes",
}


class OpenAlexSourceAdapter:
    source_name = "OpenAlex"

    def __init__(self, client: SourceHttpClient | None = None) -> None:
        self.client = client or SourceHttpClient()

    @staticmethod
    def is_relevant(query: str) -> bool:
        from services.sources.common import normalized_text
        return bool(set(normalized_text(query).split()).intersection(_ACADEMIC_TERMS))

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        params: dict[str, Any] = {
            "search": query,
            "per-page": max(1, min(limit, 10)),
            "select": (
                "id,doi,display_name,publication_date,updated_date,authorships,"
                "primary_location,abstract_inverted_index,type,open_access"
            ),
        }
        if OPENALEX_API_KEY:
            params["api_key"] = OPENALEX_API_KEY
        if OPENALEX_MAILTO:
            params["mailto"] = OPENALEX_MAILTO
        try:
            payload = self.client.get_json(f"{OPENALEX_API_URL}/works", params=params)
            works = payload.get("results", []) if isinstance(payload, dict) else []
            sources = [source for work in works if isinstance(work, dict) for source in self._normalize_work(work)]
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta ao OpenAlex indisponível ({type(exc).__name__}).")
        return AdapterResult(
            self.source_name,
            sources=sources[:limit],
            status="available" if sources else "no_results",
            message=None if sources else "A busca não retornou trabalhos com resumo verificável.",
        )

    def _normalize_work(self, work: dict[str, Any]) -> list[ResearchSource]:
        title = compact_text(work.get("display_name"), max_length=500)
        abstract = self._abstract_from_inverted_index(work.get("abstract_inverted_index"))
        location = work.get("primary_location") or {}
        landing_page = location.get("landing_page_url") if isinstance(location, dict) else None
        url = work.get("doi") or landing_page or work.get("id")
        if not isinstance(url, str) or not title or not abstract:
            return []
        authors = []
        for authorship in work.get("authorships", []) or []:
            author = authorship.get("author") if isinstance(authorship, dict) else None
            name = author.get("display_name") if isinstance(author, dict) else None
            if isinstance(name, str) and name.strip():
                authors.append(name.strip())
        source_data = location.get("source") if isinstance(location, dict) else {}
        journal = source_data.get("display_name") if isinstance(source_data, dict) else None
        extract = compact_text(abstract, max_length=1_800)
        if not extract:
            return []
        return [ResearchSource(
            id="",
            title=title,
            url=url,
            extract=extract,
            consulted_at=accessed_at(),
            source_name=self.source_name,
            identifier=str(work.get("id") or ""),
            published_at=work.get("publication_date") if isinstance(work.get("publication_date"), str) else None,
            updated_at=work.get("updated_date") if isinstance(work.get("updated_date"), str) else None,
            author="; ".join(authors) if authors else None,
            metadata={
                "doi": work.get("doi"),
                "tipo": work.get("type"),
                "periodico": journal,
                "acesso_aberto": (work.get("open_access") or {}).get("is_oa") if isinstance(work.get("open_access"), dict) else None,
            },
        )]

    @staticmethod
    def _abstract_from_inverted_index(value: object) -> str:
        if not isinstance(value, dict):
            return ""
        positions: list[tuple[int, str]] = []
        for token, indexes in value.items():
            if not isinstance(token, str) or not isinstance(indexes, list):
                continue
            positions.extend((index, token) for index in indexes if isinstance(index, int))
        return " ".join(token for _, token in sorted(positions))
