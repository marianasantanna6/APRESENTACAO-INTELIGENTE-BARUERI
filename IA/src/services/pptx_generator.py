'''Renderiza dados de apresentação como PPTX seguindo o visual dos cards web (IaSlideCard).'''

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


SLIDE_WIDTH_IN  = 40 / 3   # 13.33"
SLIDE_HEIGHT_IN = 7.5

# ── Web-card color palette (matches frontend IaSlideCard) ────────────────────
_C = RGBColor
C_BLUE       = _C(0x16, 0x75, 0xb8)  # #1675b8  primary blue
C_DARK_BLUE  = _C(0x0d, 0x52, 0x83)  # #0d5283  dark blue (quote bg)
C_GREEN      = _C(0x16, 0xa3, 0x4a)  # #16a34a  primary green
C_LIGHT_BLUE = _C(0xef, 0xf6, 0xff)  # #eff6ff  light blue (badge / KPI bg)
C_LIGHT_GRAY = _C(0xf8, 0xfa, 0xfc)  # #f8fafc  light gray (divisor bg / card bg)
C_BORDER     = _C(0xe2, 0xe8, 0xf0)  # #e2e8f0  borders
C_KPI_BORDER = _C(0xdb, 0xe4, 0xfe)  # #dbeafe  KPI card border
C_TEXT       = _C(0x1e, 0x1e, 0x1e)  # #1e1e1e  dark text
C_TEXT_MED   = _C(0x6b, 0x72, 0x80)  # #6b7280  medium gray text
C_TEXT_GRAY  = _C(0x37, 0x41, 0x51)  # #374151  body gray text
C_TEXT_LIGHT = _C(0x9c, 0xa3, 0xaf)  # #9ca3af  light gray text
C_WHITE      = _C(0xFF, 0xFF, 0xFF)
C_SLATE      = _C(0x47, 0x55, 0x69)  # #475569

LAYOUT_LABELS: dict[str, str] = {
    "capa":                    "Capa",
    "encerramento":            "Encerramento",
    "divisor_secao":           "Divisor de Seção",
    "conteudo_com_metrica":    "Conteúdo com Métrica",
    "destaque_citacao":        "Destaque / Citação",
    "nuvem_de_tags":           "Nuvem de Tags",
    "visao_geral_infografica": "Visão Geral / Infográfico",
    "mapa_nacional":           "Mapa Nacional",
    "reconhecimento":          "Reconhecimento",
    "dados_municipio":         "Dados do Município",
    "referencias":             "Referências",
}


# ── Low-level utilities ───────────────────────────────────────────────────────

def _color(value: str, fallback: str = "#FFFFFF") -> RGBColor:
    value = value or fallback
    rgba = re.search(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", value)
    if rgba:
        return RGBColor(*(max(0, min(255, int(ch))) for ch in rgba.groups()))
    match = re.search(r"#([0-9A-Fa-f]{6})", value)
    if not match:
        match = re.search(r"#([0-9A-Fa-f]{3})", value)
        if match:
            short = match.group(1)
            value = "#" + "".join(c * 2 for c in short)
    else:
        value = "#" + match.group(1)
    if not value.startswith("#"):
        value = fallback
    return RGBColor.from_string(value.lstrip("#").upper())


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
    run.font.name = font_name or "Montserrat"
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color or C_WHITE
    return shape


def _add_picture(slide, path: Path, x: float, y: float, w: float, h: float, *, fill: bool = False):
    try:
        with Image.open(path) as image:
            iw, ih = image.size
    except (OSError, ValueError):
        return None
    if not iw or not ih:
        return None
    box_ratio = w / h
    img_ratio = iw / ih
    shape = slide.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(w), Inches(h))
    if fill:
        if img_ratio > box_ratio:
            visible = box_ratio / img_ratio
            crop = (1 - visible) / 2
            shape.crop_left = crop
            shape.crop_right = crop
        elif img_ratio < box_ratio:
            visible = img_ratio / box_ratio
            crop = (1 - visible) / 2
            shape.crop_top = crop
            shape.crop_bottom = crop
        return shape
    shape.width = Inches(w)
    shape.height = Inches(w / img_ratio)
    if shape.height > Inches(h):
        shape.height = Inches(h)
        shape.width = Inches(h * img_ratio)
    shape.left = Inches(x + (w - shape.width / 914400) / 2)
    shape.top  = Inches(y + (h - shape.height / 914400) / 2)
    return shape


