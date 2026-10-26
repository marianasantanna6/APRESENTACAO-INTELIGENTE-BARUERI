from dataclasses import dataclass, field
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ResearchSource:
    """Representa uma fonte rastreável, com referência, trecho, data da consulta e metadados disponíveis."""
    id: str
    title: str
    url: str
    extract: str
    consulted_at: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        source = {
            "id": self.id,
            "titulo": self.title,
            "url": self.url,
            "trecho": self.extract,
        }
        if self.consulted_at:
            source["consultado_em"] = self.consulted_at
        if self.metadata:
            source["metadados"] = self.metadata
        return source


@dataclass
class ResearchData:
    """Agrupa tema pesquisado, resumo, palavras-chave, intenção e fontes antes de enviar os dados ao prompt."""
    title: str
    resumo_wiki: str
    keywords: list[str] = field(default_factory=list)
    detectar_intencao: str = "desconhecido"
    fontes: list[ResearchSource] = field(default_factory=list)
    query: str = ""

    def to_chain_input(self) -> dict:
        return {
            "titulo": self.query or self.title,
            "detectar_intencao": self.detectar_intencao,
            "fontes_fornecidas": json.dumps(
                [source.to_dict() for source in self.fontes],
                ensure_ascii=False,
                indent=2,
            ),
        }


@dataclass(frozen=True)
class RetrievedResearch:
    """Uma pesquisa anterior recuperada por similaridade, com metadados e fontes rastreáveis."""

    id: str
    query: str
    canonical_title: str
    content: str
    source: str
    source_url: str | None
    keywords: list[str]
    intent: str
    collected_at: str
    similarity: float
    sources: list[ResearchSource] = field(default_factory=list)


@dataclass(frozen=True)
class PresentationResult:
    '''Valida os slides, gere o caminho e a saida do RAG'''

    presentation: dict
    pptx_path: Path
    rag_status: str
    retrieved_count: int
