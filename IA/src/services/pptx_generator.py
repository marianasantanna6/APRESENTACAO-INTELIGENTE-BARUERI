'''Valida e renderiza dados de apresentação acadêmica usando o guia visual externo.'''

from pathlib import Path
import re

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt

from config.pptx_style import load_style_guide
from config.settings import ASSETS_DIR, PRESENTATION_CONTACT, PROJECT_ROOT


SLIDE_WIDTH_IN = 40 / 3
SLIDE_HEIGHT_IN = 7.5


def _color(value: str, fallback: str = "#FFFFFF") -> RGBColor:
    value = value or fallback
    rgba = re.search(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", value)
    if rgba:
        return RGBColor(*(max(0, min(255, int(channel))) for channel in rgba.groups()))
    match = re.search(r"#([0-9A-Fa-f]{6})", value)
    if not match:
        match = re.search(r"#([0-9A-Fa-f]{3})", value)
        if match:
            short = match.group(1)
            value = "#" + "".join(char * 2 for char in short)
    else:
        value = "#" + match.group(1)
    if not value.startswith("#"):
        value = fallback
    return RGBColor.from_string(value.lstrip("#").upper())


def _alpha(value: str, default: float = 1.0) -> float:
    match = re.search(r"rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)", value or "")
    return max(0.0, min(1.0, float(match.group(1)))) if match else default


def _set_transparency(shape, opacity: float) -> None:
    try:
        color_node = shape._element.spPr.solidFill.srgbClr
        alpha = OxmlElement("a:alpha")
        alpha.set("val", str(round(opacity * 100000)))
        color_node.append(alpha)
    except AttributeError:
        pass


def _set_text_transparency(shape, opacity: float) -> None:
    for paragraph in shape.text_frame.paragraphs:
        for run in paragraph.runs:
            try:
                alpha = OxmlElement("a:alpha")
                alpha.set("val", str(round(max(0.0, min(1.0, opacity)) * 100000)))
                run._r.get_or_add_rPr().solidFill.srgbClr.append(alpha)
            except AttributeError:
                continue


def add_background_rect(slide, color: RGBColor):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(SLIDE_WIDTH_IN), Inches(SLIDE_HEIGHT_IN)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def add_text_box(
    slide,
    text: str,
    x: float,
    y: float,
    w: float,
    h: float,
    font_size: float,
    bold: bool = False,
    color: RGBColor | None = None,
    align=PP_ALIGN.LEFT,
    font_name: str | None = None,
    italic: bool = False,
):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = Pt(0)
    frame.margin_right = Pt(0)
    frame.margin_top = Pt(0)
    frame.margin_bottom = Pt(0)
    frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    paragraph.space_after = Pt(0)
    run = paragraph.add_run()
    run.text = text or ""
    if font_name is None:
        typography = load_style_guide()["metadados_padrao"]["tipografia"]
        font_key = "fonte_titulo" if bold else "fonte_corpo"
        font_name = typography.get(font_key, {}).get("familia", "Montserrat")
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color or RGBColor(255, 255, 255)
    return shape


def _add_picture(slide, path: Path, x: float, y: float, w: float, h: float, *, fill: bool = False):
    try:
        with Image.open(path) as image:
            image_width, image_height = image.size
    except (OSError, ValueError):
        return None
    if not image_width or not image_height:
        return None

    box_ratio = w / h
    image_ratio = image_width / image_height
    shape = slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(w), Inches(h))
    if fill:
        if image_ratio > box_ratio:
            visible = box_ratio / image_ratio
            crop = (1 - visible) / 2
            shape.crop_left = crop
            shape.crop_right = crop
        elif image_ratio < box_ratio:
            visible = image_ratio / box_ratio
            crop = (1 - visible) / 2
            shape.crop_top = crop
            shape.crop_bottom = crop
        return shape

    shape.width = Inches(w)
    shape.height = Inches(w / image_ratio)
    if shape.height > Inches(h):
        shape.height = Inches(h)
        shape.width = Inches(h * image_ratio)
    shape.left = Inches(x + (w - shape.width / 914400) / 2)
    shape.top = Inches(y + (h - shape.height / 914400) / 2)
    return shape