def _asset(name: str | None, assets_dir: Path) -> Path | None:
    if not name:
        return None
    candidate = Path(name)
    if candidate.is_absolute() and candidate.is_file():
        return candidate
    candidate = assets_dir / candidate.name
    return candidate if candidate.is_file() else None


# ── Shared layout helpers ─────────────────────────────────────────────────────

def _add_badge(slide, number: int, layout: str, x: float, y: float, *, dark_bg: bool = False) -> None:
    """Renders the "N · Label" pill matching the web card badge."""
    label = LAYOUT_LABELS.get(layout, layout)
    text  = f"{number} · {label.upper()}"
    w = max(1.5, min(5.5, 0.3 + len(text) * 0.13))
    h = 0.37
    badge = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    badge.fill.solid()
    if dark_bg:
        badge.fill.fore_color.rgb = C_WHITE
        _set_transparency(badge, 0.20)
        badge.line.fill.background()
        text_color = C_WHITE
    else:
        badge.fill.fore_color.rgb = C_LIGHT_BLUE
        badge.line.color.rgb = C_KPI_BORDER
        text_color = C_BLUE
    tf = badge.text_frame
    tf.clear()
    tf.word_wrap = False
    tf.margin_left   = Pt(5)
    tf.margin_right  = Pt(5)
    tf.margin_top    = Pt(0)
    tf.margin_bottom = Pt(0)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.name  = "Montserrat"
    run.font.size  = Pt(9)
    run.font.bold  = True
    run.font.color.rgb = text_color


def _add_kpis_web(slide, kpis: list[dict], x: float, y: float, w: float) -> None:
    """Renders KPI chips matching the web card (#eff6ff bg, #1675b8 value)."""
    if not kpis:
        return
    count  = min(len(kpis), 3)
    gap    = 0.18
    card_w = (w - gap * (count - 1)) / count
    for i, item in enumerate(kpis[:count]):
        cx = x + i * (card_w + gap)
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(y), Inches(card_w), Inches(1.35)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = C_LIGHT_BLUE
        card.line.color.rgb = C_KPI_BORDER
        value = str(item.get("valor", ""))
        unit  = str(item.get("unidade") or "")
        label = str(item.get("label", ""))
        ctx   = str(item.get("contexto") or "")
        num   = f"{value}{unit}" if unit else value
        fs    = 36 if len(num) <= 6 else max(22, 36 - (len(num) - 6) * 3)
        add_text_box(slide, num,          cx + 0.1, y + 0.1,  card_w - 0.2, 0.68, fs, True,  C_BLUE, PP_ALIGN.CENTER)
        add_text_box(slide, label.upper(), cx + 0.1, y + 0.84, card_w - 0.2, 0.3,  9,  True,  C_TEXT_MED, PP_ALIGN.CENTER)
        if ctx:
            add_text_box(slide, ctx,       cx + 0.1, y + 1.15, card_w - 0.2, 0.3,  8,  False, C_TEXT_LIGHT, PP_ALIGN.CENTER)


def _add_bullets(slide, pontos: list[str], x: float, y: float, w: float, h: float,
                 font_size: float = 13, text_color: RGBColor | None = None) -> None:
    """Renders bullet points with blue circle markers."""
    text_color = text_color or C_TEXT_GRAY
    row_h = max(0.28, font_size / 72 * 1.5 + 0.08)
    for i, point in enumerate(pontos):
        ry = y + i * row_h
        if ry + 0.22 > y + h:
            break
        dot = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, Inches(x), Inches(ry + 0.1), Inches(0.1), Inches(0.1)
        )
        dot.fill.solid()
        dot.fill.fore_color.rgb = C_BLUE
        dot.line.fill.background()
        add_text_box(slide, point, x + 0.18, ry, w - 0.18, row_h, font_size, False, text_color)


def _add_image_panel(slide, data: dict, x: float, y: float, w: float, h: float, assets_dir: Path) -> None:
    """Renders an image panel; falls back to placeholder."""
    requested = data.get("_imagem_arquivo") or "foto_conteudo.png"
    image = _asset(requested, assets_dir)
    panel = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    panel.fill.solid()
    panel.fill.fore_color.rgb = C_LIGHT_GRAY
    panel.line.color.rgb = C_BORDER
    if image:
        _add_picture(slide, image, x + 0.06, y + 0.06, w - 0.12, h - 0.12, fill=True)
        return
    caption = data.get("imagem_descricao") or "Imagem de apoio pendente"
    add_text_box(slide, "IMAGEM / GRÁFICO", x + 0.3, y + h * 0.33, w - 0.6, 0.4,
                 14, True, C_BLUE, PP_ALIGN.CENTER)
    add_text_box(slide, caption, x + 0.3, y + h * 0.46, w - 0.6, min(1.0, h * 0.3),
                 10, False, C_TEXT_MED, PP_ALIGN.CENTER)


