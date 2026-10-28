"""Adaptador de busca pública da SciELO com coleta de metadados do artigo."""

from __future__ import annotations

from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin

from config.settings import SCIELO_SEARCH_URL
from models.research_data import ResearchSource
from services.sources.base import AdapterResult
from services.sources.common import accessed_at, compact_text, normalized_text
from services.sources.http import SourceHttpClient


_ACADEMIC_TERMS = {
    "artigo", "artigos", "academico", "academica", "cientifico", "cientifica",
    "literatura", "evidencia", "evidencias", "pesquisa", "teoria", "revisao",
    "tecnologia", "gestao", "politica", "solucao", "solucoes",
}


class _ResultLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        href = dict(attrs).get("href")
        if isinstance(href, str) and ("/j/" in href or "/article/" in href):
            self.links.append(href)


class _MetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, list[str]] = {}
        self._in_title = False
        self._title_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): value for key, value in attrs}
        if tag == "meta":
            key = (attributes.get("name") or attributes.get("property") or "").lower()
            value = attributes.get("content")
            if key and value:
                self.meta.setdefault(key, []).append(value)
        elif tag == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self._title_parts.append(data)

    def first(self, *keys: str) -> str | None:
        for key in keys:
            values = self.meta.get(key.lower(), [])
            if values and values[0].strip():
                return values[0].strip()
        title = " ".join(self._title_parts).strip()
        return title or None


class ScieloSourceAdapter:
    source_name = "SciELO"

    def __init__(self, client: SourceHttpClient | None = None) -> None:
        self.client = client or SourceHttpClient()

    @staticmethod
    def is_relevant(query: str) -> bool:
        return bool(set(normalized_text(query).split()).intersection(_ACADEMIC_TERMS))

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        if not self.is_relevant(query):
            return AdapterResult(self.source_name, status="skipped", message="Literatura revisada por pares não é prioritária para a consulta.")
        try:
            html = self.client.get_text(
                SCIELO_SEARCH_URL,
                params={
                    "q": f"subject:({query}) AND in:scl",
                    "lang": "pt",
                    "count": max(1, min(limit, 10)),
                    "from": 0,
                    "output": "site",
                    "format": "summary",
                    "page": 1,
                },
            )
            links = self._result_links(html)[:limit]
            sources = [source for link in links for source in self._article_source(link)]
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta à SciELO indisponível ({type(exc).__name__}).")
        return AdapterResult(
            self.source_name,
            sources=sources,
            status="available" if sources else "no_results",
            message=None if sources else "A busca não retornou artigos com metadados e resumo verificáveis.",
        )

    @staticmethod
    def _result_links(html: str) -> list[str]:
        parser = _ResultLinkParser()
        parser.feed(html)
        return list(dict.fromkeys(urljoin("https://www.scielo.br", link) for link in parser.links))

    def _article_source(self, url: str) -> list[ResearchSource]:
        try:
            html = self.client.get_text(url)
        except Exception:
            return []
        parser = _MetaParser()
        parser.feed(html)
        title = parser.first("citation_title", "og:title")
        abstract = parser.first("citation_abstract", "description", "og:description")
        if not title or not abstract:
            return []
        authors = parser.meta.get("citation_author", [])
        return [ResearchSource(
            id="",
            title=compact_text(title, max_length=500),
            url=url,
            extract=compact_text(abstract),
            consulted_at=accessed_at(),
            source_name=self.source_name,
            identifier=parser.first("citation_doi", "citation_id"),
            published_at=parser.first("citation_publication_date", "article:published_time"),
            author="; ".join(authors) if authors else None,
            metadata={"periodico": parser.first("citation_journal_title"), "doi": parser.first("citation_doi")},
        )]
