"""Seleção e execução concorrente dos adaptadores de fontes."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import replace

from config.settings import SOURCE_MAX_RESULTS_PER_ADAPTER, SOURCE_MAX_WORKERS
from models.research_data import ResearchSource
from services.sources.base import AdapterResult, SourceAdapter
from services.sources.cps import CpsRepositorySourceAdapter
from services.sources.ibge import IbgeSourceAdapter
from services.sources.openalex import OpenAlexSourceAdapter
from services.sources.scielo import ScieloSourceAdapter
from services.sources.seade import SeadeSourceAdapter
from services.sources.wikipedia import WikipediaSourceAdapter


def select_source_adapters(query: str) -> list[SourceAdapter]:
    """Seleciona fontes pertinentes; não consulta todas sem necessidade."""
    adapters: list[SourceAdapter] = [WikipediaSourceAdapter()]
    if IbgeSourceAdapter.is_relevant(query):
        adapters.append(IbgeSourceAdapter())
    if SeadeSourceAdapter.is_relevant(query):
        adapters.append(SeadeSourceAdapter())
    if CpsRepositorySourceAdapter.is_relevant(query):
        adapters.append(CpsRepositorySourceAdapter())
    if OpenAlexSourceAdapter.is_relevant(query):
        adapters.extend([OpenAlexSourceAdapter(), ScieloSourceAdapter()])
    return adapters


def collect_current_sources(query: str) -> tuple[list[ResearchSource], list[dict[str, object]]]:
    """Executa as fontes selecionadas e entrega IDs globais, estáveis na execução."""
    adapters = select_source_adapters(query)
    results: dict[str, AdapterResult] = {}
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
    statuses: list[dict[str, object]] = []
    for adapter in adapters:
        result = results[adapter.source_name]
        statuses.append(result.to_status_dict())
        all_sources.extend(result.sources)

    normalized_sources = [
        replace(source, id=f"fonte_{index:02d}")
        for index, source in enumerate(all_sources, start=1)
    ]
    return normalized_sources, statuses