def _add_branding(slide, assets_dir: Path, *, light: bool = False) -> None:
    logos = ["prefeitura_barueri.png", "sit.png", "inovacao_barueri.png"]
    x = 0.35
    found = False
    for name in logos:
        path = _asset(name, assets_dir)
        if not path:
            continue
        picture = _add_picture(slide, path, x, 7.07, 1.0, 0.3)
        if picture:
            x += picture.width / 914400 + 0.12
            found = True
    if not found:
        add_text_box(
            slide, "PREFEITURA DE BARUERI  •  SECRETARIA DE INOVAÇÃO E TECNOLOGIA",
            0.35, 7.1, 7.9, 0.28, 8, True,
            C_TEXT_LIGHT if light else C_TEXT_LIGHT,
        )


def _add_source_footer(slide, data: dict, assets_dir: Path, *, light: bool = False) -> None:
    source_ids = data.get("fontes") or []
    if source_ids:
        add_text_box(slide, "Fontes: " + " · ".join(source_ids),
                     0.35, 6.62, 8.6, 0.26, 8, False, C_TEXT_LIGHT)
    _add_branding(slide, assets_dir, light=light)


# ── Slide renderers ───────────────────────────────────────────────────────────

def _draw_cover(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_BLUE)
    idx   = data.get("_slide_index", 1)
    _add_badge(slide, idx, "capa", 0.45, 0.4, dark_bg=True)
    title = data.get("titulo") or "APRESENTAÇÃO"
    fs    = 54 if len(title) <= 32 else 44
    add_text_box(slide, title.upper(), 0.65, 2.1, 12.0, 1.6, fs, True, C_WHITE)
    subtitle = data.get("subtitulo") or ""
    if subtitle:
        add_text_box(slide, subtitle, 0.65, 3.9, 12.0, 0.75, 22, False, C_WHITE)
    support = data.get("texto_apoio") or ""
    if support and support != subtitle:
        add_text_box(slide, support, 0.65, 4.78, 11.5, 0.65, 16, False, C_WHITE)
    _add_branding(slide, assets)


def _draw_municipality(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_WHITE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "dados_municipio", 0.45, 0.35)
    add_text_box(slide, data.get("titulo") or "BARUERI EM DADOS",
                 0.45, 0.9, 12.3, 0.95, 32, True, C_TEXT)
    text_y = 2.05
    kpis = data.get("kpis") or []
    if kpis:
        _add_kpis_web(slide, kpis, 0.45, text_y, 12.3)
        text_y = 3.6
    support = data.get("texto_apoio") or ""
    if support:
        add_text_box(slide, support, 0.45, text_y, 12.3, 0.72, 14, False, C_TEXT_MED)
        text_y += 0.82
    pontos = data.get("pontos") or []
    if pontos:
        _add_bullets(slide, pontos, 0.45, text_y, 12.3, 6.5 - text_y, 13)
    _add_source_footer(slide, data, assets, light=True)


def _draw_divider(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_LIGHT_GRAY)
    strip = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.22), Inches(SLIDE_HEIGHT_IN)
    )
    strip.fill.solid()
    strip.fill.fore_color.rgb = C_BLUE
    strip.line.fill.background()
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "divisor_secao", 0.5, 0.38)
    subtitle = data.get("subtitulo") or ""
    if subtitle:
        add_text_box(slide, subtitle.upper(), 0.5, 2.1, 12.5, 0.72,
                     26, True, C_TEXT_LIGHT, italic=True)
    title = data.get("titulo") or "SEÇÃO"
    add_text_box(slide, title, 0.5, 2.9, 12.5, 1.3, 48, True, C_BLUE)
    support = data.get("texto_apoio") or ""
    if support:
        add_text_box(slide, support, 0.5, 4.38, 12.5, 0.65, 14, False, C_TEXT_MED)
    # colored bottom stripe from guide (fallback to brand colors)
    catalog_colors: list[str] = []
    for el in guide.get("catalogo_de_layouts", {}).get("divisor_secao", {}).get("elementos", []):
        if el.get("cores"):
            catalog_colors = el["cores"]
            break
    if not catalog_colors:
        catalog_colors = ["#1675b8", "#16a34a", "#f59e0b", "#ef4444"]
    seg_w = SLIDE_WIDTH_IN / len(catalog_colors)
    for i, c in enumerate(catalog_colors):
        rect = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(i * seg_w), Inches(SLIDE_HEIGHT_IN - 0.2),
            Inches(seg_w), Inches(0.2)
        )
        rect.fill.solid()
        rect.fill.fore_color.rgb = _color(c)
        rect.line.fill.background()


