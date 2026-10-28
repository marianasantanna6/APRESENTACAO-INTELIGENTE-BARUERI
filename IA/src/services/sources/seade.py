"""Adaptador do catálogo oficial de dados abertos do Estado de São Paulo para conjuntos da Seade."""

from __future__ import annotations

from typing import Any

from config.settings import SEADE_CKAN_API_URL
from models.research_data import ResearchSource
from services.sources.base import AdapterResult
from services.sources.common import accessed_at, compact_text, normalized_text
from services.sources.http import SourceHttpClient


_SAO_PAULO_TERMS = {"sao", "paulo", "paulista", "seade", "sp"}
_STATISTICAL_TERMS = {"indicador", "indicadores", "populacao", "economia", "emprego", "educacao", "saude", "estatistica", "municipio"}


class SeadeSourceAdapter:
    """Descobre conjuntos publicados pela Seade e amostras DataStore quando disponíveis."""

    source_name = "SEADE"

    def __init__(self, client: SourceHttpClient | None = None) -> None:
        self.client = client or SourceHttpClient()

    @staticmethod
    def is_relevant(query: str) -> bool:
        terms = set(normalized_text(query).split())
        return bool(terms.intersection(_SAO_PAULO_TERMS)) and bool(terms.intersection(_STATISTICAL_TERMS))

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        if not self.is_relevant(query):
            return AdapterResult(self.source_name, status="skipped", message="Fonte estadual não é prioritária para a consulta.")
        try:
            payload = self.client.get_json(
                f"{SEADE_CKAN_API_URL}/package_search",
                params={"q": query, "rows": max(1, min(limit * 3, 10))},
            )
            packages = self._seade_packages(payload)
            sources = [source for package in packages for source in self._normalize_package(package)]
        except Exception as exc:
            return AdapterResult(self.source_name, status="failed", message=f"Consulta ao catálogo Seade indisponível ({type(exc).__name__}).")

        return AdapterResult(
            self.source_name,
            sources=sources[:limit],
            status="available" if sources else "no_results",
            message=None if sources else "Nenhum conjunto publicado pela Seade correspondeu à consulta.",
        )

    @staticmethod
    def _seade_packages(payload: object) -> list[dict[str, Any]]:
        if not isinstance(payload, dict) or not payload.get("success"):
            return []
        results = payload.get("result", {}).get("results", [])
        packages: list[dict[str, Any]] = []
        for package in results:
            if not isinstance(package, dict):
                continue
            organizations = package.get("organizations") or []
            organization_text = " ".join(
                str(org.get("title") or org.get("name") or "")
                for org in organizations if isinstance(org, dict)
            ).lower()
            if "seade" in organization_text:
                packages.append(package)
        return packages

    def _normalize_package(self, package: dict[str, Any]) -> list[ResearchSource]:
        title = compact_text(package.get("title"), max_length=300)
        description = compact_text(package.get("notes"), max_length=1_100)
        package_name = compact_text(package.get("name"), max_length=200)
        if not title or not package_name:
            return []
        page_url = f"https://dadosabertos.sp.gov.br/dataset/{package_name}"
        resources = [item for item in package.get("resources", []) if isinstance(item, dict)]
        resource = next((item for item in resources if item.get("datastore_active")), None)
        if resource is None and resources:
            resource = resources[0]
        sample = self._datastore_sample(resource) if resource else []
        data: dict[str, Any] = {}
        if sample:
            data["amostra_registros"] = sample
        if resource:
            data["recurso"] = {
                "nome": compact_text(resource.get("name"), max_length=300),
                "formato": compact_text(resource.get("format"), max_length=50),
                "url": compact_text(resource.get("url"), max_length=1_000),
            }
        extract_parts = [description] if description else []
        if sample:
            extract_parts.append(f"Amostra de registros publicados: {compact_text(sample, max_length=650)}")
        elif resource:
            extract_parts.append("A distribuição de dados está disponível no recurso vinculado.")
        extract = " ".join(extract_parts).strip()
        if not extract:
            return []
        return [ResearchSource(
            id="",
            title=f"SEADE — {title}",
            url=page_url,
            extract=extract,
            consulted_at=accessed_at(),
            source_name=self.source_name,
            identifier=str(package.get("id") or package_name),
            updated_at=package.get("metadata_modified") if isinstance(package.get("metadata_modified"), str) else None,
            author="Fundação Sistema Estadual de Análise de Dados",
            data=data,
            metadata={"dataset": package_name, "licenca": package.get("license_title")},
        )]

    def _datastore_sample(self, resource: dict[str, Any]) -> list[dict[str, Any]]:
        resource_id = resource.get("id")
        if not resource.get("datastore_active") or not isinstance(resource_id, str):
            return []
        try:
            payload = self.client.get_json(
                f"{SEADE_CKAN_API_URL}/datastore_search",
                params={"resource_id": resource_id, "limit": 3},
            )
        except Exception:
            return []
        records = payload.get("result", {}).get("records", []) if isinstance(payload, dict) else []
        return [record for record in records if isinstance(record, dict)][:3]
