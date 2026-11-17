'''Carrega o guia visual do projeto em formato JSON a partir de um caminho estável.'''

import json
from functools import lru_cache

from config.settings import PPTX_STYLE_GUIDE_PATH


TITLE_ELEMENT_IDS = {
    "capa": "titulo_principal",
    "conteudo_com_metrica": "topico_titulo",
}


@lru_cache(maxsize=1)
def load_style_guide() -> dict:
    if not PPTX_STYLE_GUIDE_PATH.is_file():
        raise FileNotFoundError(
            "Guia visual não encontrado em "
            f"{PPTX_STYLE_GUIDE_PATH}. Mantenha o arquivo de estilo na raiz do projeto."
        )

    try:
        guide = json.loads(PPTX_STYLE_GUIDE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(
            f"O guia visual precisa ser JSON válido: {PPTX_STYLE_GUIDE_PATH} ({exc})."
        ) from exc

    required = {"metadados_padrao", "regras_de_conteudo_e_concisao", "catalogo_de_layouts"}
    missing = required.difference(guide)
    if missing:
        raise ValueError(f"O guia visual não contém as seções obrigatórias: {', '.join(sorted(missing))}.")
    return guide


def layout_element(guide: dict, layout: str, element_id: str) -> dict:
    """Retorna o elemento do catálogo de layouts (ou dict vazio)."""
    return next(
        (
            element
            for element in guide["catalogo_de_layouts"].get(layout, {}).get("elementos", [])
            if element.get("id") == element_id
        ),
        {},
    )


def visual_limits(guide: dict) -> dict:
    """Centraliza os limites numéricos do guia visual usados pelo validador, pelo prompt e pelo renderizador.

    Todos os valores vêm do guia; os números literais abaixo são apenas o fallback
    usado quando o guia não declara a regra.
    """
    rules = guide["regras_de_conteudo_e_concisao"]
    titles = rules["titulos"]
    support_words = int(rules.get("texto_de_apoio_max_palavras", 35))
    support_words = min(support_words, int(titles.get("max_palavras_texto_apoio", support_words)))
    infographic = layout_element(guide, "visao_geral_infografica", "grade_secoes")
    block_template = infographic.get("bloco_template", {})
    municipality = layout_element(guide, "dados_municipio", "badges_kpi")
    return {
        "titulo_max_caracteres": int(titles["max_caracteres"]),
        "titulo_max_linhas": int(titles.get("max_linhas", 2)),
        "texto_apoio_max_palavras": support_words,
        "pontos_max_por_slide": int(rules["bullet_points"]["max_por_slide"]),
        "palavras_max_por_ponto": int(rules["bullet_points"]["max_palavras_por_item"]),
        "kpis_max_por_slide": int(rules["kpis_e_estatisticas"]["max_kpis_por_slide"]),
        "palavras_max_no_rotulo_kpi": int(rules["kpis_e_estatisticas"]["label_kpi_max_palavras"]),
        "kpis_max_dados_municipio": int(municipality.get("max_badges", 3)),
        "tags_max_por_slide": int(
            layout_element(guide, "nuvem_de_tags", "itens_nuvem").get("regras", {}).get("max_itens", 25)
        ),
        "blocos_max_no_infografico": 4,
        "pontos_max_por_bloco": int(block_template.get("max_bullets", rules["bullet_points"]["max_por_slide"])),
        "reconhecimentos_max_no_slide": int(
            layout_element(guide, "reconhecimento", "grade_premios")
            .get("badge_template", {}).get("max_itens", 8)
        ),
        "citacao_max_caracteres": int(
            layout_element(guide, "destaque_citacao", "texto_destaque").get("max_chars", 10_000)
        ),
        "citacao_max_linhas": int(
            layout_element(guide, "destaque_citacao", "texto_destaque").get("max_linhas", 3)
        ),
        "subtexto_citacao_max_palavras": int(
            layout_element(guide, "destaque_citacao", "subtexto").get("max_palavras", 15)
        ),
        "descricao_capa_max_palavras": int(
            layout_element(guide, "capa", "descricao_curta").get("max_palavras", support_words)
        ),
        "subtitulo_capa_max_caracteres": int(
            layout_element(guide, "capa", "subtitulo").get("max_chars", 70)
        ),
        "descricao_conteudo_max_linhas": int(
            layout_element(guide, "conteudo_com_metrica", "descricao_texto").get("max_linhas", 3)
        ),
        "kpi_fonte_min_pt": float(
            guide["metadados_padrao"]["tipografia"].get("fonte_kpi_numero", {}).get("tamanho_minimo_pt", 36)
        ),
        "kpi_fonte_max_pt": float(
            guide["metadados_padrao"]["tipografia"].get("fonte_kpi_numero", {}).get("tamanho_maximo_pt", 80)
        ),
    }


def title_character_limit(guide: dict, layout: str) -> int:
    general_limit = int(guide["regras_de_conteudo_e_concisao"]["titulos"]["max_caracteres"])
    title_element_id = TITLE_ELEMENT_IDS.get(layout)
    if title_element_id is None:
        return general_limit

    elements = guide["catalogo_de_layouts"].get(layout, {}).get("elementos", [])
    title_element = next(
        (element for element in elements if element.get("id") == title_element_id),
        {},
    )
    return min(general_limit, int(title_element.get("max_chars", general_limit)))