def _position(element: dict, x: float, y: float, w: float, h: float) -> tuple[float, float, float, float]:
    pos = element.get("posicao", {})
    px = float(pos.get("x_pct", x / SLIDE_WIDTH_IN * 100))
    py = float(pos.get("y_pct", y / SLIDE_HEIGHT_IN * 100))
    pw = float(pos.get("w_pct", w / SLIDE_WIDTH_IN * 100))
    ph = float(pos.get("h_pct", h / SLIDE_HEIGHT_IN * 100))
    return (
        SLIDE_WIDTH_IN * px / 100,
        SLIDE_HEIGHT_IN * py / 100,
        SLIDE_WIDTH_IN * pw / 100,
        SLIDE_HEIGHT_IN * ph / 100,
    )


def _element(layout_style: dict, element_id: str) -> dict:
    return next(
        (item for item in layout_style.get("elementos", []) if item.get("id") == element_id),
        {},
    )


def _xy(element: dict, x: float, y: float) -> tuple[float, float]:
    pos = element.get("posicao", {})
    return (
        SLIDE_WIDTH_IN * float(pos.get("x_pct", x / SLIDE_WIDTH_IN * 100)) / 100,
        SLIDE_HEIGHT_IN * float(pos.get("y_pct", y / SLIDE_HEIGHT_IN * 100)) / 100,
    )


def _font_size(element: dict, fallback: float) -> float:
    return float(element.get("tamanho_pt", fallback))


def _asset(name: str | None, assets_dir: Path) -> Path | None:
    if not name:
        return None
    candidate = Path(name)
    if candidate.is_absolute() and candidate.is_file():
        return candidate
    candidate = assets_dir / candidate.name
    return candidate if candidate.is_file() else None


def _background_asset(layout: str, assets_dir: Path) -> Path | None:
    candidates = {
        "capa": "skyline_barueri.png",
        "dados_municipio": "vista_aerea_barueri.png",
        "divisor_secao": "skyline_tecnologico.png",
        "destaque_citacao": "autoridade_evento.png",
        "encerramento": "cidade_noturna.png",
    }
    return _asset(candidates.get(layout), assets_dir)


def _add_background(slide, layout: str, layout_style: dict, guide: dict, assets_dir: Path) -> None:
    palette = guide["metadados_padrao"]["paleta_cores"]
    fill = layout_style.get("fundo", {})
    background_asset = _background_asset(layout, assets_dir)
    color = _color(fill.get("cor", palette.get("fundo_primario", "#05082A")))
    add_background_rect(slide, color)
    if fill.get("tipo", "").startswith("foto") and background_asset:
        _add_picture(slide, background_asset, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, fill=True)
        overlay = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(SLIDE_WIDTH_IN), Inches(SLIDE_HEIGHT_IN)
        )
        overlay.fill.solid()
        overlay_color = fill.get("overlay", "rgba(5,8,42,0.7)")
        overlay.fill.fore_color.rgb = _color(overlay_color, "#05082A")
        _set_transparency(overlay, _alpha(overlay_color, 0.7))
        overlay.line.fill.background()
    elif fill.get("tipo", "").startswith("foto"):
        placeholder = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(9.5), Inches(0.0), Inches(3.83), Inches(7.5)
        )
        placeholder.fill.solid()
        placeholder.fill.fore_color.rgb = _color(palette.get("azul_navy", "#0A1F5C"))
        _set_transparency(placeholder, 0.42)
        placeholder.line.fill.background()


def _add_branding(
    slide, guide: dict, assets_dir: Path, *, ods: bool = False, light_background: bool = False
) -> None:
    logos = [
        "prefeitura_barueri.png", "sit.png", "inovacao_barueri.png", "tv_inovacao.png"
    ]
    x = 0.35
    found = False
    for name in logos:
        path = _asset(name, assets_dir)
        if not path:
            continue
        picture = _add_picture(slide, path, x, 7.00, 1.1, 0.32)
        if picture:
            x += picture.width / 914400 + 0.14
            found = True
    if not found:
        add_text_box(
            slide, "PREFEITURA DE BARUERI  •  SECRETARIA DE INOVAÇÃO E TECNOLOGIA",
            0.35, 7.0, 7.9, 0.3, 8, True,
            _color("#556273" if light_background else "#E8EDF5"),
        )

    if ods:
        ods_filename = guide["metadados_padrao"].get("barra_inferior_ods", {}).get(
            "ods_icons_url_placeholder", "ods_goals_strip.png"
        )
        ods_path = _asset(ods_filename, assets_dir) or _asset("ods_strip.png", assets_dir)
        if ods_path:
            _add_picture(slide, ods_path, 9.45, 6.62, 3.55, 0.78)
        else:
            add_text_box(
                slide, "INSERIR ods_goals_strip.png", 9.45, 6.88, 3.55, 0.28,
                8, True, _color("#556273" if light_background else "#B0BAC8"), PP_ALIGN.RIGHT,
            )


