"""Seleção e execução concorrente dos adaptadores de fontes."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import replace
from typing import Any

from config.settings import SOURCE_MAX_RESULTS_PER_ADAPTER, SOURCE_MAX_WORKERS
from models.research_data import ResearchSource
from services.sources.base import AdapterResult, SourceAdapter
from services.sources.cps import CpsRepositorySourceAdapter
from services.sources.ibge import IbgeSourceAdapter
from services.sources.openalex import OpenAlexSourceAdapter
from services.sources.scielo import ScieloSourceAdapter
from services.sources.seade import SeadeSourceAdapter
from services.sources.wikipedia import WikipediaSourceAdapter


def _registered_source_adapters() -> list[SourceAdapter]:
    return [
        WikipediaSourceAdapter(),
        IbgeSourceAdapter(),
        SeadeSourceAdapter(),
        CpsRepositorySourceAdapter(),
        OpenAlexSourceAdapter(),
        ScieloSourceAdapter(),
    ]


def select_source_adapters(query: str) -> list[SourceAdapter]:
    """Seleciona fontes pertinentes sem consultar conectores irrelevantes."""
    return [
        adapter
        for adapter in _registered_source_adapters()
        if adapter.is_relevant(query)
    ]


def collect_current_sources(query: str) -> tuple[list[ResearchSource], list[dict[str, Any]]]:
    """Consulta fontes relevantes e retorna também o estado de cada conector."""
    registered_adapters = _registered_source_adapters()
    adapters = [adapter for adapter in registered_adapters if adapter.is_relevant(query)]
    selected_names = {adapter.source_name for adapter in adapters}
    results: dict[str, AdapterResult] = {}
    for adapter in registered_adapters:
        if adapter.source_name not in selected_names:
            results[adapter.source_name] = AdapterResult(
                adapter.source_name,
                status="skipped",
                message="Fonte não selecionada para esta consulta.",
            )

    with ThreadPoolExecutor(max_workers=min(SOURCE_MAX_WORKERS, len(adapters))) as executor:
        futures = {
            executor.submit(adapter.search, query, limit=SOURCE_MAX_RESULTS_PER_ADAPTER): adapter
            for adapter in adapters
        }
        for future in as_completed(futures):
            adapter = futures[future]
            try:
                results[adapter.source_name] = future.result()
            except Exception as exc:
                results[adapter.source_name] = AdapterResult(
                    adapter.source_name,
                    status="failed",
                    message=f"Falha inesperada no adaptador ({type(exc).__name__}).",
                )

    all_sources: list[ResearchSource] = []
    statuses: list[dict[str, Any]] = []
    for adapter in registered_adapters:
        result = results[adapter.source_name]
        statuses.append(result.to_status_dict())
        all_sources.extend(result.sources)

    normalized_sources = [
        replace(source, id=f"fonte_{index:02d}")
        for index, source in enumerate(all_sources, start=1)
    ]
    return normalized_sources, statuses
