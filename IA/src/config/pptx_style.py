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