def _add_image_panel(slide, data: dict, x: float, y: float, w: float, h: float, assets_dir: Path, guide: dict) -> None:
    requested = data.get("_imagem_arquivo") or "foto_conteudo.png"
    image = _asset(requested, assets_dir)
    panel = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    panel.fill.solid()
    panel.fill.fore_color.rgb = _color(guide["metadados_padrao"]["paleta_cores"].get("fundo_secundario", "#0A1230"))
    panel.line.color.rgb = _color(guide["metadados_padrao"]["paleta_cores"].get("azul_medio", "#1460A8"))
    if image:
        _add_picture(slide, image, x + 0.06, y + 0.06, w - 0.12, h - 0.12, fill=True)
        return
    caption = data.get("imagem_descricao") or "Imagem de apoio pendente"
    add_text_box(slide, "IMAGEM / GRÁFICO", x + 0.28, y + h * 0.32, w - 0.56, 0.35,
                 13, True, _color("#FFFFFF"), PP_ALIGN.CENTER)
    add_text_box(slide, caption, x + 0.35, y + h * 0.44, w - 0.7, min(0.9, h * 0.28),
                 10, False, _color("#B0BAC8"), PP_ALIGN.CENTER)


def _add_kpis(
    slide,
    kpis: list[dict],
    x: float,
    y: float,
    w: float,
    *,
    dark: bool = True,
    template: dict | None = None,
    badges: bool = False,
) -> None:
    if not kpis:
        return
    template = template or {}
    count = min(len(kpis), 3)
    if badges:
        diameter = min(2.2, (w - 0.6 * (count - 1)) / count)
        gap = (w - diameter * count) / max(1, count - 1) if count > 1 else 0
        for index, item in enumerate(kpis[:count]):
            left = x + index * (diameter + gap)
            circle = slide.shapes.add_shape(
                MSO_SHAPE.OVAL, Inches(left), Inches(y), Inches(diameter), Inches(diameter)
            )
            circle.fill.solid()
            circle.fill.fore_color.rgb = _color(template.get("fundo_cor", "#1460A8"))
            _set_transparency(circle, _alpha(template.get("fundo_cor", ""), 1.0))
            circle.line.color.rgb = _color(template.get("borda_cor", "#1E90FF"))
            foreground = _color(template.get("numero_cor", "#FFFFFF"))
            number = f"{item.get('valor', '')} {item.get('unidade') or ''}".strip()
            number_size = float(template.get("numero_tamanho_pt", 28))
            if len(number) > 8:
                number_size = max(18, number_size - (len(number) - 8) * 2)
            add_text_box(slide, number, left + 0.12, y + 0.54, diameter - 0.24, 0.55,
                         number_size, True, foreground, PP_ALIGN.CENTER)
            add_text_box(slide, item.get("label", ""), left + 0.15, y + 1.14, diameter - 0.3, 0.46,
                         float(template.get("label_tamanho_pt", 11)), False,
                         _color(template.get("label_cor", "#B0BAC8")), PP_ALIGN.CENTER)
        return

    gap = 0.16
    card_width = (w - gap * (count - 1)) / count
    for index, item in enumerate(kpis[:count]):
        left = x + index * (card_width + gap)
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(y), Inches(card_width), Inches(1.2)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = _color(template.get("fundo_cor", "#1460A8" if dark else "#E8EDF5"))
        card.line.fill.background()
        foreground = _color(template.get("numero_cor", "#FFFFFF" if dark else "#0A1F5C"))
        number = f"{item.get('valor', '')} {item.get('unidade') or ''}".strip()
        number_size = float(template.get("numero_tamanho_pt", 32))
        font_config = load_style_guide()["metadados_padrao"]["tipografia"].get("fonte_kpi_numero", {})
        number_size = min(number_size, float(font_config.get("tamanho_maximo_pt", 80)))
        number_size = max(number_size - max(0, len(number) - 7) * 3, float(font_config.get("tamanho_minimo_pt", 36)))
        add_text_box(slide, number, left + 0.1, y + 0.12, card_width - 0.2, 0.55,
                     number_size, True, foreground, PP_ALIGN.CENTER)
        add_text_box(slide, item.get("label", ""), left + 0.12, y + 0.72, card_width - 0.24,
                     0.28, float(template.get("label_tamanho_pt", 11)), False, foreground, PP_ALIGN.CENTER)