def _draw_content(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_WHITE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "conteudo_com_metrica", 0.45, 0.35)
    title = data.get("titulo") or ""
    add_text_box(slide, title, 0.45, 0.9, 12.3, 1.0, 26, True, C_TEXT)
    _add_image_panel(slide, data, 0.4, 2.05, 5.6, 4.9, assets)
    rx, rw = 6.35, SLIDE_WIDTH_IN - 6.35 - 0.4
    text_y = 2.05
    kpis = data.get("kpis") or []
    if kpis:
        _add_kpis_web(slide, kpis, rx, text_y, rw)
        text_y += 1.6
    support = data.get("texto_apoio") or ""
    if support:
        add_text_box(slide, support, rx, text_y, rw, 0.85, 13, False, C_TEXT_MED)
        text_y += 0.95
    pontos = data.get("pontos") or []
    if pontos:
        _add_bullets(slide, pontos, rx, text_y, rw, 6.75 - text_y, 12)
    _add_source_footer(slide, data, assets, light=True)


def _draw_quote(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_DARK_BLUE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "destaque_citacao", 0.45, 0.4, dark_bg=True)
    quote = data.get("citacao") or {}
    citation_text = quote.get("texto") if isinstance(quote, dict) else ""
    main_text = citation_text or data.get("texto_apoio") or data.get("titulo") or ""
    # decorative opening quote mark
    add_text_box(slide, "“", 0.5, 0.75, 1.5, 1.5, 120, True, C_BLUE)
    displayed = f"“{main_text}”" if citation_text else main_text
    add_text_box(slide, displayed, 0.65, 1.8, 12.0, 2.5, 32, True, C_WHITE,
                 italic=bool(citation_text))
    # subtitulo appears below the main text (same as web card)
    subtitle = data.get("subtitulo") or ""
    if subtitle and not citation_text:
        add_text_box(slide, subtitle, 0.65, 4.4, 12.0, 0.6, 18, False, C_TEXT_LIGHT)
    # author attribution from citacao
    author = quote.get("autor") if isinstance(quote, dict) else ""
    cargo  = quote.get("cargo")  if isinstance(quote, dict) else ""
    inst   = quote.get("instituicao") if isinstance(quote, dict) else ""
    attrib = " · ".join(filter(None, [author, cargo, inst]))
    if attrib:
        add_text_box(slide, f"— {attrib}", 0.65, 4.9, 12.0, 0.6, 16, False, C_TEXT_LIGHT)
    _add_source_footer(slide, data, assets)


def _draw_tags(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_WHITE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "nuvem_de_tags", 0.45, 0.35)
    add_text_box(slide, data.get("titulo") or "TEMAS EM DESTAQUE",
                 0.45, 0.9, 12.3, 0.72, 28, True, C_TEXT)
    sizes = [26, 22, 18, 15, 13]
    for i, tag in enumerate((data.get("tags") or [])[:25]):
        row, col = divmod(i, 5)
        cx = 0.6 + col * 2.5 + (0.22 if row % 2 else 0)
        cy = 2.0 + row * 0.9
        fs = sizes[i % 5]
        pill_w = max(1.2, min(2.4, 0.3 + len(tag) * 0.14))
        pill = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(cy), Inches(pill_w), Inches(0.52)
        )
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_LIGHT_BLUE
        pill.line.color.rgb = C_KPI_BORDER
        add_text_box(slide, f"#{tag}", cx + 0.08, cy + 0.05, pill_w - 0.16, 0.44,
                     fs, True, C_BLUE, PP_ALIGN.CENTER)
    _add_source_footer(slide, data, assets, light=True)


