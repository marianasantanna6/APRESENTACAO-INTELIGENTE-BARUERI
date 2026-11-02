from dataclasses import dataclass, field
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ResearchSource:
    """Fonte rastreável normalizada, independentemente do adaptador que a coletou."""
    id: str
    title: str
    url: str
    extract: str
    consulted_at: str | None = None
    source_name: str | None = None
    identifier: str | None = None
    published_at: str | None = None
    updated_at: str | None = None
    author: str | None = None
    reference_date: str | None = None
    data: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        source = {
            "id": self.id,
            "titulo": self.title,
            "trecho": self.extract,
        }
        if self.url:
            source["url"] = self.url
        if self.consulted_at:
            source["consultado_em"] = self.consulted_at
        if self.source_name:
            source["fonte"] = self.source_name
        if self.identifier:
            source["identificador"] = self.identifier
        if self.published_at:
            source["publicado_em"] = self.published_at
        if self.updated_at:
            source["atualizado_em"] = self.updated_at
        if self.author:
            source["autor_ou_instituicao"] = self.author
        if self.reference_date:
            source["data_referencia"] = self.reference_date
        if self.data:
            source["dados"] = self.data
        if self.metadata:
            source["metadados"] = self.metadata
        return source


@dataclass
class ResearchData:
    """Agrupa consulta, contexto declarado e evidências antes da geração."""
    title: str
    resumo_wiki: str
    keywords: list[str] = field(default_factory=list)
    detectar_intencao: str = "desconhecido"
    fontes: list[ResearchSource] = field(default_factory=list)
    query: str = ""
    request_context: dict[str, Any] = field(default_factory=dict)
    source_status: list[dict[str, Any]] = field(default_factory=list)

    def to_chain_input(self) -> dict:
        return {
            "titulo": self.query or self.title,
            "detectar_intencao": self.detectar_intencao,
            "contexto_solicitacao": json.dumps(
                self.request_context,
                ensure_ascii=False,
                indent=2,
            ),
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
class ClaimEvidence:
    """Afirmação exibida e as evidências usadas para revisá-la posteriormente."""

    id: str
    text: str
    source_ids: list[str]
    verification_status: str
    evidence: list[dict[str, Any]] = field(default_factory=list)
    numeric_value: str | None = None
    unit: str | None = None
    reference_date: str | None = None
    locality: str | None = None

    def to_dict(self) -> dict[str, Any]:
        value: dict[str, Any] = {
            "id": self.id,
            "texto": self.text,
            "fontes": self.source_ids,
            "status_verificacao": self.verification_status,
            "evidencias": self.evidence,
        }
        if self.numeric_value is not None:
            value["valor_numerico"] = self.numeric_value
        if self.unit is not None:
            value["unidade"] = self.unit
        if self.reference_date is not None:
            value["data_referencia"] = self.reference_date
        if self.locality is not None:
            value["localidade"] = self.locality
        return value


@dataclass(frozen=True)
class PresentationResult:
    """Resultado interno pronto para a camada HTTP ou a integração do backend."""

    presentation: dict
    pptx_path: Path
    rag_status: str
    retrieved_count: int
    sources: list[ResearchSource] = field(default_factory=list)
    claims: list[ClaimEvidence] = field(default_factory=list)
    source_status: list[dict[str, Any]] = field(default_factory=list)