def _add_source_footer(
    slide, data: dict, guide: dict, assets_dir: Path, *, light_background: bool = False
) -> None:
    source_ids = data.get("fontes", [])
    if source_ids:
        add_text_box(slide, "Fontes: " + " · ".join(source_ids), 0.35, 6.55, 8.6, 0.26,
                     8, False, _color("#556273" if light_background else "#B0BAC8"))
    _add_branding(slide, guide, assets_dir, ods=True, light_background=light_background)


def _draw_cover(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "capa", style, guide, assets)
    pre_title = _element(style, "pre_titulo")
    main_title = _element(style, "titulo_principal")
    subtitle_element = _element(style, "subtitulo")
    description_element = _element(style, "descricao_curta")
    title = data.get("titulo") or "APRESENTAÇÃO"
    pre_x, pre_y = _xy(pre_title, 0.68, 2.62)
    title_x, title_y = _xy(main_title, 0.68, 3.06)
    subtitle_x, subtitle_y = _xy(subtitle_element, 0.7, 4.33)
    description_x, description_y = _xy(description_element, 0.7, 5.15)
    add_text_box(slide, pre_title.get("conteudo", "PREFEITURA DE"), pre_x, pre_y, 6.6, 0.45,
                 _font_size(pre_title, 20), True, _color(pre_title.get("cor", "#FFFFFF")))
    title_limit = int(main_title.get("max_chars", 30))
    cover_size = _font_size(main_title, 42) if len(title) <= title_limit else 44
    add_text_box(slide, title.upper(), title_x, title_y, 11.7, 1.15,
                 cover_size, True, _color(main_title.get("cor", "#FFFFFF")))
    subtitle = data.get("subtitulo") or data.get("texto_apoio") or ""
    if subtitle:
        add_text_box(slide, subtitle, subtitle_x, subtitle_y, 9.9, 0.72,
                     _font_size(subtitle_element, 18), False,
                     _color(subtitle_element.get("cor", "#E8EDF5")))
    description = data.get("texto_apoio") if subtitle else ""
    if description and description != subtitle:
        add_text_box(slide, description, description_x, description_y, 9.9, 0.58,
                     _font_size(description_element, 14), False,
                     _color(description_element.get("cor", "#B0BAC8")))
    flags = _element(style, "bandeiras")
    flag_x, flag_y = _xy(flags, 11.65, 0.2)
    for index, name in enumerate(flags.get("conteudo", [])):
        path = _asset(name, assets)
        if path:
            _add_picture(slide, path, flag_x + index * 0.76, flag_y, 0.68, 0.44)
    _add_branding(slide, guide, assets)


def _draw_municipality(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "dados_municipio", style, guide, assets)
    add_text_box(slide, data.get("titulo") or "BARUERI EM DADOS", 0.65, 0.45, 11.9, 0.7,
                 30, True, _color("#FFFFFF"))
    badge_element = _element(style, "badges_kpi")
    badge_template = badge_element.get("badge_template", {})
    _add_kpis(slide, data.get("kpis", []), 1.15, 2.05, 11.0,
              template=badge_template, badges=True)
    if data.get("pontos"):
        add_text_box(slide, "\n".join(f"• {point}" for point in data["pontos"]),
                     1.05, 4.55, 11.2, 1.15, 13, False, _color("#E8EDF5"))
    tagline = _element(style, "subtitulo_slide")
    tagline_x, tagline_y = _xy(tagline, 0.65, 5.9)
    caption = data.get("texto_apoio", "")
    if caption:
        add_text_box(slide, caption, tagline_x, tagline_y, 11.3, 0.42,
                     _font_size(tagline, 16), True, _color(tagline.get("cor", "#FFFFFF")))
    _add_source_footer(slide, data, guide, assets)