def _draw_infographic(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_WHITE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "visao_geral_infografica", 0.45, 0.35)
    add_text_box(slide, data.get("titulo") or "VISÃO GERAL",
                 0.45, 0.9, 12.3, 0.72, 28, True, C_TEXT)
    blocks = (data.get("blocos") or [])[:4]
    for i, block in enumerate(blocks):
        row, col = divmod(i, 2)
        bx = 0.4 + col * 6.6
        by = 2.0 + row * 2.45
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bx), Inches(by), Inches(6.15), Inches(2.15)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = C_LIGHT_GRAY
        card.line.color.rgb = C_BORDER
        btitle   = block.get("titulo") or ""
        conteudo = block.get("conteudo") or ""
        pontos_b = block.get("pontos") or []
        if btitle:
            add_text_box(slide, btitle, bx + 0.2, by + 0.15, 5.75, 0.44,
                         14, True, C_TEXT_GRAY)
        if pontos_b:
            _add_bullets(slide, pontos_b, bx + 0.2, by + 0.65, 5.75, 1.3, 11)
        elif conteudo:
            add_text_box(slide, conteudo, bx + 0.2, by + 0.65, 5.75, 1.28, 11, False, C_TEXT_MED)
    kpis = data.get("kpis") or []
    if kpis and not blocks:
        _add_kpis_web(slide, kpis, 0.45, 2.0, 12.3)
    _add_source_footer(slide, data, assets, light=True)


def _draw_map(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_LIGHT_GRAY)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "mapa_nacional", 0.45, 0.35)
    add_text_box(slide, data.get("titulo") or "ALCANCE NACIONAL",
                 0.45, 0.9, 12.3, 0.72, 28, True, C_TEXT)
    map_path = _asset(data.get("imagem_arquivo") or "mapa_brasil.png", assets)
    if map_path:
        _add_picture(slide, map_path, 1.2, 1.9, 10.9, 4.5, fill=True)
    else:
        ph = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.9), Inches(10.3), Inches(4.5)
        )
        ph.fill.solid()
        ph.fill.fore_color.rgb = C_BORDER
        ph.line.color.rgb = C_BORDER
        caption = data.get("texto_apoio") or data.get("imagem_descricao") or "Mapa de alcance"
        add_text_box(slide, "INSERIR mapa_brasil.png", 2.0, 3.2, 9.3, 0.6,
                     18, True, C_BLUE, PP_ALIGN.CENTER)
        add_text_box(slide, caption, 2.0, 3.95, 9.3, 0.65, 13, False, C_TEXT_MED, PP_ALIGN.CENTER)
    _add_source_footer(slide, data, assets, light=True)


def _draw_recognition(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_WHITE)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "reconhecimento", 0.45, 0.35)
    add_text_box(slide, data.get("titulo") or "RECONHECIMENTO",
                 0.45, 0.9, 12.3, 0.72, 28, True, C_TEXT)
    items = (data.get("reconhecimentos") or [])[:8]
    if items:
        cols   = min(4, len(items))
        card_w = (SLIDE_WIDTH_IN - 0.8 - 0.2 * (cols - 1)) / cols
        for i, item in enumerate(items):
            row, col = divmod(i, 4)
            cx = 0.4 + col * (card_w + 0.2)
            cy = 2.05 + row * 2.3
            card = slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(cy), Inches(card_w), Inches(2.0)
            )
            card.fill.solid()
            card.fill.fore_color.rgb = C_LIGHT_GRAY
            card.line.color.rgb = C_BORDER
            nome  = item.get("nome", "")
            cargo = item.get("cargo", "")
            msg   = item.get("mensagem", "")
            add_text_box(slide, nome, cx + 0.14, cy + 0.2, card_w - 0.28, 0.5,
                         12, True, C_TEXT_GRAY, PP_ALIGN.CENTER)
            if cargo:
                add_text_box(slide, cargo, cx + 0.14, cy + 0.75, card_w - 0.28, 0.4,
                             10, False, C_TEXT_MED, PP_ALIGN.CENTER)
            if msg:
                add_text_box(slide, msg, cx + 0.14, cy + 1.2, card_w - 0.28, 0.65,
                             9, False, C_TEXT_LIGHT, PP_ALIGN.CENTER)
    _add_source_footer(slide, data, assets, light=True)


