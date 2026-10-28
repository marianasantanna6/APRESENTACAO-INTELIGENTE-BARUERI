"""Contrato comum para adaptadores de fontes de pesquisa."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from models.research_data import ResearchSource


@dataclass(frozen=True)
class AdapterResult:
    """Resultado semântico de uma execução de adaptador, inclusive falhas."""

    source_name: str
    sources: list[ResearchSource] = field(default_factory=list)
    status: str = "no_results"
    message: str | None = None

    def to_status_dict(self) -> dict[str, object]:
        value: dict[str, object] = {
            "fonte": self.source_name,
            "status": self.status,
            "resultados": len(self.sources),
        }
        if self.message:
            value["mensagem"] = self.message
        return value


class SourceAdapter(Protocol):
    """Interface que todos os conectores devem expor."""

    source_name: str

    def search(self, query: str, *, limit: int = 3) -> AdapterResult:
        """Busca e normaliza evidências verificáveis para uma consulta."""
