"""Associação verificável entre o conteúdo dos slides e as evidências coletadas."""

from __future__ import annotations

import re
from typing import Iterable

from models.research_data import ClaimEvidence, ResearchSource
from services.sources.common import normalized_text


_STOPWORDS = {
    "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em",
    "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "que", "se", "um", "uma",
    "sobre", "entre", "como", "mais", "menos", "sua", "seu", "suas", "seus",
}
_NUMERIC_PATTERN = re.compile(r"\d+(?:[.,]\d+)?")


def _tokens(value: str) -> set[str]:
    return {
        token for token in normalized_text(value).split()
        if len(token) >= 3 and token not in _STOPWORDS and not token.isdigit()
    }


def _source_text(source: ResearchSource) -> str:
    return " ".join((source.title, source.extract, str(source.data), str(source.metadata)))


def _evidence_snapshot(source: ResearchSource) -> dict[str, object]:
    return {
        "id": source.id,
        "titulo": source.title,
        "url": source.url,
        "trecho": source.extract,
        "data_referencia": source.reference_date,
    }


def _verification_status(text: str, sources: Iterable[ResearchSource]) -> tuple[str, list[dict[str, object]]]:
    claim_tokens = _tokens(text)
    numeric_tokens = [token.replace(",", ".") for token in _NUMERIC_PATTERN.findall(text)]
    best_overlap = 0
    evidence: list[dict[str, object]] = []
    numeric_match = False
    for source in sources:
        source_text = _source_text(source)
        overlap = len(claim_tokens.intersection(_tokens(source_text)))
        normal_source_numbers = {token.replace(",", ".") for token in _NUMERIC_PATTERN.findall(source_text)}
        this_numeric_match = bool(numeric_tokens) and all(token in normal_source_numbers for token in numeric_tokens)
        if overlap or this_numeric_match:
            snapshot = _evidence_snapshot(source)
            snapshot["termos_em_comum"] = overlap
            snapshot["numeros_confirmados"] = this_numeric_match
            evidence.append(snapshot)
        best_overlap = max(best_overlap, overlap)
        numeric_match = numeric_match or this_numeric_match
    if numeric_tokens and numeric_match:
        return "verificada_numerica", evidence
    if best_overlap >= 2:
        return "verificada_textual", evidence
    return "evidencia_insuficiente", evidence


def _claim(
    claim_id: str,
    text: str,
    source_ids: list[str],
    sources_by_id: dict[str, ResearchSource],
    *,
    numeric_value: str | None = None,
    unit: str | None = None,
) -> ClaimEvidence:
    sources = [sources_by_id[source_id] for source_id in source_ids if source_id in sources_by_id]
    status, evidence = _verification_status(text, sources)
    reference_date = sources[0].reference_date if len(sources) == 1 else None
    locality = None
    if len(sources) == 1:
        locality = sources[0].data.get("localidade") if isinstance(sources[0].data.get("localidade"), str) else None
    return ClaimEvidence(
        id=claim_id,
        text=text,
        source_ids=source_ids,
        verification_status=status,
        evidence=evidence,
        numeric_value=numeric_value,
        unit=unit,
        reference_date=reference_date,
        locality=locality,
    )


def build_claim_evidence(presentation: dict, sources: list[ResearchSource]) -> list[ClaimEvidence]:
    """Extrai cada afirmação factual renderizável dos slides já validados."""
    sources_by_id = {source.id: source for source in sources}
    claims: list[ClaimEvidence] = []
    for slide_index, slide in enumerate(presentation.get("slides", []), start=1):
        source_ids = list(slide.get("fontes") or [])
        if not source_ids:
            continue
        prefix = f"slide_{slide_index:02d}"
        support_text = slide.get("texto_apoio") or ""
        if support_text:
            claims.append(_claim(f"{prefix}_apoio", support_text, source_ids, sources_by_id))
        for point_index, point in enumerate(slide.get("pontos") or [], start=1):
            claims.append(_claim(f"{prefix}_ponto_{point_index:02d}", point, source_ids, sources_by_id))
        for kpi_index, kpi in enumerate(slide.get("kpis") or [], start=1):
            value = str(kpi.get("valor") or "")
            unit = str(kpi.get("unidade") or "")
            label = str(kpi.get("label") or "")
            text = " ".join(part for part in (label, value, unit) if part).strip()
            if text:
                claims.append(_claim(
                    f"{prefix}_kpi_{kpi_index:02d}", text, source_ids, sources_by_id,
                    numeric_value=value or None, unit=unit or None,
                ))
        citation = slide.get("citacao") or {}
        if isinstance(citation, dict) and citation.get("texto"):
            claims.append(_claim(f"{prefix}_citacao", str(citation["texto"]), source_ids, sources_by_id))
        for block_index, block in enumerate(slide.get("blocos") or [], start=1):
            if not isinstance(block, dict):
                continue
            for point_index, point in enumerate(block.get("pontos") or [], start=1):
                claims.append(_claim(
                    f"{prefix}_bloco_{block_index:02d}_ponto_{point_index:02d}",
                    str(point), source_ids, sources_by_id,
                ))
        for item_index, item in enumerate(slide.get("reconhecimentos") or [], start=1):
            if not isinstance(item, dict):
                continue
            text = ": ".join(
                part for part in (str(item.get("nome") or ""), str(item.get("descricao") or "")) if part
            )
            if text:
                claims.append(_claim(f"{prefix}_reconhecimento_{item_index:02d}", text, source_ids, sources_by_id))
    return claims


def require_supported_claims(claims: list[ClaimEvidence]) -> None:
    """Bloqueia conteúdo factual para o qual o vínculo declarado não trouxe evidência suficiente."""
    unsupported = [claim for claim in claims if claim.verification_status == "evidencia_insuficiente"]
    if not unsupported:
        return
    examples = "; ".join(f"{claim.id}: {claim.text}" for claim in unsupported[:3])
    raise ValueError(
        "Há afirmações sem correspondência textual ou numérica suficiente nas fontes citadas: "
        f"{examples}."
    )