def _draw_end(slide, data: dict, style: dict, guide: dict, assets: Path) -> None:
    add_background_rect(slide, C_GREEN)
    idx = data.get("_slide_index", 1)
    _add_badge(slide, idx, "encerramento", 0.45, 0.4, dark_bg=True)
    title = data.get("titulo") or "OBRIGADO"
    add_text_box(slide, title.upper(), 0.65, 1.0, 12.0, 1.1, 48, True, C_WHITE, PP_ALIGN.CENTER)
    subtitle = data.get("subtitulo") or ""
    if subtitle:
        add_text_box(slide, subtitle, 0.65, 2.15, 12.0, 0.6, 18, False, C_WHITE, PP_ALIGN.CENTER)
    texto = data.get("texto_apoio") or ""
    if texto:
        add_text_box(slide, texto, 0.65, 2.9, 12.0, 0.65, 14, False, C_WHITE, PP_ALIGN.CENTER)
    pontos = (data.get("pontos") or [])[:4]
    if pontos:
        y = 3.65
        for p in pontos:
            add_text_box(slide, f"• {p}", 2.0, y, 9.3, 0.42, 13, False, C_WHITE)
            y += 0.44
    else:
        contact = data.get("contato") or PRESENTATION_CONTACT
        lines: list[str] = []
        if isinstance(contact, dict):
            lines = [contact.get(k, "") for k in ("nome", "cargo", "telefone", "email", "website")]
            lines = [ln for ln in lines if isinstance(ln, str) and ln.strip()]
        if lines:
            add_text_box(slide, "\n".join(lines), 0.65, 3.85, 12.0, 1.5, 14, False, C_WHITE, PP_ALIGN.CENTER)
    _add_branding(slide, assets)


def _draw_references(slide, sources: list[dict], style: dict, guide: dict) -> None:
    add_background_rect(slide, C_LIGHT_GRAY)
    add_text_box(slide, "REFERÊNCIAS", 0.5, 0.35, 12.0, 0.7, 36, True, C_BLUE)
    y = 1.35
    row_step = min(0.9, 5.6 / max(1, len(sources)))
    for source in sources:
        title_s = source.get("titulo", "Fonte sem título")
        url     = source.get("url", "")
        add_text_box(slide, f"{source.get('id', '')} — {title_s}", 0.65, y, 12.0, 0.38,
                     11, True, C_TEXT)
        if url:
            link_box = add_text_box(slide, url, 0.65, y + 0.39, 12.0, 0.34, 8, False, C_BLUE)
            try:
                link_box.text_frame.paragraphs[0].runs[0].hyperlink.address = url
            except (IndexError, AttributeError):
                pass
        y += row_step
        if y > 6.95:
            break


# ── Registry ──────────────────────────────────────────────────────────────────

LAYOUT_RENDERERS = {
    "capa":                    _draw_cover,
    "dados_municipio":         _draw_municipality,
    "divisor_secao":           _draw_divider,
    "conteudo_com_metrica":    _draw_content,
    "destaque_citacao":        _draw_quote,
    "nuvem_de_tags":           _draw_tags,
    "visao_geral_infografica": _draw_infographic,
    "mapa_nacional":           _draw_map,
    "reconhecimento":          _draw_recognition,
    "encerramento":            _draw_end,
}


# ── Entry points ──────────────────────────────────────────────────────────────

def criar_apresentacao(presentation: dict, caminho_saida: str | Path, assets_dir: str | Path | None = None) -> Path:
    """Renderiza os slides em PPTX 16:9 no estilo dos cards web. Retorna o caminho do arquivo."""
    guide      = load_style_guide()
    assets_path = Path(assets_dir) if assets_dir else ASSETS_DIR
    catalog    = guide["catalogo_de_layouts"]
    prs        = Presentation()
    prs.slide_width  = Inches(SLIDE_WIDTH_IN)
    prs.slide_height = Inches(SLIDE_HEIGHT_IN)
    blank_layout = prs.slide_layouts[6]

    slides = presentation["slides"]
    end_index = next(
        (i for i, s in enumerate(slides) if s.get("tipo_layout") == "encerramento"),
        len(slides),
    )
    content_image_index = 0
    for index, slide_data in enumerate(slides):
        data = dict(slide_data)
        data["_slide_index"] = index + 1

        if index == end_index and presentation.get("fontes"):
            ref_slide = prs.slides.add_slide(blank_layout)
            _draw_references(ref_slide, presentation.get("fontes", []),
                             catalog.get("referencias", {}), guide)

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
    """Confirma que o artefato salvo é um PPTX válido com slides suficientes."""
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