def _draw_divider(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "divisor_secao", style, guide, assets)
    watermark = _element(style, "supertitulo_fantasma")
    watermark_x, watermark_y = _xy(watermark, 0.7, 2.1)
    if data.get("subtitulo"):
        watermark_shape = add_text_box(
            slide, data["subtitulo"].upper(),
            watermark_x, watermark_y, 12.0, 0.65, _font_size(watermark, 24), True,
            _color(watermark.get("cor", "#B0BAC8")), italic=True
        )
        _set_text_transparency(watermark_shape, _alpha(watermark.get("cor", ""), 1.0))
    title_element = _element(style, "titulo_pilar")
    title_x, title_y = _xy(title_element, 0.7, 3.05)
    add_text_box(slide, data.get("titulo") or "SEÇÃO", title_x, title_y, 12.0, 1.05,
                 _font_size(title_element, 34), True, _color(title_element.get("cor", "#FFFFFF")))
    icon = _element(style, "icone_pilar")
    icon_x, icon_y = _xy(icon, 0.7, 5.4)
    icon_size = float(icon.get("tamanho_px", 80)) / 96
    icon_shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(icon_x), Inches(icon_y),
        Inches(icon_size), Inches(icon_size)
    )
    icon_shape.fill.solid()
    icon_shape.fill.fore_color.rgb = _color(icon.get("fundo_cor", "#1460A8"))
    icon_shape.line.fill.background()
    for element_id in ("logos_topo", "logos_topo_direita"):
        logo_group = _element(style, element_id)
        logo_x, logo_y = _xy(logo_group, 0.3, 0.2)
        for index, logo_name in enumerate(logo_group.get("logos", [])):
            logo = _asset(logo_name, assets)
            if logo:
                _add_picture(slide, logo, logo_x + index * 0.85, logo_y, 0.74, 0.48)
    colors = guide["catalogo_de_layouts"]["divisor_secao"]["elementos"][-1].get("cores", [])
    if colors:
        segment_width = SLIDE_WIDTH_IN / len(colors)
        for index, color in enumerate(colors):
            rect = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, Inches(index * segment_width), Inches(7.25),
                Inches(segment_width), Inches(0.25)
            )
            rect.fill.solid()
            rect.fill.fore_color.rgb = _color(color)
            rect.line.fill.background()


def _draw_content(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "conteudo_com_metrica", style, guide, assets)
    header_style = _element(style, "header_barra")
    header_color = header_style.get("fundo_cor", guide["metadados_padrao"]["paleta_cores"].get("fundo_secundario", "#0A1230"))
    header_height = SLIDE_HEIGHT_IN * float(header_style.get("altura_pct", 14)) / 100
    header = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(SLIDE_WIDTH_IN), Inches(header_height))
    header.fill.solid()
    header.fill.fore_color.rgb = _color(header_color)
    header.line.fill.background()
    section = data.get("subtitulo") or data.get("secao") or "PREFEITURA DE BARUERI"
    add_text_box(slide, section.upper(), 0.45, 0.12, 7.5, 0.55, 18, True, _color("#FFFFFF"))

    image_element = _element(style, "imagem_esquerda")
    image_x, image_y, image_w, image_h = _position(image_element, 0.27, 1.2, 6.12, 4.95)
    _add_image_panel(slide, data, image_x, image_y, image_w, image_h, assets, guide)

    title_element = _element(style, "topico_titulo")
    title_x, title_y = _xy(title_element, 6.92, 1.35)
    right_x, right_w = title_x, SLIDE_WIDTH_IN - title_x - 0.35
    add_text_box(slide, data.get("titulo") or "", right_x, title_y, right_w, 0.95,
                 _font_size(title_element, 22), True, _color(title_element.get("cor", "#FFFFFF")))
    if data.get("kpis"):
        kpi_element = _element(style, "kpi_numero")
        kpi_x, kpi_y = _xy(kpi_element, right_x, 2.65)
        kpi_template = {
            "numero_tamanho_pt": kpi_element.get("numero_tamanho_pt", 56),
            "numero_cor": kpi_element.get("numero_cor", "#FFFFFF"),
            "label_tamanho_pt": kpi_element.get("label_tamanho_pt", 13),
            "label_cor": kpi_element.get("label_cor", "#B0BAC8"),
            "fundo_cor": "#1460A8",
        }
        _add_kpis(slide, data["kpis"], kpi_x, kpi_y, right_w, template=kpi_template)
        text_y = kpi_y + 1.35
    else:
        text_y = 2.55
    if data.get("texto_apoio"):
        description_element = _element(style, "descricao_texto")
        description_x, description_y = _xy(description_element, right_x, text_y)
        text_y = max(text_y, description_y)
        add_text_box(slide, data["texto_apoio"], description_x, text_y, right_w, 0.9,
                     _font_size(description_element, 14), False,
                     _color(description_element.get("cor", "#B0BAC8")))
        text_y += 0.94
    if data.get("pontos"):
        bullets = "\n".join(f"• {point}" for point in data["pontos"])
        add_text_box(slide, bullets, right_x, text_y, right_w, max(0.45, 6.25 - text_y),
                     12, False, _color("#E8EDF5"))
    _add_source_footer(slide, data, guide, assets)


