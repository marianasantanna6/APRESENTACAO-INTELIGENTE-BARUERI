"""Adaptador da API oficial de dados agregados do IBGE."""

from __future__ import annotations

from dataclasses import replace
from typing import Any

from config.settings import IBGE_AGGREGATES_URL, IBGE_LOCALITIES_URL
from models.research_data import ResearchSource
from services.sources.base import AdapterResult
from services.sources.common import accessed_at, normalized_text
from services.sources.http import SourceHttpClient


# Censo Demográfico 2022: população residente. O identificador é público e
# documentado pela API de Agregados do IBGE.
_POPULATION_DESCRIPTOR = {
    "aggregate": "4709",
    "period": "2022",
    "variable": "93",
    "label": "População residente",
}
_STATISTICAL_TERMS = {"populacao", "demografia", "demografico", "habitantes", "censo"}
_MUNICIPALITIES: list[dict[str, Any]] | None = None


class IbgeSourceAdapter:
    source_name = "IBGE"

    def __init__(self, client: SourceHttpClient | None = None) -> None:
        self.client = client or SourceHttpClient()

    @staticmethod
    def is_relevant(query: str) -> bool:
        terms = set(normalized_text(query).split())
        return bool(terms.intersection(_STATISTICAL_TERMS))

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        if not self.is_relevant(query):
            return AdapterResult(self.source_name, status="skipped", message="Consulta sem indicador demográfico mapeado.")

        try:
            locality = self._resolve_locality(query)
            locality_filter = f"N6[{locality['id']}]" if locality else "N1[all]"
            descriptor = _POPULATION_DESCRIPTOR
            url = (
                f"{IBGE_AGGREGATES_URL}/{descriptor['aggregate']}/periodos/"
                f"{descriptor['period']}/variaveis/{descriptor['variable']}"
            )
            payload = self.client.get_json(url, params={"localidades": locality_filter})
            sources = self._normalize_population(payload, url, locality_filter)
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta ao IBGE indisponível ({type(exc).__name__}).")

        return AdapterResult(
            self.source_name,
            sources=sources[:limit],
            status="available" if sources else "no_results",
            message=None if sources else "A API não retornou série utilizável para a consulta.",
        )

    def _resolve_locality(self, query: str) -> dict[str, Any] | None:
        """Localiza um município explicitamente citado; sem ele, consulta Brasil."""
        global _MUNICIPALITIES
        normalized_query = f" {normalized_text(query)} "
        if " brasil " in normalized_query or " nacional " in normalized_query:
            return None
        if _MUNICIPALITIES is None:
            payload = self.client.get_json(f"{IBGE_LOCALITIES_URL}/municipios")
            _MUNICIPALITIES = payload if isinstance(payload, list) else []
        matches = []
        for municipality in _MUNICIPALITIES:
            name = municipality.get("nome") if isinstance(municipality, dict) else None
            if not isinstance(name, str):
                continue
            normalized_name = normalized_text(name)
            if normalized_name and f" {normalized_name} " in normalized_query:
                matches.append(municipality)
        return max(matches, key=lambda item: len(str(item.get("nome", ""))), default=None)

    def _normalize_population(self, payload: object, url: str, locality_filter: str) -> list[ResearchSource]:
        if not isinstance(payload, list):
            return []
        sources: list[ResearchSource] = []
        for variable_data in payload:
            if not isinstance(variable_data, dict):
                continue
            variable = variable_data.get("variavel") or _POPULATION_DESCRIPTOR["label"]
            unit = variable_data.get("unidade") or ""
            for result in variable_data.get("resultados", []):
                if not isinstance(result, dict):
                    continue
                for series in result.get("series", []):
                    if not isinstance(series, dict):
                        continue
                    locality = series.get("localidade") or {}
                    values = series.get("serie") or {}
                    value = values.get(_POPULATION_DESCRIPTOR["period"])
                    location_name = locality.get("nome") if isinstance(locality, dict) else None
                    if value is None or not isinstance(location_name, str):
                        continue
                    period = _POPULATION_DESCRIPTOR["period"]
                    value_text = str(value)
                    extract = f"{variable} de {location_name}: {value_text} {unit} (referência {period})."
                    sources.append(ResearchSource(
                        id="",
                        title=f"IBGE — {variable} ({period}) — {location_name}",
                        url=f"{url}?localidades={locality_filter}",
                        extract=extract,
                        consulted_at=accessed_at(),
                        source_name=self.source_name,
                        identifier=(
                            f"agregado:{_POPULATION_DESCRIPTOR['aggregate']};"
                            f"variavel:{_POPULATION_DESCRIPTOR['variable']};"
                            f"localidade:{locality.get('id', locality_filter)}"
                        ),
                        author="Instituto Brasileiro de Geografia e Estatística",
                        reference_date=period,
                        data={"valor": value_text, "unidade": unit, "periodo": period, "localidade": location_name},
                        metadata={"agregado": _POPULATION_DESCRIPTOR["aggregate"], "variavel": _POPULATION_DESCRIPTOR["variable"]},
                    ))
        return sources
