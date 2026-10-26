'''Valida e canoniza a pesquisa estruturada antes da renderização do PPTX.'''

from collections.abc import Mapping, Sequence
import re

from config.pptx_style import load_style_guide, title_character_limit
from models.research_data import ResearchSource


def _as_text(value: object, field: str, *, allow_empty: bool = False) -> str:
    if value is None and allow_empty:
        return ""
    if not isinstance(value, str):
        raise ValueError(f"O campo '{field}' precisa ser texto.")
    text = value.strip()
    if not text and not allow_empty:
        raise ValueError(f"O campo '{field}' não pode ficar vazio.")
    return text


def _string_list(value: object, field: str) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ValueError(f"O campo '{field}' precisa ser uma lista de textos.")
    return [item.strip() for item in value if item.strip()]


def _source_ids(value: object, known_ids: set[str], slide_number: int) -> list[str]:
    ids = _string_list(value, f"slides[{slide_number}].fontes")
    unknown = sorted(set(ids).difference(known_ids))
    if unknown:
        raise ValueError(
            f"O slide {slide_number + 1} cita IDs de fonte inexistentes: {', '.join(unknown)}."
        )
    return list(dict.fromkeys(ids))


def _validate_kpis(
    value: object, slide_number: int, maximum: int, maximum_label_words: int
) -> list[dict[str, str]]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError(f"Os KPIs do slide {slide_number + 1} precisam ser uma lista.")
    if len(value) > maximum:
        raise ValueError(f"O slide {slide_number + 1} excede o limite de {maximum} KPIs.")

    kpis: list[dict[str, str]] = []
    for index, item in enumerate(value, start=1):
        if not isinstance(item, Mapping):
            raise ValueError(f"O KPI {index} do slide {slide_number + 1} precisa ser um objeto.")
        valor = _as_text(item.get("valor"), f"slides[{slide_number}].kpis[{index}].valor")
        label = _as_text(item.get("label"), f"slides[{slide_number}].kpis[{index}].label")
        unidade = _as_text(
            item.get("unidade"), f"slides[{slide_number}].kpis[{index}].unidade", allow_empty=True
        )
        if len(label.split()) > maximum_label_words:
            raise ValueError(
                f"O rótulo do KPI {index} no slide {slide_number + 1} excede "
                f"{maximum_label_words} palavras."
            )
        kpis.append({"valor": valor, "unidade": unidade, "label": label})
    return kpis