def _draw_quote(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "destaque_citacao", style, guide, assets)
    quote = data.get("citacao") or {}
    text = quote.get("texto") if isinstance(quote, dict) else ""
    text = text or data.get("texto_apoio") or data.get("titulo") or ""
    quote_element = _element(style, "texto_destaque")
    quote_x, quote_y = _xy(quote_element, 0.75, 1.7)
    add_text_box(slide, f"“{text}”", quote_x, quote_y, 11.8, 2.8,
                 _font_size(quote_element, 42), True, _color(quote_element.get("cor", "#F5C518")))
    author = quote.get("autor") if isinstance(quote, dict) else ""
    if author:
        author_element = _element(style, "subtexto")
        author_x, author_y = _xy(author_element, 0.8, 4.75)
        add_text_box(slide, author, author_x, author_y, 10.5, 0.55,
                     _font_size(author_element, 16), False,
                     _color(author_element.get("cor", "#FFFFFF")))
    _add_source_footer(slide, data, guide, assets)


def _draw_tags(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "nuvem_de_tags", style, guide, assets)
    add_text_box(slide, data.get("titulo") or "TEMAS EM DESTAQUE", 0.65, 0.45, 11.9,
                 0.8, 30, True, _color("#0A1F5C"))
    cloud = _element(style, "itens_nuvem")
    cloud_rules = cloud.get("regras", {})
    colors = cloud_rules.get("cores", ["#0A1F5C", "#1460A8", "#1E90FF", "#00A99D", "#F5A623"])
    tags = data.get("tags", [])
    for index, tag in enumerate(tags[:25]):
        row, col = divmod(index, 5)
        x = 0.7 + col * 2.48 + (0.22 if row % 2 else 0)
        y = 1.65 + row * 0.82
        size_max = int(cloud_rules.get("tamanho_maior_pt", 28))
        size_min = int(cloud_rules.get("tamanho_menor_pt", 11))
        size = max(size_min, size_max - (index % 5) * 3)
        add_text_box(slide, tag.upper(), x, y, 2.25, 0.52,
                     size, True, _color(colors[index % len(colors)]), PP_ALIGN.CENTER)
    stripe = _element(style, "barra_cor_inferior")
    stripe_colors = stripe.get("cores", [])
    if stripe_colors:
        segment_width = SLIDE_WIDTH_IN / len(stripe_colors)
        stripe_height = SLIDE_HEIGHT_IN * float(stripe.get("altura_pct", 4)) / 100
        for index, color in enumerate(stripe_colors):
            rect = slide.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, Inches(index * segment_width),
                Inches(SLIDE_HEIGHT_IN - stripe_height), Inches(segment_width), Inches(stripe_height)
            )
            rect.fill.solid()
            rect.fill.fore_color.rgb = _color(color)
            rect.line.fill.background()
    _add_source_footer(slide, data, guide, assets, light_background=True)


def _draw_infographic(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "visao_geral_infografica", style, guide, assets)
    title_element = _element(style, "titulo_grande")
    title_x, title_y = _xy(title_element, 0.3, 0.3)
    add_text_box(slide, data.get("titulo") or "VISÃO GERAL", title_x, title_y, 12.3, 0.65,
                 _font_size(title_element, 36), True, _color(title_element.get("cor", "#FFFFFF")))
    blocks = data.get("blocos", [])[:4]
    for index, block in enumerate(blocks):
        row, col = divmod(index, 2)
        x, y = 0.55 + col * 6.25, 1.22 + row * 2.27
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(5.95), Inches(1.95))
        card.fill.solid()
        card.fill.fore_color.rgb = _color("#0A1230")
        card.line.color.rgb = _color("#1460A8")
        add_text_box(slide, block.get("titulo", ""), x + 0.18, y + 0.12, 5.58, 0.38,
                     14, True, _color("#FFFFFF"))
        bullet_text = "\n".join(f"• {point}" for point in block.get("pontos", []))
        add_text_box(slide, bullet_text, x + 0.18, y + 0.55, 5.58, 1.23,
                     10, False, _color("#B0BAC8"))
    _add_kpis(slide, data.get("kpis", []), 0.75, 5.05, 11.8)
    _add_source_footer(slide, data, guide, assets)