def validate_presentation(
    payload: object,
    sources: Sequence[ResearchSource],
    topic: str,
) -> dict:
    """Valida e normaliza o JSON do modelo conforme o guia visual, incluindo layouts, limites de texto e citações verificáveis. Acrescenta metadados de fonte confiáveis e garante capa, encerramento e referências para o renderizador."""
    if not isinstance(payload, Mapping):
        raise ValueError("A resposta da IA precisa ser um objeto JSON.")

    guide = load_style_guide()
    rules = guide["regras_de_conteudo_e_concisao"]
    layout_catalog = guide["catalogo_de_layouts"]
    max_points = int(rules["bullet_points"]["max_por_slide"])
    max_words_per_point = int(rules["bullet_points"]["max_palavras_por_item"])
    max_text_words = min(
        int(rules["texto_de_apoio_max_palavras"]),
        int(rules["titulos"].get("max_palavras_texto_apoio", rules["texto_de_apoio_max_palavras"])),
    ) if "texto_de_apoio_max_palavras" in rules else 35
    max_title_chars = int(rules["titulos"]["max_caracteres"])
    max_kpis = int(rules["kpis_e_estatisticas"]["max_kpis_por_slide"])
    max_kpi_label_words = int(rules["kpis_e_estatisticas"]["label_kpi_max_palavras"])
    tags_element = next(
        (
            element
            for element in layout_catalog.get("nuvem_de_tags", {}).get("elementos", [])
            if element.get("id") == "itens_nuvem"
        ),
        {},
    )
    max_tags = int(tags_element.get("regras", {}).get("max_itens", 25))
    recognition_element = next(
        (
            element
            for element in layout_catalog.get("reconhecimento", {}).get("elementos", [])
            if element.get("id") == "grade_premios"
        ),
        {},
    )
    max_recognitions = int(recognition_element.get("badge_template", {}).get("max_itens", 8))
    allowed_layouts = set(layout_catalog).difference({"referencias"})

    title = _as_text(payload.get("titulo") or topic, "titulo")
    cover_title_limit = title_character_limit(guide, "capa")
    if len(title) > cover_title_limit:
        raise ValueError(
            f"O título da apresentação excede o limite de {cover_title_limit} caracteres da capa."
        )
    subtitle = _as_text(payload.get("subtitulo"), "subtitulo", allow_empty=True)
    raw_slides = payload.get("slides")
    if not isinstance(raw_slides, list):
        raise ValueError("A resposta precisa conter 'slides' como lista.")
    if len(raw_slides) > 9:
        raise ValueError("A apresentação excede o limite de 9 slides antes da página automática de referências.")
    if not raw_slides:
        raise ValueError("A IA não retornou nenhum slide.")

    canonical_sources = {source.id: source for source in sources}
    known_ids = set(canonical_sources)
    slides: list[dict] = []
    for slide_number, raw in enumerate(raw_slides):
        if not isinstance(raw, Mapping):
            raise ValueError(f"O slide {slide_number + 1} precisa ser um objeto JSON.")

        layout = _as_text(raw.get("tipo_layout"), f"slides[{slide_number}].tipo_layout")
        if layout not in allowed_layouts:
            raise ValueError(
                f"Layout '{layout}' não existe no guia visual. Layouts válidos: "
                f"{', '.join(sorted(allowed_layouts))}."
            )

        slide_title = _as_text(
            raw.get("titulo"), f"slides[{slide_number}].titulo", allow_empty=layout == "encerramento"
        )
        if len(slide_title) > max_title_chars:
            raise ValueError(f"O título do slide {slide_number + 1} excede {max_title_chars} caracteres.")
        layout_title_limit = title_character_limit(guide, layout)
        if layout_title_limit < max_title_chars and len(slide_title) > layout_title_limit:
            raise ValueError(
                f"O título do slide {slide_number + 1} excede o limite de "
                f"{layout_title_limit} caracteres do layout '{layout}'."
            )

        support_text = _as_text(
            raw.get("texto_apoio"), f"slides[{slide_number}].texto_apoio", allow_empty=True
        )
        if len(support_text.split()) > max_text_words:
            raise ValueError(f"O texto de apoio do slide {slide_number + 1} excede {max_text_words} palavras.")

        points = _string_list(raw.get("pontos"), f"slides[{slide_number}].pontos")
        if len(points) > max_points:
            raise ValueError(f"O slide {slide_number + 1} excede o limite de {max_points} pontos.")
        if any(len(point.split()) > max_words_per_point for point in points):
            raise ValueError(
                f"Cada ponto do slide {slide_number + 1} pode ter no máximo {max_words_per_point} palavras."
            )

        kpis = _validate_kpis(raw.get("kpis"), slide_number, max_kpis, max_kpi_label_words)
        source_ids = _source_ids(raw.get("fontes"), known_ids, slide_number)
        tags = _string_list(raw.get("tags"), f"slides[{slide_number}].tags")
        if len(tags) > max_tags:
            raise ValueError(f"O slide {slide_number + 1} excede o limite de {max_tags} tags.")

        blocks = raw.get("blocos") or []
        if not isinstance(blocks, list) or len(blocks) > 4:
            raise ValueError(f"O slide {slide_number + 1} pode conter no máximo 4 blocos de infográfico.")
        normalized_blocks = []
        for block_index, block in enumerate(blocks, start=1):
            if not isinstance(block, Mapping):
                raise ValueError(f"O bloco {block_index} do slide {slide_number + 1} precisa ser um objeto.")
            block_title = _as_text(
                block.get("titulo"), f"slides[{slide_number}].blocos[{block_index}].titulo"
            )
            block_points = _string_list(
                block.get("pontos"), f"slides[{slide_number}].blocos[{block_index}].pontos"
            )
            if len(block_points) > max_points or any(
                len(point.split()) > max_words_per_point for point in block_points
            ):
                raise ValueError(f"Os pontos do bloco {block_index} excedem os limites visuais.")
            normalized_blocks.append({"titulo": block_title, "pontos": block_points})

        citation = raw.get("citacao") or {}
        if citation and not isinstance(citation, Mapping):
            raise ValueError(f"A citação do slide {slide_number + 1} precisa ser um objeto.")
        if citation and layout != "destaque_citacao":
            raise ValueError(
                f"O slide {slide_number + 1} usa citacao, mas o campo só pode ser preenchido no layout 'destaque_citacao'. "
                "Em outros layouts, use citacao null."
            )
        recognition = raw.get("reconhecimentos") or []
        if not isinstance(recognition, list) or len(recognition) > max_recognitions:
            raise ValueError(
                f"Os reconhecimentos do slide {slide_number + 1} precisam ser uma lista com no máximo "
                f"{max_recognitions} itens."
            )
        normalized_recognition = []
        for item in recognition:
            if not isinstance(item, Mapping):
                raise ValueError(f"O reconhecimento do slide {slide_number + 1} precisa ser um objeto.")
            normalized_recognition.append({
                "nome": _as_text(item.get("nome"), "reconhecimentos.nome"),
                "descricao": _as_text(item.get("descricao"), "reconhecimentos.descricao", allow_empty=True),
            })
        normalized_citation = {}
        if citation:
            normalized_citation = {
                "texto": _as_text(citation.get("texto"), "citacao.texto"),
                "autor": _as_text(citation.get("autor"), "citacao.autor", allow_empty=True),
            }
            quote_limit = int(
                next(
                    (element for element in layout_catalog.get(layout, {}).get("elementos", [])
                     if element.get("id") == "texto_destaque"),
                    {},
                ).get("max_chars", 10_000)
            )
            if len(normalized_citation["texto"]) > quote_limit:
                raise ValueError(f"A citação do slide {slide_number + 1} excede {quote_limit} caracteres.")
            quote = re.sub(r"\s+", " ", normalized_citation["texto"]).strip().casefold()
            cited_extracts = [
                re.sub(r"\s+", " ", canonical_sources[source_id].extract).strip().casefold()
                for source_id in source_ids
            ]
            if not any(quote in extract for extract in cited_extracts):
                raise ValueError(
                    f"A citação literal do slide {slide_number + 1} não aparece exatamente nas fontes citadas."
                )
        if layout == "destaque_citacao" and not normalized_citation:
            raise ValueError(
                f"O layout de citação do slide {slide_number + 1} exige texto literal verificável."
            )

        has_claims = bool(support_text or points or kpis or tags or normalized_blocks or normalized_citation or normalized_recognition)
        if (has_claims or layout not in {"capa", "encerramento"}) and not source_ids:
            raise ValueError(
                f"O slide {slide_number + 1} ({layout}) precisa citar pelo menos uma fonte válida em 'fontes'. "
                "Todos os layouts, inclusive divisor_secao e slides sem pontos, exigem fonte; "
                "somente capa e encerramento podem ficar sem fontes."
            )

        slides.append({
            "tipo_layout": layout,
            "titulo": slide_title.upper(),
            "subtitulo": _as_text(raw.get("subtitulo"), "subtitulo", allow_empty=True),
            "texto_apoio": support_text,
            "pontos": points,
            "kpis": kpis,
            "fontes": source_ids,
            "imagem_descricao": _as_text(
                raw.get("imagem_descricao"), "imagem_descricao", allow_empty=True
            ),
            "tags": tags,
            "blocos": normalized_blocks,
            "citacao": normalized_citation,
            "reconhecimentos": normalized_recognition,
        })

    cover = next((slide for slide in slides if slide["tipo_layout"] == "capa"), None)
    ending = next((slide for slide in slides if slide["tipo_layout"] == "encerramento"), None)
    slides = [slide for slide in slides if slide["tipo_layout"] not in {"capa", "encerramento"}]
    if cover is None:
        cover = {
            "tipo_layout": "capa", "titulo": title.upper(), "subtitulo": subtitle,
            "texto_apoio": "", "pontos": [], "kpis": [], "fontes": [],
            "imagem_descricao": "", "tags": [], "blocos": [], "citacao": {}, "reconhecimentos": [],
        }
    cover["titulo"] = title.upper()
    cover["subtitulo"] = subtitle or cover["subtitulo"]
    slides.insert(0, cover)
    if ending is None:
        ending = {
            "tipo_layout": "encerramento", "titulo": "OBRIGADO", "subtitulo": "",
            "texto_apoio": "", "pontos": [], "kpis": [], "fontes": [],
            "imagem_descricao": "", "tags": [], "blocos": [], "citacao": {}, "reconhecimentos": [],
        }
    slides.append(ending)

    if len(slides) < 3:
        raise ValueError("A apresentação precisa ter capa, pelo menos um slide de conteúdo e encerramento.")
    if len(slides) > 9:
        raise ValueError("A apresentação excede o limite de 9 slides antes da página automática de referências.")

    limitations = _string_list(payload.get("limitacoes"), "limitacoes")
    cited_ids = list(dict.fromkeys(source_id for slide in slides for source_id in slide["fontes"]))
    if not cited_ids:
        raise ValueError("Nenhuma fonte foi citada. A apresentação acadêmica precisa de referências verificáveis.")
    return {
        "titulo": title,
        "subtitulo": subtitle,
        "slides": slides,
        "fontes": [canonical_sources[source_id].to_dict() for source_id in cited_ids],
        "limitacoes": limitations,
    }