def _draw_map(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "mapa_nacional", style, guide, assets)
    background_photo = _asset("vista_aerea_barueri.png", assets)
    if background_photo:
        _add_picture(slide, background_photo, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, fill=True)
        wash = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, Inches(SLIDE_WIDTH_IN), Inches(SLIDE_HEIGHT_IN)
        )
        wash.fill.solid()
        wash.fill.fore_color.rgb = _color("#EAEFF5")
        _set_transparency(wash, 0.88)
        wash.line.fill.background()
    title_element = _element(style, "titulo")
    title_color = _color(title_element.get("cor", "#0A1F5C"))
    title_x, title_y = _xy(title_element, 0.65, 0.4)
    add_text_box(slide, data.get("titulo") or "ALCANCE NACIONAL", title_x, title_y, 12.0, 0.7,
                 _font_size(title_element, 36), True, title_color)
    map_path = _asset(data.get("imagem_arquivo") or "mapa_brasil.png", assets)
    if map_path:
        _add_picture(slide, map_path, 1.0, 1.3, 11.3, 5.2, fill=True)
    else:
        add_text_box(slide, "INSERIR mapa_brasil.png", 2.0, 2.6, 9.3, 1.0,
                     22, True, title_color, PP_ALIGN.CENTER)
        add_text_box(slide, data.get("texto_apoio") or data.get("imagem_descricao") or "Mapa de alcance citado nas fontes",
                     2.0, 3.7, 9.3, 0.7, 13, False, title_color, PP_ALIGN.CENTER)
    _add_source_footer(slide, data, guide, assets, light_background=True)


def _draw_recognition(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "reconhecimento", style, guide, assets)
    title_element = _element(style, "titulo")
    title_x, title_y = _xy(title_element, 0.55, 0.35)
    add_text_box(slide, data.get("titulo") or "RECONHECIMENTO", title_x, title_y, 12.2, 0.7,
                 _font_size(title_element, 42), True, _color(title_element.get("cor", "#FFFFFF")))
    items = data.get("reconhecimentos", [])[:8]
    for index, item in enumerate(items):
        row, col = divmod(index, 4)
        x, y = 0.5 + col * 3.12, 1.55 + row * 2.25
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(2.85), Inches(1.9))
        card.fill.solid()
        card.fill.fore_color.rgb = _color("rgba(20,96,168,0.30)", "#1460A8")
        card.line.color.rgb = _color("#1460A8")
        _set_transparency(card, 0.3)
        add_text_box(slide, item.get("nome", ""), x + 0.14, y + 0.2, 2.57, 0.54,
                     12, True, _color("#FFFFFF"), PP_ALIGN.CENTER)
        add_text_box(slide, item.get("descricao", ""), x + 0.14, y + 0.8, 2.57, 0.86,
                     9, False, _color("#B0BAC8"), PP_ALIGN.CENTER)
    _add_source_footer(slide, data, guide, assets)


def _draw_end(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    _add_background(slide, "encerramento", style, guide, assets)
    title_element = _element(style, "titulo_obrigado")
    title_x, title_y = _xy(title_element, 1.0, 2.0)
    add_text_box(slide, data.get("titulo") or "OBRIGADO", title_x, title_y, 11.3, 1.15,
                 _font_size(title_element, 60), True, _color(title_element.get("cor", "#FFFFFF")), PP_ALIGN.CENTER)
    contact = data.get("contato") or PRESENTATION_CONTACT
    lines = []
    if isinstance(contact, dict):
        lines = [contact.get(key, "") for key in ("nome", "cargo", "telefone", "email", "website")]
        lines = [line for line in lines if isinstance(line, str) and line.strip()]
    qr = _asset("qr_code_contato.png", assets)
    if qr:
        _add_picture(slide, qr, 0.67, 4.12, 0.86, 0.86)
    if lines:
        contact_x = 1.8 if qr else 0.8
        contact_width = 5.5 if qr else 6.0
        add_text_box(slide, "\n".join(lines), contact_x, 4.65, contact_width, 1.35,
                     12, False, _color("#E8EDF5"))
    logo = _asset("prefeitura_barueri.png", assets)
    if logo:
        _add_picture(slide, logo, 9.33, 4.88, 2.1, 1.65)
    _add_branding(slide, guide, assets)


def _draw_references(slide, sources: list[dict], style: dict, guide: dict) -> None:
    palette = guide["metadados_padrao"]["paleta_cores"]
    add_background_rect(slide, _color(palette.get("fundo_primario", "#05082A")))
    title_element = _element(style, "titulo")
    title_x, title_y = _xy(title_element, 0.55, 0.32)
    add_text_box(slide, "REFERÊNCIAS", title_x, title_y, 12.0, 0.7,
                 _font_size(title_element, 36), True, _color(title_element.get("cor", "#FFFFFF")))
    list_element = _element(style, "lista_fontes")
    list_x, list_y, list_w, list_h = _position(list_element, 0.65, 1.35, 12.0, 5.6)
    y = list_y
    row_step = min(0.9, list_h / max(1, len(sources)))
    for source in sources:
        title = source.get("titulo", "Fonte sem título")
        url = source.get("url", "")
        add_text_box(slide, f"{source.get('id', '')} — {title}", list_x, y, list_w, 0.38,
                     11, True, _color("#FFFFFF"))
        link_box = add_text_box(slide, url, list_x, y + 0.39, list_w, 0.34,
                                8, False, _color("#1E90FF"))
        if url:
            try:
                link_box.text_frame.paragraphs[0].runs[0].hyperlink.address = url
            except (IndexError, AttributeError):
                pass
        y += row_step
        if y > list_y + list_h:
            break


LAYOUT_RENDERERS = {
    "capa": _draw_cover,
    "dados_municipio": _draw_municipality,
    "divisor_secao": _draw_divider,
    "conteudo_com_metrica": _draw_content,
    "destaque_citacao": _draw_quote,
    "nuvem_de_tags": _draw_tags,
    "visao_geral_infografica": _draw_infographic,
    "mapa_nacional": _draw_map,
    "reconhecimento": _draw_recognition,
    "encerramento": _draw_end,
}


def criar_apresentacao(presentation: dict, caminho_saida: str | Path, assets_dir: str | Path | None = None) -> Path:
    """Renderiza os slides validados em PPTX 16:9 usando o guia visual e os assets disponíveis. Insere a página de referências e retorna o caminho do arquivo salvo."""
    guide = load_style_guide()
    assets_path = Path(assets_dir) if assets_dir else ASSETS_DIR
    catalog = guide["catalogo_de_layouts"]
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_WIDTH_IN)
    prs.slide_height = Inches(SLIDE_HEIGHT_IN)
    blank_layout = prs.slide_layouts[6]

    slides = presentation["slides"]
    end_index = next(
        (index for index, item in enumerate(slides) if item.get("tipo_layout") == "encerramento"),
        len(slides),
    )
    content_image_index = 0
    for index, slide_data in enumerate(slides):
        # Keep the public, validated slide contract unchanged for API callers.
        data = dict(slide_data)
        if index == end_index:
            reference_slide = prs.slides.add_slide(blank_layout)
            _draw_references(
                reference_slide,
                presentation.get("fontes", []),
                catalog.get("referencias", {}),
                guide,
            )

        layout = data["tipo_layout"]
        if layout == "conteudo_com_metrica":
            content_image_index += 1
            numbered_image = _asset(f"foto_conteudo_{content_image_index:02d}.png", assets_path)
            if numbered_image:
                data["_imagem_arquivo"] = numbered_image.name
        renderer = LAYOUT_RENDERERS.get(layout)
        if renderer is None:
            raise ValueError(f"Não há renderizador PPTX para o layout '{layout}'.")
        slide = prs.slides.add_slide(blank_layout)
        renderer(slide, data, catalog.get(layout, {}), guide, assets_path)

    output = Path(caminho_saida).resolve()
    project_root = PROJECT_ROOT.resolve()
    if not output.is_relative_to(project_root):
        raise ValueError("O arquivo PPTX precisa ser salvo dentro da pasta IA.")
    output.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output))
    return output


def validate_pptx_file(path: str | Path, *, minimum_slides: int = 3) -> None:
    """Confirma que o artefato salvo é um PPTX aberto pelo python-pptx e contém slides."""
    candidate = Path(path)
    if not candidate.is_file():
        raise ValueError("O arquivo PPTX não foi criado.")
    if candidate.stat().st_size == 0:
        raise ValueError("O arquivo PPTX criado está vazio.")
    try:
        rendered = Presentation(str(candidate))
    except Exception as exc:
        raise ValueError("O arquivo gerado não é uma apresentação PowerPoint válida.") from exc
    if len(rendered.slides) < minimum_slides:
        raise ValueError(
            f"A apresentação gerada contém {len(rendered.slides)} slides; esperado ao menos {minimum_slides}."
        )
