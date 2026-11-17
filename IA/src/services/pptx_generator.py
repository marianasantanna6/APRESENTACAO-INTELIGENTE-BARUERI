'''Renderiza apresentações validadas como PPTX 16:9 no padrão visual das apresentações SIT Barueri.

Padrões extraídos das apresentações de referência (Canva — SIT Barueri 2025, UNIP, Metaverso e
Fórum Cidades Inteligentes):

* fundos escuros em navy/índigo; slides de conteúdo com faixa fotográfica azulada à esquerda;
* capa com skyline, "PREFEITURA DE" + título institucional enorme e barra de logos inferior;
* divisórias com gradiente roxo→azul, título centralizado, supertítulo vazado e faixa de
  6 cores na base com o bloco da seção atual elevado e ligado ao título por um conector;
* conteúdo: título em caixa alta no topo à esquerda, logos no topo à direita, imagem ou
  gráfico grande à esquerda e KPI + texto à direita, ODS na base direita;
* slides claros (nuvem de tags, mapa e encerramento) com fundo cinza-claro e texto escuro.

Todo texto passa por ``fit_text``: a fonte é reduzida até o mínimo previsto e, só se ainda
não couber, o texto é abreviado com reticências e um aviso é registrado em ``limitacoes``.
'''

from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls, qn
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Emu, Inches, Pt

from config.pptx_style import load_style_guide, visual_limits
from config.settings import ASSETS_DIR, PRESENTATION_CONTACT, PROJECT_ROOT
from services.chart_generator import chartable_kpis, generate_kpi_chart


SLIDE_WIDTH_IN = 40 / 3   # 13.33"
SLIDE_HEIGHT_IN = 7.5

# ── Grade de layout (polegadas) ──────────────────────────────────────────────
MARGIN_X = 0.55
CONTENT_RIGHT = SLIDE_WIDTH_IN - MARGIN_X        # 12.78
CONTENT_TOP = 1.85                               # abaixo do cabeçalho (título + logos)
CONTENT_BOTTOM = 6.45                            # acima do rodapé (fontes / ODS)
FOOTER_Y = 6.62
STRIP_W = 4.1                                    # faixa fotográfica dos slides de conteúdo

# ── Paleta SIT Barueri (referências Canva) ───────────────────────────────────
NAVY_DEEP = "#0E0C2C"       # fundo dos slides de conteúdo
NAVY_PANEL = "#161447"      # cartões / painéis
NAVY_LINE = "#2E2C7A"       # bordas sutis
STRIP_BLUE = "#2456B0"      # faixa fotográfica (sem foto)
GRAD_PURPLE = "#3A1A6B"     # divisória — esquerda
GRAD_BLUE = "#1B4FA6"       # divisória — direita
WHITE = "#FFFFFF"
TEXT_SOFT = "#DCE0EC"
TEXT_MUTED = "#A9B0C8"
LAVENDER = "#BDB5EE"        # subtítulo "Pilar N"
ACCENT_GREEN = "#34C98B"    # números de resultados
ACCENT_TEAL = "#2BC4B4"
ACCENT_YELLOW = "#F5C518"
ACCENT_ORANGE = "#F7943B"
ACCENT_PURPLE = "#A57CFF"   # títulos de bloco (Metaverso)
LINK_BLUE = "#7DB0FF"
CONNECTOR = "#F08A4B"
LIGHT_BG = "#EEF1F6"
LIGHT_TEXT = "#14162B"
LIGHT_MUTED = "#5E6373"
LIGHT_WORD_GRAY = "#8E929D"

SECTION_STRIP = ["#F7943B", "#4A7FC1", "#C0504D", "#9BBB59", "#8064A2", "#4BACC6"]
TAG_STRIP = ["#4A7FC1", "#C0504D", "#9BBB59", "#8064A2", "#4BACC6", "#F7943B", "#2E3192"]
KPI_ACCENTS = [ACCENT_TEAL, ACCENT_YELLOW, ACCENT_ORANGE]

FONT_TITLE = "Montserrat"
FONT_BODY = "Calibri"

LOGO_FILES = ["prefeitura_barueri.png", "sit.png", "inovacao_barueri.png", "tv_inovacao.png"]
ODS_FILES = ["ods_goals_strip.png", "ods_strip.png"]
MIN_IMAGE_PX = (800, 500)   # regras_de_conteudo_e_concisao.imagens.qualidade_minima_px
REFERENCES_PER_PAGE = 8


# ── Contexto de renderização ─────────────────────────────────────────────────

@dataclass
class RenderContext:
    slide_number: int
    limits: dict
    assets: Path
    warnings: list[str] = field(default_factory=list)

    def warn(self, message: str) -> None:
        text = f"Slide {self.slide_number}: {message}"
        if text not in self.warnings:
            self.warnings.append(text)


# ── Cores e preenchimentos ───────────────────────────────────────────────────

def _rgb(value: str) -> RGBColor:
    return RGBColor.from_string(value.lstrip("#").upper())


def _set_transparency(shape, opacity: float) -> None:
    '''Define a opacidade (0–1) do preenchimento sólido da forma.'''
    try:
        color_node = shape._element.spPr.solidFill.srgbClr
    except AttributeError:
        return
    alpha = OxmlElement("a:alpha")
    alpha.set("val", str(round(max(0.0, min(1.0, opacity)) * 100000)))
    color_node.append(alpha)


def _set_gradient(shape, stops: list[tuple[float, str, float]], angle: float = 0) -> None:
    '''Aplica gradiente linear. ``stops``: (posição 0–100, cor, opacidade 0–1). ``angle``: 0 = →, 90 = ↓.'''
    sp_pr = shape._element.spPr
    fill_tags = {qn(t) for t in ("a:solidFill", "a:gradFill", "a:noFill", "a:blipFill", "a:pattFill")}
    for child in list(sp_pr):
        if child.tag in fill_tags:
            sp_pr.remove(child)
    gs = "".join(
        f'<a:gs pos="{int(pos * 1000)}"><a:srgbClr val="{color.lstrip("#").upper()}">'
        f'<a:alpha val="{round(alpha * 100000)}"/></a:srgbClr></a:gs>'
        for pos, color, alpha in stops
    )
    grad = parse_xml(
        f'<a:gradFill {nsdecls("a")} rotWithShape="1"><a:gsLst>{gs}</a:gsLst>'
        f'<a:lin ang="{int(angle * 60000)}" scaled="0"/></a:gradFill>'
    )
    sp_pr.find(qn("a:prstGeom")).addnext(grad)


def _rect(slide, x, y, w, h, color: str | None, *, alpha: float | None = None,
          shape=MSO_SHAPE.RECTANGLE, line: str | None = None, line_pt: float = 1.0,
          dash: bool = False, name: str | None = None):
    sp = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if color is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = _rgb(color)
        if alpha is not None and alpha < 1:
            _set_transparency(sp, alpha)
    if line:
        sp.line.color.rgb = _rgb(line)
        sp.line.width = Pt(line_pt)
        if dash:
            sp.line.dash_style = MSO_LINE.DASH
    else:
        sp.line.fill.background()
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        sp.adjustments[0] = min(0.5, 0.12 / max(0.01, min(w, h)))
    if name:
        sp.name = name
    return sp


def add_background_rect(slide, color: str | RGBColor):
    '''Preenche o slide inteiro com uma cor sólida (helper recomendado pelo guia).'''
    hex_color = color if isinstance(color, str) else f"#{color}"
    return _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, hex_color, name="fundo")


def _line(slide, x1, y1, x2, y2, color: str, width_pt: float = 1.25):
    conn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    conn.line.color.rgb = _rgb(color)
    conn.line.width = Pt(width_pt)
    return conn


def _skyline(slide, x0: float, x1: float, base_y: float, max_h: float, color: str,
             alpha: float, seed: int = 7) -> None:
    '''Silhueta de prédios (textura das capas de referência quando não há foto).'''
    x, r = x0, seed
    while x < x1 - 0.05:
        r = (r * 1103515245 + 12345) % (2 ** 31)
        bw = min(0.22 + (r % 100) / 100 * 0.42, x1 - x)
        bh = max_h * (0.28 + ((r >> 8) % 100) / 100 * 0.72)
        _rect(slide, x, base_y - bh, bw, bh, color, alpha=alpha)
        x += bw + 0.05


# ── Medição e ajuste de texto ────────────────────────────────────────────────

_FONT_DIRS = [
    ASSETS_DIR / "fonts",
    Path("C:/Windows/Fonts"),
    Path.home() / "AppData/Local/Microsoft/Windows/Fonts",
    Path("/usr/share/fonts/truetype/montserrat"),
    Path("/usr/share/fonts/truetype/msttcorefonts"),
    Path("/usr/share/fonts/truetype/crosextra"),
    Path("/usr/share/fonts/truetype/liberation"),
    Path("/usr/share/fonts/truetype/dejavu"),
    Path("/Library/Fonts"),
]
_FONT_FILES = {
    (FONT_TITLE, True): ["Montserrat-Bold.ttf", "Montserrat-ExtraBold.ttf"],
    (FONT_TITLE, False): ["Montserrat-Regular.ttf", "Montserrat-Medium.ttf"],
    (FONT_BODY, True): ["calibrib.ttf", "Carlito-Bold.ttf"],
    (FONT_BODY, False): ["calibri.ttf", "Carlito-Regular.ttf"],
}
# Substitutas métricas + fator de largura em relação à fonte real (conservador: superestima).
_SUBSTITUTES = {
    FONT_TITLE: [("arialbd.ttf", "arial.ttf", 1.14), ("LiberationSans-Bold.ttf", "LiberationSans-Regular.ttf", 1.14),
                 ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf", 1.04)],
    FONT_BODY: [("arialbd.ttf", "arial.ttf", 0.92), ("LiberationSans-Bold.ttf", "LiberationSans-Regular.ttf", 0.92),
                ("DejaVuSans-Bold.ttf", "DejaVuSans.ttf", 0.84)],
}
_MEASURE_PX = 200
_SAFETY = 1.06   # folga para diferenças de renderização entre PowerPoint/LibreOffice


def _find_font(filename: str) -> Path | None:
    for directory in _FONT_DIRS:
        candidate = directory / filename
        if candidate.is_file():
            return candidate
    return None


@lru_cache(maxsize=8)
def _metric_font(face: str, bold: bool):
    for filename in _FONT_FILES.get((face, bold), []):
        path = _find_font(filename)
        if path:
            return ImageFont.truetype(str(path), _MEASURE_PX), 1.0
    for bold_file, regular_file, factor in _SUBSTITUTES.get(face, []):
        path = _find_font(bold_file if bold else regular_file)
        if path:
            return ImageFont.truetype(str(path), _MEASURE_PX), factor
    return None, 1.0


def _heuristic_em(text: str, face: str, bold: bool) -> float:
    title = face == FONT_TITLE
    width = 0.0
    for ch in text:
        if ch == " ":
            width += 0.28
        elif ch in ".,:;!|il'’“”-":
            width += 0.32
        elif ch.isupper():
            width += 0.76 if title else 0.6
        elif ch.isdigit():
            width += 0.68 if title else 0.52
        else:
            width += 0.62 if title else 0.49
    return width * (1.06 if bold else 1.0)


@lru_cache(maxsize=8192)
def text_width_in(text: str, size_pt: float, face: str = FONT_BODY, bold: bool = False) -> float:
    '''Largura estimada (polegadas) do texto em uma linha.'''
    font, factor = _metric_font(face, bold)
    if font is not None:
        em = font.getlength(text) / _MEASURE_PX * factor
    else:
        em = _heuristic_em(text, face, bold)
    return em * size_pt / 72 * _SAFETY


def _split_long_word(word: str, size, face, bold, width_in) -> list[str]:
    parts = []
    while word and text_width_in(word, size, face, bold) > width_in:
        cut = len(word) - 1
        while cut > 1 and text_width_in(word[:cut], size, face, bold) > width_in:
            cut -= 1
        parts.append(word[:cut])
        word = word[cut:]
    if word:
        parts.append(word)
    return parts


def wrap_lines(text: str, size: float, face: str, bold: bool, width_in: float) -> list[str]:
    '''Quebra o texto em linhas como o PowerPoint faria (palavra a palavra).'''
    lines: list[str] = []
    for paragraph in (text or "").split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = ""
        for word in words:
            candidate = f"{current} {word}" if current else word
            if text_width_in(candidate, size, face, bold) <= width_in:
                current = candidate
                continue
            if current:
                lines.append(current)
            pieces = _split_long_word(word, size, face, bold, width_in)
            lines.extend(pieces[:-1])
            current = pieces[-1] if pieces else ""
        lines.append(current)
    return lines


@dataclass
class Fit:
    size: float
    text: str
    lines: int
    truncated: bool
    line_height: float

    @property
    def height(self) -> float:
        return self.lines * self.line_height


def _ellipsize(line: str, size, face, bold, width_in) -> str:
    candidate = line.rstrip(" ,.;:—-")
    while candidate and text_width_in(candidate + "…", size, face, bold) > width_in:
        cut = candidate.rfind(" ")
        candidate = candidate[:cut] if cut > len(candidate) * 0.6 else candidate[:-1]
        candidate = candidate.rstrip(" ,.;:—-")
    return candidate + "…"


def fit_text(text: str, w: float, h: float, *, max_pt: float, min_pt: float, face: str = FONT_BODY,
             bold: bool = False, max_lines: int | None = None, spacing: float = 1.15) -> Fit:
    '''Maior tamanho entre ``max_pt`` e ``min_pt`` em que o texto cabe na caixa; abrevia se necessário.'''
    min_pt = min(min_pt, max_pt)
    size = max_pt
    while True:
        line_h = size * spacing / 72
        lines = wrap_lines(text, size, face, bold, w)
        allowed = int((h + 1e-6) // line_h)
        if max_lines:
            allowed = min(allowed, max_lines)
        if allowed >= 1 and len(lines) <= allowed:
            return Fit(size, text, len(lines), False, line_h)
        if size <= min_pt:
            break
        size = max(min_pt, size - (1 if size <= 24 else 2))
    allowed = max(1, allowed)
    kept = lines[:allowed]
    kept[-1] = _ellipsize(kept[-1], size, face, bold, w)
    return Fit(size, " ".join(kept), allowed, True, size * spacing / 72)


def _style_run(run, *, size, face, bold, italic, color, alpha=None) -> None:
    run.font.name = face
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = _rgb(color)
    if alpha is not None and alpha < 1:
        node = run._r.get_or_add_rPr().find(qn("a:solidFill")).find(qn("a:srgbClr"))
        alpha_el = OxmlElement("a:alpha")
        alpha_el.set("val", str(round(alpha * 100000)))
        node.append(alpha_el)


def _outline_run(run, color: str, width_pt: float, *, hollow: bool, alpha: float = 1.0) -> None:
    '''Contorno de texto (títulos "vazados" das referências).'''
    r_pr = run._r.get_or_add_rPr()
    if hollow:
        for el in r_pr.findall(qn("a:solidFill")):
            r_pr.remove(el)
    ln = parse_xml(
        f'<a:ln {nsdecls("a")} w="{int(width_pt * 12700)}"><a:solidFill>'
        f'<a:srgbClr val="{color.lstrip("#").upper()}"><a:alpha val="{round(alpha * 100000)}"/></a:srgbClr>'
        f'</a:solidFill></a:ln>'
    )
    r_pr.insert(0, ln)
    if hollow:
        ln.addnext(parse_xml(f'<a:noFill {nsdecls("a")}/>'))


def _new_frame(slide, x, y, w, h, anchor, name):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    if name:
        shape.name = name
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.auto_size = MSO_AUTO_SIZE.NONE
    frame.margin_left = frame.margin_right = frame.margin_top = frame.margin_bottom = Pt(0)
    frame.vertical_anchor = anchor
    return shape, frame


def add_text(slide, text: str, x: float, y: float, w: float, h: float, *, size: float,
             min_size: float | None = None, bold: bool = False, color: str = WHITE,
             align=PP_ALIGN.LEFT, face: str = FONT_BODY, anchor=MSO_ANCHOR.TOP,
             max_lines: int | None = None, italic: bool = False, spacing: float = 1.15,
             upper: bool = False, ctx: RenderContext | None = None, what: str = "texto",
             name: str | None = None, alpha: float | None = None,
             outline: tuple[str, float, bool] | None = None, wrap: bool = True, soft_lines: bool = False):
    '''Caixa de texto ajustada à área: reduz a fonte até ``min_size`` e só então abrevia (com aviso).

    ``soft_lines``: ``max_lines`` vira meta de tamanho — se o texto não couber nessas linhas nem no
    tamanho mínimo, usa as linhas que a caixa comportar antes de abreviar.'''
    text = (text or "").strip()
    if upper:
        text = text.upper()
    fit = fit_text(text, w, h, max_pt=size, min_pt=min_size or size, face=face, bold=bold,
                   max_lines=max_lines, spacing=spacing)
    if fit.truncated and soft_lines and max_lines:
        fit = fit_text(text, w, h, max_pt=size, min_pt=min_size or size, face=face, bold=bold,
                       spacing=spacing)
    if fit.truncated and ctx is not None:
        ctx.warn(f"{what}: texto abreviado para caber no layout (limite visual atingido).")
    shape, frame = _new_frame(slide, x, y, w, h, anchor, name or what)
    frame.word_wrap = wrap
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    paragraph.line_spacing = Pt(fit.size * spacing)
    paragraph.space_after = Pt(0)
    run = paragraph.add_run()
    run.text = fit.text
    _style_run(run, size=fit.size, face=face, bold=bold, italic=italic, color=color, alpha=alpha)
    if outline:
        _outline_run(run, outline[0], outline[1], hollow=outline[2])
    return shape, fit


def add_text_box(slide, text, x, y, w, h, font_size, bold=False, color=None,
                 align=PP_ALIGN.LEFT, font_name=None, italic=False):
    '''Compatibilidade com o helper recomendado pelo guia; usa o ajuste automático de texto.'''
    hex_color = WHITE if color is None else (color if isinstance(color, str) else f"#{color}")
    shape, _ = add_text(slide, text, x, y, w, h, size=font_size, min_size=max(7, font_size * 0.6),
                        bold=bold, color=hex_color, align=align, face=font_name or FONT_BODY,
                        italic=italic, anchor=MSO_ANCHOR.MIDDLE)
    return shape


def _set_bullet(paragraph, color: str, indent_in: float) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_pr.set("marL", str(int(Inches(indent_in))))
    p_pr.set("indent", str(-int(Inches(indent_in))))
    p_pr.append(parse_xml(f'<a:buClr {nsdecls("a")}><a:srgbClr val="{color.lstrip("#").upper()}"/></a:buClr>'))
    p_pr.append(parse_xml(f'<a:buFont {nsdecls("a")} typeface="Arial"/>'))
    p_pr.append(parse_xml(f'<a:buChar {nsdecls("a")} char="•"/>'))


def bullets_font_size(points: list[str], w: float, h: float, *, size: float, min_size: float,
                      face: str = FONT_BODY, indent: float = 0.24) -> tuple[float, bool, float]:
    '''Simula ``add_bullets``: (maior tamanho em que a lista cabe, se coube, altura necessária / disponível).'''
    points = [p for p in points if p and p.strip()]
    if not points:
        return size, True, 0.0
    current = size
    while True:
        line_h, gap = current * 1.15 / 72, current * 0.45 / 72
        needed = sum(len(wrap_lines(p, current, face, False, w - indent)) for p in points) * line_h
        needed += gap * (len(points) - 1)
        if needed <= h + 1e-6:
            return current, True, needed / max(h, 1e-6)
        if current <= min_size:
            return current, False, needed / max(h, 1e-6)
        current = max(min_size, current - 1)


def add_bullets(slide, points: list[str], x, y, w, h, *, size: float, min_size: float,
                color: str = TEXT_SOFT, bullet_color: str = ACCENT_TEAL, face: str = FONT_BODY,
                ctx: RenderContext | None = None, what: str = "a lista de pontos",
                align=PP_ALIGN.LEFT, bullets: bool = True) -> float:
    '''Lista com marcadores em uma única caixa ajustada. Retorna a altura usada.'''
    points = [p.strip() for p in points if p and p.strip()]
    if not points or h <= 0:
        return 0.0
    spacing, gap_factor = 1.15, 0.45
    indent = 0.24 if bullets else 0.0
    size_now = size
    while True:
        line_h = size_now * spacing / 72
        gap = size_now * gap_factor / 72
        counts = [len(wrap_lines(p, size_now, face, False, w - indent)) for p in points]
        needed = sum(counts) * line_h + gap * (len(points) - 1)
        if needed <= h + 1e-6 or size_now <= min_size:
            break
        size_now = max(min_size, size_now - 1)
    kept = list(points)
    if needed > h + 1e-6:
        # Ainda não coube no tamanho mínimo: abrevia o último ponto que cabe e sinaliza.
        kept, used = [], 0.0
        for point, count in zip(points, counts):
            block = count * line_h + (gap if kept else 0)
            if used + block <= h + 1e-6:
                kept.append(point)
                used += block
                continue
            remaining_lines = int((h - used - (gap if kept else 0)) // line_h)
            if remaining_lines >= 1:
                fit = fit_text(point, w - indent, remaining_lines * line_h, max_pt=size_now,
                               min_pt=size_now, face=face, spacing=spacing)
                kept.append(fit.text)
            break
        if ctx is not None:
            omitted = len(points) - len(kept)
            detail = f" ({omitted} ponto(s) não couberam)" if omitted > 0 else ""
            ctx.warn(f"{what}: conteúdo abreviado para caber no layout{detail}.")
        counts = [len(wrap_lines(p, size_now, face, False, w - indent)) for p in kept]
        needed = sum(counts) * line_h + gap * (len(kept) - 1)
    shape, frame = _new_frame(slide, x, y, w, h, MSO_ANCHOR.TOP, what)
    for i, point in enumerate(kept):
        paragraph = frame.paragraphs[0] if i == 0 else frame.add_paragraph()
        paragraph.alignment = align
        paragraph.line_spacing = Pt(size_now * spacing)
        paragraph.space_before = Pt(0 if i == 0 else size_now * gap_factor)
        paragraph.space_after = Pt(0)
        if bullets:
            _set_bullet(paragraph, bullet_color, indent)
        run = paragraph.add_run()
        run.text = point
        _style_run(run, size=size_now, face=face, bold=False, italic=False, color=color)
    shape.height = Inches(min(h, needed) + 0.04)
    return min(h, needed)


# ── Imagens ──────────────────────────────────────────────────────────────────

def _asset(name: str | None, assets_dir: Path) -> Path | None:
    if not name:
        return None
    candidate = Path(name)
    if candidate.is_absolute() and candidate.is_file():
        return candidate
    candidate = assets_dir / candidate.name
    return candidate if candidate.is_file() else None


def _image_size(source) -> tuple[int, int] | None:
    try:
        if isinstance(source, io.BytesIO):
            source.seek(0)
            with Image.open(source) as image:
                size = image.size
            source.seek(0)
            return size
        with Image.open(source) as image:
            return image.size
    except (OSError, ValueError):
        return None


def place_image(slide, source, x: float, y: float, w: float, h: float, *, mode: str = "contain",
                ctx: RenderContext | None = None, name: str = "imagem"):
    '''Insere imagem sem distorção. ``cover`` recorta o excesso; ``contain`` centraliza inteira;
    ``auto`` recorta só quando a diferença de proporção é pequena (≤ 35%).'''
    size = _image_size(source)
    if not size or not size[0] or not size[1]:
        return None
    iw, ih = size
    if ctx is not None and (iw < MIN_IMAGE_PX[0] or ih < MIN_IMAGE_PX[1]) and name != "logo":
        ctx.warn(f"a imagem '{name}' tem {iw}x{ih}px, abaixo do mínimo de "
                 f"{MIN_IMAGE_PX[0]}x{MIN_IMAGE_PX[1]}px do guia.")
    box_ratio, img_ratio = w / h, iw / ih
    if mode == "auto":
        mode = "cover" if max(box_ratio, img_ratio) / min(box_ratio, img_ratio) <= 1.35 else "contain"
    src = source if isinstance(source, io.BytesIO) else str(source)
    if mode == "cover":
        shape = slide.shapes.add_picture(src, Inches(x), Inches(y), Inches(w), Inches(h))
        if img_ratio > box_ratio:
            crop = (1 - box_ratio / img_ratio) / 2
            shape.crop_left = shape.crop_right = crop
        elif img_ratio < box_ratio:
            crop = (1 - img_ratio / box_ratio) / 2
            shape.crop_top = shape.crop_bottom = crop
    else:
        draw_w, draw_h = (w, w / img_ratio) if img_ratio >= box_ratio else (h * img_ratio, h)
        shape = slide.shapes.add_picture(
            src, Inches(x + (w - draw_w) / 2), Inches(y + (h - draw_h) / 2), Inches(draw_w), Inches(draw_h)
        )
    shape.name = name
    return shape


# ── Elementos institucionais ─────────────────────────────────────────────────

def _logo_group(slide, assets: Path, x: float, y: float, w: float, h: float, *, align: str = "right",
                dark_bg: bool = True, names: list[str] | None = None) -> None:
    '''Logos institucionais lado a lado; sem arquivos, usa a assinatura textual da SIT.'''
    paths = [p for p in (_asset(n, assets) for n in (names or LOGO_FILES)) if p]
    sizes = [(p, _image_size(p)) for p in paths]
    sizes = [(p, s) for p, s in sizes if s and s[1]]
    if sizes:
        gap = 0.18
        logo_h = h
        widths = [logo_h * s[0] / s[1] for _, s in sizes]
        total = sum(widths) + gap * (len(widths) - 1)
        if total > w:
            scale = (w - gap * (len(widths) - 1)) / sum(widths)
            logo_h *= scale
            widths = [wd * scale for wd in widths]
            total = w
        cx = x + (w - total if align == "right" else 0)
        for (path, _), wd in zip(sizes, widths):
            place_image(slide, path, cx, y + (h - logo_h) / 2, wd, logo_h, name="logo")
            cx += wd + gap
        return
    color = WHITE if dark_bg else LIGHT_TEXT
    sub = TEXT_SOFT if dark_bg else LIGHT_MUTED
    pp_align = PP_ALIGN.RIGHT if align == "right" else PP_ALIGN.LEFT
    add_text(slide, "PREFEITURA DE BARUERI", x, y, w, h * 0.55, size=14, min_size=9, bold=True,
             color=color, face=FONT_TITLE, align=pp_align, anchor=MSO_ANCHOR.BOTTOM, max_lines=1,
             name="assinatura_prefeitura")
    add_text(slide, "SECRETARIA DE INOVAÇÃO E TECNOLOGIA", x, y + h * 0.55, w, h * 0.45, size=9,
             min_size=7, bold=True, italic=True, color=sub, face=FONT_TITLE, align=pp_align,
             max_lines=1, name="assinatura_sit")


def _ods_strip(slide, assets: Path, x: float, y: float, w: float, h: float) -> None:
    '''Faixa ODS apenas com o arquivo oficial (não fabrica alinhamento a ODS sem o asset).'''
    for name in ODS_FILES:
        path = _asset(name, assets)
        if path:
            place_image(slide, path, x, y, w, h, mode="contain", name="logo")
            return


def _sources_footer(slide, data: dict, x: float, y: float, w: float, *, dark: bool = True) -> None:
    source_ids = data.get("fontes") or []
    text = ("Fontes: " + " · ".join(source_ids)) if source_ids else \
        "Sem fontes vinculadas — conteúdo não verificado"
    add_text(slide, text, x, y, w, 0.32, size=9, min_size=7, color=TEXT_MUTED if dark else LIGHT_MUTED,
             max_lines=2, spacing=1.1, name="rodape_fontes")


def _photo_strip(slide, assets: Path, asset_name: str, w: float = STRIP_W) -> None:
    '''Faixa fotográfica azulada à esquerda dos slides de conteúdo.'''
    photo = _asset(asset_name, assets) or _asset("skyline_barueri.png", assets)
    if photo:
        place_image(slide, photo, 0, 0, w, SLIDE_HEIGHT_IN, mode="cover", name="foto_faixa")
        overlay = _rect(slide, 0, 0, w, SLIDE_HEIGHT_IN, STRIP_BLUE, name="overlay_faixa")
        _set_gradient(overlay, [(0, STRIP_BLUE, 0.55), (100, NAVY_DEEP, 0.75)], angle=90)
    else:
        strip = _rect(slide, 0, 0, w, SLIDE_HEIGHT_IN, STRIP_BLUE, name="faixa")
        _set_gradient(strip, [(0, STRIP_BLUE, 0.85), (100, NAVY_DEEP, 1.0)], angle=90)
        _skyline(slide, 0.05, w - 0.05, SLIDE_HEIGHT_IN, 3.6, "#6F9BEA", 0.12, seed=11)
    edge = _rect(slide, w - 0.9, 0, 0.9, SLIDE_HEIGHT_IN, NAVY_DEEP, name="transicao_faixa")
    _set_gradient(edge, [(0, NAVY_DEEP, 0.0), (100, NAVY_DEEP, 1.0)], angle=0)


def _header(slide, data: dict, ctx: RenderContext, *, dark: bool = True, title_w: float = 7.7,
            default_title: str = "") -> None:
    '''Título em caixa alta no topo à esquerda + subtítulo "Pilar" + logos à direita.'''
    title = data.get("titulo") or default_title
    _, fit = add_text(slide, title, MARGIN_X, 0.32, title_w, 1.05, size=30, min_size=20, bold=True,
                      color=WHITE if dark else LIGHT_TEXT, face=FONT_TITLE, upper=True,
                      max_lines=ctx.limits["titulo_max_linhas"], spacing=1.08, ctx=ctx,
                      what="o título", name="titulo")
    subtitle = data.get("subtitulo") or ""
    if subtitle:
        add_text(slide, subtitle, MARGIN_X, 0.36 + fit.height, title_w, 0.36, size=15, min_size=11,
                 bold=True, color=LAVENDER if dark else LIGHT_MUTED, face=FONT_TITLE, max_lines=1,
                 ctx=ctx, what="o subtítulo", name="subtitulo")
    logo_x = MARGIN_X + title_w + 0.25
    _logo_group(slide, ctx.assets, logo_x, 0.32, CONTENT_RIGHT - logo_x, 0.62, dark_bg=dark)


# ── KPIs ─────────────────────────────────────────────────────────────────────

def _kpi_parts(item: dict) -> tuple[str, str, str, str]:
    return (str(item.get("valor", "")).strip(), str(item.get("unidade") or "").strip(),
            str(item.get("label", "")).strip(), str(item.get("contexto") or "").strip())


def _kpi_number_width(value: str, unit: str, size: float) -> float:
    width = text_width_in(value, size, FONT_TITLE, True)
    if unit:
        width += text_width_in(" " + unit, size * 0.5, FONT_TITLE, True)
    return width * 1.06  # número nunca quebra linha: folga extra para fontes substitutas


def _kpi_number_size(value: str, unit: str, width: float, max_pt: float, min_pt: float) -> float | None:
    size = max_pt
    while size >= min_pt:
        if _kpi_number_width(value, unit, size) <= width:
            return size
        size -= 2
    return None


def _kpi_sizing(items, width: float, max_pt: float, min_pt: float):
    '''Tamanho de cada número; se valor + unidade não cabe no mínimo do guia, a unidade vai para o rótulo.'''
    result = []
    for value, unit, label, context in items:
        size = _kpi_number_size(value, unit, width, max_pt, min_pt)
        if size is None and unit:
            size = _kpi_number_size(value, "", width, max_pt, min_pt)
            if size is not None:
                result.append((size, value, "", f"{unit} · {label}", context))
                continue
        result.append((size, value, unit, label, context))
    return result


def kpis_fit_row(kpis: list[dict], w: float, ctx: RenderContext, maximum: int | None = None,
                 pad: float = 0.0) -> bool:
    '''Indica se os KPIs cabem lado a lado respeitando o tamanho mínimo do número.'''
    items = [_kpi_parts(k) for k in kpis[: maximum or ctx.limits["kpis_max_por_slide"]]]
    if not items:
        return True
    col_w = (w - 0.22 * (len(items) - 1)) / len(items) - 2 * pad
    min_pt = ctx.limits["kpi_fonte_min_pt"]
    return all(size for size, *_ in _kpi_sizing(items, col_w, min_pt, min_pt))


def _draw_kpi_number(slide, value, unit, size, x, y, w, h, color, align):
    shape, frame = _new_frame(slide, x, y, w, h, MSO_ANCHOR.BOTTOM, "kpi_valor")
    frame.word_wrap = False
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    paragraph.line_spacing = Pt(size * 1.05)
    run = paragraph.add_run()
    run.text = value
    _style_run(run, size=size, face=FONT_TITLE, bold=True, italic=False, color=color)
    if unit:
        unit_run = paragraph.add_run()
        unit_run.text = " " + unit
        _style_run(unit_run, size=size * 0.5, face=FONT_TITLE, bold=True, italic=False, color=color)


def _kpi_block(slide, kpis: list[dict], x: float, y: float, w: float, h: float, ctx: RenderContext, *,
               number_color: str | None = WHITE, dark: bool = True, cards: bool = False,
               max_pt: float = 54, maximum: int | None = None, force_stack: bool = False,
               pad: float | None = None) -> float:
    '''KPIs em linha (ou empilhados quando o número não cabe no tamanho mínimo do guia).

    O tamanho do número respeita ``tipografia.fonte_kpi_numero`` (mín./máx.). Retorna a altura usada.'''
    if not kpis:
        return 0.0
    maximum = maximum or ctx.limits["kpis_max_por_slide"]
    if len(kpis) > maximum:
        ctx.warn(f"{len(kpis) - maximum} KPI(s) acima do limite de {maximum} não foram exibidos.")
    items = [_kpi_parts(k) for k in kpis[:maximum]]
    n = len(items)
    min_pt = ctx.limits["kpi_fonte_min_pt"]
    max_pt = min(max_pt, ctx.limits["kpi_fonte_max_pt"])
    label_color = TEXT_MUTED if dark else LIGHT_MUTED
    pad = (0.18 if cards else 0.0) if pad is None else pad
    gap = 0.22

    # 1) Linha horizontal — todos os números precisam caber no mínimo do guia.
    col_w = (w - gap * (n - 1)) / n
    inset = pad + (0.14 if cards else 0.0)   # afastamento da barra de acento
    inner_w = col_w - inset - pad
    sized = _kpi_sizing(items, inner_w, max_pt, min_pt)
    has_ctx = any(c for *_, c in items)
    text_block = 0.42 + (0.34 if has_ctx else 0) + 0.12
    if all(entry[0] for entry in sized) and not (force_stack and n > 1):
        size = min(min(entry[0] for entry in sized), max(min_pt, (h - 2 * pad - text_block) * 72 / 1.05))
        num_h = size * 1.05 / 72
        used_h = min(h, num_h + text_block + 2 * pad)
        for i, (_, value, unit, label, context) in enumerate(sized):
            cx = x + i * (col_w + gap)
            accent = KPI_ACCENTS[i % len(KPI_ACCENTS)]
            if cards:
                _rect(slide, cx, y, col_w, used_h, NAVY_PANEL, alpha=0.92, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
                      line=NAVY_LINE, name="kpi_cartao")
                _rect(slide, cx, y + 0.18, 0.07, used_h - 0.36, accent, name="kpi_acento")
            _draw_kpi_number(slide, value, unit, size, cx + inset, y + pad, inner_w, num_h,
                             number_color or accent, PP_ALIGN.LEFT if cards else PP_ALIGN.CENTER)
            ly = y + pad + num_h + 0.06
            add_text(slide, label, cx + inset, ly, inner_w, 0.42, size=12, min_size=9, bold=True,
                     color=WHITE if (cards and dark) else label_color, face=FONT_TITLE, upper=True,
                     max_lines=2, spacing=1.05, align=PP_ALIGN.LEFT if cards else PP_ALIGN.CENTER,
                     ctx=ctx, what=f"o rótulo do KPI {i + 1}", name="kpi_rotulo")
            if not cards:
                _rect(slide, cx + col_w / 2 - 0.25, ly + 0.46, 0.5, 0.045, accent, name="kpi_acento")
            if context:
                add_text(slide, context, cx + inset, ly + 0.5, inner_w, 0.32, size=10, min_size=8,
                         color=label_color, max_lines=2, spacing=1.05,
                         align=PP_ALIGN.LEFT if cards else PP_ALIGN.CENTER, ctx=ctx,
                         what=f"o contexto do KPI {i + 1}", name="kpi_contexto")
        return used_h

    # 2) Empilhado — número à esquerda, rótulo à direita.
    row_h = min(1.45, h / n)
    num_w = w * 0.66
    row_max = min(max_pt, (row_h - 0.22) * 72 / 1.05)
    for i, (size, value, unit, label, context) in enumerate(_kpi_sizing(items, num_w - 0.2, row_max, min_pt)):
        ry = y + i * row_h
        accent = KPI_ACCENTS[i % len(KPI_ACCENTS)]
        if size is None:
            size = _kpi_number_size(value, unit, num_w - 0.2, min_pt, 18) or 18
            ctx.warn(f"o valor do KPI {i + 1} precisou ficar abaixo de {min_pt:g} pt para caber.")
        if cards:
            _rect(slide, x, ry, w, row_h - 0.1, NAVY_PANEL, alpha=0.92, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
                  line=NAVY_LINE, name="kpi_cartao")
        _rect(slide, x + 0.06, ry + 0.14, 0.06, row_h - 0.38, accent, name="kpi_acento")
        _draw_kpi_number(slide, value, unit, size, x + 0.22, ry, num_w - 0.2, row_h - 0.12,
                         number_color or accent, PP_ALIGN.LEFT)
        label_text = f"{label}\n{context}" if context else label
        add_text(slide, label_text, x + num_w + 0.1, ry + 0.04, w - num_w - 0.2, row_h - 0.18, size=12,
                 min_size=9, bold=True, color=WHITE if dark else LIGHT_TEXT, face=FONT_TITLE, upper=not context,
                 anchor=MSO_ANCHOR.MIDDLE, spacing=1.05, ctx=ctx, what=f"o rótulo do KPI {i + 1}",
                 name="kpi_rotulo")
    return row_h * n


def _kpi_block_height(kpis: list[dict], w: float, ctx: RenderContext, maximum: int | None = None,
                      pad: float = 0.0) -> float:
    items = [_kpi_parts(k) for k in kpis[: maximum or ctx.limits["kpis_max_por_slide"]]]
    if not items:
        return 0.0
    if kpis_fit_row(kpis, w, ctx, maximum, pad + 0.07 if pad else 0.0):
        return 1.55 + (0.34 if any(c for *_, c in items) else 0)
    return 0.95 * len(items)


# ── Painel de imagem / gráfico ───────────────────────────────────────────────

def _image_panel(slide, data: dict, x: float, y: float, w: float, h: float, ctx: RenderContext, *,
                 kpis_for_chart: list[dict] | None = None, light: bool = False) -> None:
    '''Imagem do slide; sem imagem, gráfico dos KPIs (mesma unidade); sem dados, espaço reservado.'''
    image = _asset(data.get("_imagem_arquivo"), ctx.assets)
    if image:
        if place_image(slide, image, x, y, w, h, mode="auto", ctx=ctx, name="imagem_conteudo"):
            return
    kpis_for_chart = (kpis_for_chart or [])[: ctx.limits["kpis_max_por_slide"]]
    if kpis_for_chart and chartable_kpis(kpis_for_chart):
        _rect(slide, x, y, w, h, NAVY_PANEL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, line=NAVY_LINE,
              name="painel_grafico")
        chart = generate_kpi_chart(kpis_for_chart, width_in=w - 0.3, height_in=h - 0.3,
                                   theme="light" if light else "dark")
        if chart is not None:
            place_image(slide, chart, x + 0.15, y + 0.15, w - 0.3, h - 0.3, mode="contain", name="grafico")
            return
    _rect(slide, x, y, w, h, NAVY_PANEL if not light else "#E2E7F0", alpha=0.9,
          shape=MSO_SHAPE.ROUNDED_RECTANGLE, line="#4A4A9C" if not light else "#B8C0CF", dash=True,
          name="espaco_imagem")
    icon_w = min(1.1, w * 0.25)
    icon_x, icon_y = x + (w - icon_w) / 2, y + h * 0.26
    _rect(slide, icon_x, icon_y, icon_w, icon_w * 0.72, None, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
          line=TEXT_MUTED, line_pt=1.5, name="icone_imagem")
    _rect(slide, icon_x + icon_w * 0.12, icon_y + icon_w * 0.3, icon_w * 0.5, icon_w * 0.34, TEXT_MUTED,
          alpha=0.6, shape=MSO_SHAPE.ISOSCELES_TRIANGLE, name="icone_imagem")
    _rect(slide, icon_x + icon_w * 0.62, icon_y + icon_w * 0.12, icon_w * 0.16, icon_w * 0.16, ACCENT_YELLOW,
          shape=MSO_SHAPE.OVAL, name="icone_imagem")
    caption_y = icon_y + icon_w * 0.72 + 0.25
    add_text(slide, "ESPAÇO PARA IMAGEM", x + 0.3, caption_y, w - 0.6, 0.32, size=13, min_size=10,
             bold=True, color=WHITE if not light else LIGHT_TEXT, face=FONT_TITLE, align=PP_ALIGN.CENTER,
             max_lines=1, name="legenda_imagem")
    caption = data.get("imagem_descricao") or "Adicione uma foto, mapa ou captura de tela do projeto."
    add_text(slide, caption, x + 0.4, caption_y + 0.4, w - 0.8, max(0.4, y + h - caption_y - 0.6), size=12,
             min_size=9, color=TEXT_MUTED if not light else LIGHT_MUTED, align=PP_ALIGN.CENTER, ctx=ctx,
             what="a descrição da imagem", name="descricao_imagem")


def _text_column(slide, data: dict, x: float, y: float, w: float, bottom: float, ctx: RenderContext, *,
                 dark: bool = True, support_max: float = 17, center: bool = False) -> float:
    '''Texto de apoio (meta de ``descricao_texto.max_linhas`` linhas) seguido dos pontos.

    ``center`` centraliza o bloco verticalmente no espaço disponível (coluna ao lado de um painel).
    Retorna a coordenada inferior do conteúdo.'''
    support = data.get("texto_apoio") or ""
    points = data.get("pontos") or []
    top, created = y, len(slide.shapes)
    if support and bottom - y > 0.3:
        support_h = min(bottom - y, max(1.75, (bottom - y) * 0.45) if points else bottom - y)
        shape, fit = add_text(slide, support, x, y, w, support_h, size=support_max, min_size=12,
                              color=TEXT_SOFT if dark else LIGHT_TEXT,
                              max_lines=ctx.limits["descricao_conteudo_max_linhas"] if points else None,
                              soft_lines=True, ctx=ctx, what="o texto de apoio", name="texto_apoio")
        shape.height = Inches(fit.height + 0.04)
        y += fit.height + 0.25
    if points and bottom - y > 0.25:
        y += add_bullets(slide, points, x, y, w, bottom - y, size=15, min_size=11,
                         color=TEXT_SOFT if dark else LIGHT_TEXT, ctx=ctx)
    if center and y > top:
        delta = (bottom - y) / 2
        if delta > 0.05:
            for shape in list(slide.shapes)[created:]:
                shape.top = shape.top + Inches(delta)
            y += delta
    return y


# ── Renderizadores por layout ────────────────────────────────────────────────

def _draw_cover(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    background = _asset("skyline_barueri.png", assets)
    add_background_rect(slide, "#0B1840")
    if background:
        place_image(slide, background, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, mode="cover", ctx=ctx,
                    name="foto_capa")
    else:
        sky = _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, "#1B4A9E", name="ceu")
        _set_gradient(sky, [(0, "#0B1840", 1.0), (55, "#1B4A9E", 1.0), (100, "#2D6CC4", 1.0)], angle=90)
        _skyline(slide, 0.0, SLIDE_WIDTH_IN, 6.45, 4.2, "#8FB4F2", 0.16, seed=3)
        _skyline(slide, 0.3, SLIDE_WIDTH_IN, 6.45, 2.6, "#0B1840", 0.35, seed=19)
    overlay = _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, "#05082A", name="overlay_capa")
    _set_gradient(overlay, [(0, "#05082A", 0.55), (60, "#0B1F5C", 0.35), (100, "#05082A", 0.85)], angle=90)

    for i, flag in enumerate(["bandeira_brasil.png", "bandeira_sp.png"]):
        path = _asset(flag, assets)
        if path:
            place_image(slide, path, CONTENT_RIGHT - 1.95 + i * 1.0, 0.25, 0.95, 0.62, mode="contain",
                        name="logo")

    add_text(slide, "PREFEITURA DE", 0.75, 1.15, 8.0, 0.6, size=30, min_size=22, bold=True, face=FONT_TITLE,
             max_lines=1, name="pre_titulo")
    title = data.get("titulo") or "APRESENTAÇÃO"
    _, title_fit = add_text(slide, title, 0.7, 1.72, 11.9, 2.3, size=88, min_size=40, bold=True,
                            face=FONT_TITLE, upper=True, max_lines=ctx.limits["titulo_max_linhas"],
                            spacing=1.0, ctx=ctx, what="o título da capa", name="titulo")
    y = 1.72 + title_fit.height + 0.18
    subtitle = data.get("subtitulo") or ""
    if subtitle:
        _, fit = add_text(slide, subtitle, 0.78, y, 11.8, 0.95, size=24, min_size=16, color=WHITE,
                          max_lines=2, ctx=ctx, what="o subtítulo da capa", name="subtitulo")
        y += fit.height + 0.25
    support = data.get("texto_apoio") or ""
    if support and support != subtitle and 6.25 - y - 0.4 >= 0.3:
        box_w, inner = 9.2, 0.2
        fit = fit_text(support, box_w - 2 * inner, min(1.2, 6.25 - y - 2 * inner), max_pt=16, min_pt=12,
                       max_lines=3)
        _rect(slide, 0.78, y, box_w, fit.height + 2 * inner, "#0A1F5C", alpha=0.88, name="caixa_descricao")
        add_text(slide, support, 0.78 + inner, y + inner, box_w - 2 * inner, fit.height + 0.02, size=16,
                 min_size=12, color=WHITE, max_lines=3, ctx=ctx, what="a descrição da capa",
                 name="descricao_curta")

    _rect(slide, 0, 6.5, SLIDE_WIDTH_IN, 1.0, "#05082A", alpha=0.55, name="barra_logos")
    _logo_group(slide, assets, MARGIN_X, 6.65, 6.5, 0.7, align="left")
    _ods_strip(slide, assets, 8.6, 6.6, CONTENT_RIGHT - 8.6, 0.8)


def _draw_divider(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    add_background_rect(slide, GRAD_PURPLE)
    photo = _asset("skyline_tecnologico.png", assets)
    if photo:
        place_image(slide, photo, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, mode="cover", ctx=ctx, name="foto_divisor")
    grad = _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, GRAD_PURPLE, name="gradiente_divisor")
    alpha = 0.78 if photo else 1.0
    _set_gradient(grad, [(0, GRAD_PURPLE, alpha), (55, "#2A2F8C", alpha), (100, GRAD_BLUE, alpha)], angle=0)
    if not photo:
        for cx, cy, d, color, a in [(8.9, 0.3, 4.3, "#5B8DEF", 0.10), (10.0, 2.6, 3.2, "#D94F9B", 0.10),
                                    (0.2, 4.2, 3.0, "#7A4FD9", 0.12)]:
            _rect(slide, cx, cy, d, d, color, alpha=a, shape=MSO_SHAPE.OVAL, name="decoracao")

    _logo_group(slide, assets, MARGIN_X, 0.3, 5.0, 0.62, align="left", names=LOGO_FILES[:2])
    if any(_asset(n, assets) for n in LOGO_FILES[2:]):
        _logo_group(slide, assets, 8.3, 0.3, CONTENT_RIGHT - 8.3, 0.62, names=LOGO_FILES[2:])

    title = data.get("titulo") or "SEÇÃO"
    subtitle = data.get("subtitulo") or ""
    ghost_size = None
    if subtitle:
        ghost = fit_text(subtitle.upper(), 11.6, 1.0, max_pt=54, min_pt=30, face=FONT_TITLE, bold=True,
                         max_lines=1)
        ghost_size = None if ghost.truncated else ghost.size
    if ghost_size:
        add_text(slide, subtitle, 0.85, 1.75, 11.63, 1.0, size=ghost_size, min_size=ghost_size, bold=True,
                 face=FONT_TITLE, upper=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.BOTTOM, max_lines=1,
                 outline=(TEXT_SOFT, 1.25, True), name="supertitulo_fantasma")
    _, title_fit = add_text(slide, title, 1.0, 2.85, 11.33, 1.5, size=44, min_size=28, bold=True,
                            face=FONT_TITLE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP,
                            max_lines=ctx.limits["titulo_max_linhas"], spacing=1.08, ctx=ctx,
                            what="o título da seção", name="titulo")
    y = 2.85 + title_fit.height + 0.12
    if subtitle and not ghost_size:
        _, fit = add_text(slide, subtitle, 1.5, y, 10.33, 0.6, size=18, min_size=13, color=TEXT_SOFT,
                          align=PP_ALIGN.CENTER, max_lines=2, ctx=ctx, what="o subtítulo da seção",
                          name="subtitulo")
        y += fit.height + 0.1
    support = data.get("texto_apoio") or ""
    if support:
        _, fit = add_text(slide, support, 1.8, y, 9.73, max(0.4, 5.15 - y), size=16, min_size=12,
                          color=TEXT_SOFT, align=PP_ALIGN.CENTER, max_lines=3, ctx=ctx,
                          what="o texto de apoio", name="texto_apoio")
        y += fit.height

    # Faixa de 6 cores com o bloco da seção atual elevado e conectado ao título.
    seg_w = SLIDE_WIDTH_IN / len(SECTION_STRIP)
    active = (int(data.get("_secao", 1)) - 1) % len(SECTION_STRIP)
    strip_top, tile_top = 6.95, 5.85
    for i, color in enumerate(SECTION_STRIP):
        top = tile_top if i == active else strip_top
        _rect(slide, i * seg_w, top, seg_w, SLIDE_HEIGHT_IN - top, color, name="faixa_secoes")
    tile_cx = active * seg_w + seg_w / 2
    add_text(slide, f"{int(data.get('_secao', 1)):02d}", active * seg_w, tile_top + 0.18, seg_w, 0.75, size=36,
             min_size=24, bold=True, face=FONT_TITLE, align=PP_ALIGN.CENTER, max_lines=1, name="numero_secao")
    add_text(slide, "SEÇÃO", active * seg_w, tile_top + 0.92, seg_w, 0.3, size=11, min_size=9, bold=True,
             face=FONT_TITLE, align=PP_ALIGN.CENTER, max_lines=1, name="rotulo_secao")
    start_y = min(y + 0.35, tile_top - 0.5)
    elbow_y = start_y + (tile_top - start_y) / 2
    _rect(slide, SLIDE_WIDTH_IN / 2 - 0.05, start_y - 0.05, 0.1, 0.1, CONNECTOR, shape=MSO_SHAPE.OVAL,
          name="conector")
    _line(slide, SLIDE_WIDTH_IN / 2, start_y, SLIDE_WIDTH_IN / 2, elbow_y, CONNECTOR)
    _line(slide, min(SLIDE_WIDTH_IN / 2, tile_cx), elbow_y, max(SLIDE_WIDTH_IN / 2, tile_cx), elbow_y, CONNECTOR)
    _line(slide, tile_cx, elbow_y, tile_cx, tile_top, CONNECTOR)


def _content_frame(slide, data: dict, ctx: RenderContext, strip_asset: str) -> None:
    add_background_rect(slide, NAVY_DEEP)
    _photo_strip(slide, ctx.assets, strip_asset)
    _header(slide, data, ctx)


def _draw_content(slide, data: dict, ctx: RenderContext) -> None:
    '''Imagem/gráfico à esquerda, KPI + texto à direita (como "Internet Social" nas referências).

    Sem imagem: KPIs da mesma unidade viram gráfico no painel; KPIs heterogêneos ocupam o painel como
    números de destaque ("Projetos de inovação"). O painel só fica como espaço reservado sem dados.'''
    _content_frame(slide, data, ctx, "skyline_barueri.png")
    kpis = data.get("kpis") or []
    panel_w, panel_h = 6.1, CONTENT_BOTTOM - CONTENT_TOP
    rx = MARGIN_X + panel_w + 0.45
    rw = CONTENT_RIGHT - rx
    y = CONTENT_TOP
    has_image = bool(_asset(data.get("_imagem_arquivo"), ctx.assets))
    if has_image or not kpis:
        _image_panel(slide, data, MARGIN_X, CONTENT_TOP, panel_w, panel_h, ctx)
        if kpis:
            kpi_h = min(_kpi_block_height(kpis, rw, ctx), 2.6)
            y += _kpi_block(slide, kpis, rx, y, rw, kpi_h, ctx, max_pt=48) + 0.3
    elif chartable_kpis(kpis[: ctx.limits["kpis_max_por_slide"]]):
        _image_panel(slide, data, MARGIN_X, CONTENT_TOP, panel_w, panel_h, ctx, kpis_for_chart=kpis)
    else:
        _rect(slide, MARGIN_X, CONTENT_TOP, panel_w, panel_h, NAVY_PANEL, alpha=0.88,
              shape=MSO_SHAPE.ROUNDED_RECTANGLE, line=NAVY_LINE, name="painel_kpis")
        n = min(len(kpis), ctx.limits["kpis_max_por_slide"])
        block_h = min(panel_h - 0.5, 1.45 * n)
        _kpi_block(slide, kpis, MARGIN_X + 0.3, CONTENT_TOP + (panel_h - block_h) / 2, panel_w - 0.6, block_h,
                   ctx, max_pt=60, force_stack=True)
    _text_column(slide, data, rx, y, rw, CONTENT_BOTTOM, ctx, center=y == CONTENT_TOP)
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 6.1)
    _ods_strip(slide, ctx.assets, 9.3, FOOTER_Y - 0.05, CONTENT_RIGHT - 9.3, 0.75)


def _draw_municipality(slide, data: dict, ctx: RenderContext) -> None:
    _content_frame(slide, {**data, "titulo": data.get("titulo") or "BARUERI EM DADOS"}, ctx,
                   "vista_aerea_barueri.png")
    kpis = data.get("kpis") or []
    maximum = ctx.limits["kpis_max_dados_municipio"]
    y = CONTENT_TOP
    if kpis and not kpis_fit_row(kpis, CONTENT_RIGHT - MARGIN_X, ctx, maximum, pad=0.18):
        # Números longos: cartões empilhados à esquerda e texto à direita.
        n = min(len(kpis), maximum)
        block_h = min(CONTENT_BOTTOM - CONTENT_TOP, 1.45 * n)
        _kpi_block(slide, kpis, MARGIN_X, CONTENT_TOP, 6.1, block_h, ctx, number_color=ACCENT_GREEN, cards=True,
                   max_pt=54, maximum=maximum, force_stack=True)
        _text_column(slide, data, MARGIN_X + 6.55, CONTENT_TOP, CONTENT_RIGHT - MARGIN_X - 6.55, CONTENT_BOTTOM, ctx)
        _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 6.1)
        _ods_strip(slide, ctx.assets, 9.3, FOOTER_Y - 0.05, CONTENT_RIGHT - 9.3, 0.75)
        return
    if kpis:
        kpi_h = min(_kpi_block_height(kpis, CONTENT_RIGHT - MARGIN_X, ctx, maximum) + 0.3, 2.9)
        y += _kpi_block(slide, kpis, MARGIN_X, y, CONTENT_RIGHT - MARGIN_X, kpi_h, ctx,
                        number_color=ACCENT_GREEN, cards=True, max_pt=54, maximum=maximum) + 0.3
    has_text = bool(data.get("texto_apoio") or data.get("pontos"))
    if chartable_kpis(kpis[:maximum]) and CONTENT_BOTTOM - y >= 1.6:
        chart_w = 6.1 if has_text else CONTENT_RIGHT - MARGIN_X
        _image_panel(slide, data | {"_imagem_arquivo": None}, MARGIN_X, y, chart_w, CONTENT_BOTTOM - y, ctx,
                     kpis_for_chart=kpis[:maximum])
        if has_text:
            _text_column(slide, data, MARGIN_X + chart_w + 0.45, y, CONTENT_RIGHT - MARGIN_X - chart_w - 0.45,
                         CONTENT_BOTTOM, ctx)
    else:
        _text_column(slide, data, MARGIN_X, y, CONTENT_RIGHT - MARGIN_X, CONTENT_BOTTOM, ctx)
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 6.1)
    _ods_strip(slide, ctx.assets, 9.3, FOOTER_Y - 0.05, CONTENT_RIGHT - 9.3, 0.75)


def _draw_quote(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    add_background_rect(slide, NAVY_DEEP)
    photo = _asset("autoridade_evento.png", assets)
    if photo:
        place_image(slide, photo, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, mode="cover", ctx=ctx, name="foto_citacao")
    shade = _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, NAVY_DEEP, name="overlay_citacao")
    _set_gradient(shade, [(0, NAVY_DEEP, 0.96), (55, "#1B1650", 0.85 if photo else 1.0),
                          (100, GRAD_PURPLE, 0.35 if photo else 1.0)], angle=0)
    if not photo:
        _skyline(slide, 7.8, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, 3.2, "#7A6FE0", 0.10, seed=23)
    _logo_group(slide, assets, 8.3, 0.32, CONTENT_RIGHT - 8.3, 0.62)

    quote = data.get("citacao") or {}
    citation_text = quote.get("texto") if isinstance(quote, dict) else ""
    main_text = citation_text or data.get("texto_apoio") or data.get("titulo") or ""
    add_text(slide, "“", 0.5, 0.3, 1.6, 2.0, size=140, bold=True, color=ACCENT_TEAL, face=FONT_TITLE,
             max_lines=1, spacing=0.9, wrap=False, name="aspas")
    if citation_text:
        displayed = f"“{citation_text}”"
        max_lines, upper = ctx.limits["citacao_max_linhas"], False
    else:
        displayed = main_text
        max_lines, upper = 7, len(main_text) <= ctx.limits["citacao_max_caracteres"]
    _, fit = add_text(slide, displayed, 0.75, 1.85, 8.9, 3.5, size=40, min_size=18, bold=True,
                      color=ACCENT_YELLOW, face=FONT_TITLE, upper=upper, max_lines=max_lines, spacing=1.1,
                      ctx=ctx, what="o texto de destaque", name="texto_destaque")
    y = 1.85 + fit.height + 0.3
    author = quote.get("autor") if isinstance(quote, dict) else ""
    if author:
        _, fit = add_text(slide, f"— {author}", 0.8, y, 8.8, 0.6, size=18, min_size=13, color=WHITE,
                          max_lines=2, ctx=ctx, what="a autoria", name="autoria")
        y += fit.height + 0.15
    subtitle = data.get("subtitulo") or ""
    if subtitle and y < 6.0:
        add_text(slide, subtitle, 0.8, y, 8.8, min(0.7, 6.4 - y), size=16, min_size=12, color=TEXT_SOFT,
                 max_lines=2, ctx=ctx, what="o subtexto", name="subtexto")
    _sources_footer(slide, data, 0.8, FOOTER_Y + 0.1, 8.0)


def _light_background(slide, assets: Path, asset_name: str, ctx: RenderContext) -> None:
    add_background_rect(slide, LIGHT_BG)
    photo = _asset(asset_name, assets)
    if photo:
        place_image(slide, photo, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, mode="cover", ctx=ctx, name="foto_fundo")
        _rect(slide, 0, 0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, LIGHT_BG, alpha=0.86, name="veu_claro")
    else:
        _skyline(slide, 2.0, 11.3, 6.9, 5.2, "#C9D1DE", 0.35, seed=5)


TAG_SIZES = [30, 22, 18, 26, 15, 20, 24, 16, 28, 14, 21, 17, 25, 13, 19]
TAG_COLORS = [LIGHT_TEXT, LIGHT_WORD_GRAY, "#3A3F52", "#A5A9B3", "#000000"]


def _draw_tags(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    _light_background(slide, assets, "skyline_barueri.png", ctx)
    _header(slide, data, ctx, dark=False, default_title="TEMAS EM DESTAQUE")
    tags = [t.strip() for t in (data.get("tags") or []) if t and t.strip()]
    maximum = ctx.limits["tags_max_por_slide"]
    if len(tags) > maximum:
        ctx.warn(f"{len(tags) - maximum} tag(s) acima do limite de {maximum} não foram exibidas.")
        tags = tags[:maximum]
    ax, ay, aw, ah = 0.8, CONTENT_TOP - 0.1, SLIDE_WIDTH_IN - 1.6, CONTENT_BOTTOM - CONTENT_TOP + 0.1
    gap_x = 0.3

    def layout(scale: float):
        rows, row, row_w = [], [], 0.0
        for i, tag in enumerate(tags):
            size = max(10.0, TAG_SIZES[i % len(TAG_SIZES)] * scale)
            bold = i % 3 != 1
            text = tag.upper()
            width = text_width_in(text, size, FONT_TITLE, bold) * 1.08
            if width > aw:  # termo isolado maior que a área: reduz só ele
                size = max(10.0, size * aw / width)
                width = min(aw, text_width_in(text, size, FONT_TITLE, bold) * 1.08)
            needed = width + (gap_x if row else 0)
            if row and row_w + needed > aw:
                rows.append((row, row_w))
                row, row_w, needed = [], 0.0, width
            row.append((text, size, bold, width, TAG_COLORS[i % len(TAG_COLORS)]))
            row_w += needed
        if row:
            rows.append((row, row_w))
        height = sum(max(item[1] for item in r) * 1.3 / 72 for r, _ in rows)
        return rows, height

    scale = 1.0
    rows, height = layout(scale)
    while height > ah and scale > 0.5:
        scale -= 0.05
        rows, height = layout(scale)
    if height > ah:
        kept, total = [], 0.0
        for r in rows:
            rh = max(item[1] for item in r[0]) * 1.3 / 72
            if total + rh > ah:
                break
            kept.append(r)
            total += rh
        omitted = sum(len(r[0]) for r in rows) - sum(len(r[0]) for r in kept)
        ctx.warn(f"{omitted} tag(s) não couberam na nuvem e foram omitidas.")
        rows, height = kept, total
    y = ay + (ah - height) / 2
    for row, row_w in rows:
        rh = max(item[1] for item in row) * 1.3 / 72
        x = ax + (aw - row_w) / 2
        for text, size, bold, width, color in row:
            add_text(slide, text, x, y, width + 0.04, rh, size=size, bold=bold, color=color, face=FONT_TITLE,
                     anchor=MSO_ANCHOR.MIDDLE, max_lines=1, spacing=1.0, wrap=False, name="tag")
            x += width + gap_x
        y += rh
    seg_w = SLIDE_WIDTH_IN / len(TAG_STRIP)
    for i, color in enumerate(TAG_STRIP):
        _rect(slide, i * seg_w, 7.12, seg_w, SLIDE_HEIGHT_IN - 7.12, color, name="faixa_cores")
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 8.0, dark=False)


def _draw_infographic(slide, data: dict, ctx: RenderContext) -> None:
    add_background_rect(slide, NAVY_DEEP)
    glow = _rect(slide, 7.0, 1.4, 6.0, 6.0, ACCENT_PURPLE, shape=MSO_SHAPE.OVAL, name="decoracao")
    _set_gradient(glow, [(0, ACCENT_PURPLE, 0.0), (100, ACCENT_PURPLE, 0.10)], angle=90)
    _header(slide, data, ctx, default_title="VISÃO GERAL")
    blocks = (data.get("blocos") or [])[: ctx.limits["blocos_max_no_infografico"]]
    kpis = data.get("kpis") or []
    bottom, text_top = CONTENT_BOTTOM, CONTENT_TOP
    if kpis:
        if blocks:
            kpi_h = 1.2
        else:
            kpi_h = min(_kpi_block_height(kpis, CONTENT_RIGHT - MARGIN_X, ctx) + 0.3, 2.6)
        kpi_y = CONTENT_BOTTOM - kpi_h if blocks else CONTENT_TOP
        used = _kpi_block(slide, kpis, MARGIN_X, kpi_y, CONTENT_RIGHT - MARGIN_X, kpi_h, ctx, cards=True,
                          max_pt=44, number_color=WHITE, pad=0.1 if blocks else None)
        if blocks:
            bottom = kpi_y - 0.25
        else:
            text_top = kpi_y + used + 0.3
    if blocks:
        # Grade: 1 coluna (1 bloco), 2×N ou uma linha única com todos os blocos (colunas altas, como
        # nas referências). Escolhe a opção em que as listas ficam com a maior fonte sem abreviar.
        gap = 0.3
        options = [1] if len(blocks) == 1 else sorted({2, len(blocks)})

        def score(cols: int) -> tuple[bool, float, float]:
            rows_ = math.ceil(len(blocks) / cols)
            bw_ = (CONTENT_RIGHT - MARGIN_X - gap * (cols - 1)) / cols
            bh_ = (bottom - CONTENT_TOP - gap * (rows_ - 1)) / rows_
            worst, all_fit, overflow = 99.0, True, 0.0
            for block in blocks:
                title_fit = fit_text(block.get("titulo") or "", bw_ - 0.65, 0.75, max_pt=19, min_pt=12,
                                     face=FONT_TITLE, bold=True, max_lines=3, spacing=1.05)
                body_h = bh_ - 0.45 - title_fit.height
                size_, fits, ratio = bullets_font_size(block.get("pontos") or [block.get("conteudo") or ""],
                                                       bw_ - 0.65, body_h, size=14, min_size=10)
                worst, all_fit = min(worst, size_), all_fit and fits and not title_fit.truncated
                overflow = max(overflow, ratio)
            # Prioridade: caber sem abreviar → maior fonte → menor excesso.
            return all_fit, worst if all_fit else -overflow, -overflow

        cols = max(options, key=score)
        rows = math.ceil(len(blocks) / cols)
        bw = (CONTENT_RIGHT - MARGIN_X - gap * (cols - 1)) / cols
        bh = (bottom - CONTENT_TOP - gap * (rows - 1)) / rows
        for i, block in enumerate(blocks):
            row, col = divmod(i, cols)
            bx, by = MARGIN_X + col * (bw + gap), CONTENT_TOP + row * (bh + gap)
            _rect(slide, bx, by, bw, bh, NAVY_PANEL, alpha=0.7, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
                  line=NAVY_LINE, name="bloco")
            _rect(slide, bx + 0.2, by + 0.22, 0.13, 0.13, ACCENT_PURPLE, shape=MSO_SHAPE.OVAL, name="bloco_marcador")
            _, fit = add_text(slide, block.get("titulo") or "", bx + 0.45, by + 0.12, bw - 0.65, 0.75, size=19,
                              min_size=12, bold=True, color=ACCENT_PURPLE, face=FONT_TITLE, max_lines=3,
                              spacing=1.05, ctx=ctx, what=f"o título do bloco {i + 1}", name="bloco_titulo")
            _line(slide, bx + 0.45, by + 0.19 + fit.height, bx + min(bw - 0.3, 3.2), by + 0.19 + fit.height,
                  ACCENT_PURPLE, 0.75)
            body_y = by + 0.3 + fit.height
            points = block.get("pontos") or []
            if not points and block.get("conteudo"):
                points = [block["conteudo"]]
            add_bullets(slide, points, bx + 0.48, body_y, bw - 0.7, by + bh - 0.15 - body_y, size=14,
                        min_size=10, bullet_color=ACCENT_PURPLE, ctx=ctx, what=f"a lista do bloco {i + 1}")
    else:
        _text_column(slide, data, MARGIN_X, text_top, CONTENT_RIGHT - MARGIN_X, CONTENT_BOTTOM, ctx)
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 8.0)
    _ods_strip(slide, ctx.assets, 9.3, FOOTER_Y - 0.05, CONTENT_RIGHT - 9.3, 0.75)


def _draw_map(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    _light_background(slide, assets, "vista_aerea_barueri.png", ctx)
    _logo_group(slide, assets, 9.6, 0.3, CONTENT_RIGHT - 9.6, 0.55, dark_bg=False)
    _, fit = add_text(slide, data.get("titulo") or "ALCANCE NACIONAL", MARGIN_X, 0.3, 8.8, 1.0, size=40,
                      min_size=24, bold=True, color="#1B1F4B", face=FONT_TITLE, upper=True, align=PP_ALIGN.LEFT,
                      max_lines=ctx.limits["titulo_max_linhas"], spacing=1.05, ctx=ctx, what="o título",
                      name="titulo")
    caption = data.get("texto_apoio") or ""
    map_top = max(1.45, 0.35 + fit.height + 0.2)
    map_bottom = 5.85 if caption else 6.4
    map_path = _asset(data.get("imagem_arquivo") or "mapa_brasil.png", assets)
    if not map_path or not place_image(slide, map_path, 1.2, map_top, 10.93, map_bottom - map_top,
                                       mode="contain", ctx=ctx, name="mapa"):
        _image_panel(slide, {**data, "_imagem_arquivo": None,
                             "imagem_descricao": data.get("imagem_descricao") or "Mapa de alcance (mapa_brasil.png)"},
                     2.2, map_top, 8.93, map_bottom - map_top, ctx, light=True)
    if caption:
        add_text(slide, caption, 1.2, 5.95, 10.93, 0.55, size=15, min_size=11, color=LIGHT_TEXT,
                 align=PP_ALIGN.CENTER, max_lines=2, ctx=ctx, what="a legenda do mapa", name="legenda_mapa")
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y + 0.15, 8.0, dark=False)


def _draw_recognition(slide, data: dict, ctx: RenderContext) -> None:
    add_background_rect(slide, NAVY_DEEP)
    _skyline(slide, 0.0, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN, 2.4, "#3B3A8F", 0.18, seed=31)
    _header(slide, data, ctx, default_title="RECONHECIMENTO")
    items = data.get("reconhecimentos") or []
    maximum = ctx.limits["reconhecimentos_max_no_slide"]
    if len(items) > maximum:
        ctx.warn(f"{len(items) - maximum} reconhecimento(s) acima do limite de {maximum} não foram exibidos.")
        items = items[:maximum]
    if not items:
        _text_column(slide, data, MARGIN_X, CONTENT_TOP, CONTENT_RIGHT - MARGIN_X, CONTENT_BOTTOM, ctx)
    else:
        cols = min(4, len(items))
        rows = math.ceil(len(items) / cols)
        gap = 0.25
        cw = min(3.4, (CONTENT_RIGHT - MARGIN_X - gap * (cols - 1)) / cols)
        ch = min(2.8, (CONTENT_BOTTOM - CONTENT_TOP - gap * (rows - 1)) / rows)
        left = MARGIN_X + (CONTENT_RIGHT - MARGIN_X - (cw * cols + gap * (cols - 1))) / 2
        top = CONTENT_TOP + (CONTENT_BOTTOM - CONTENT_TOP - (ch * rows + gap * (rows - 1))) / 2
        for i, item in enumerate(items):
            row, col = divmod(i, cols)
            cx, cy = left + col * (cw + gap), top + row * (ch + gap)
            _rect(slide, cx, cy, cw, ch, NAVY_PANEL, alpha=0.95, shape=MSO_SHAPE.ROUNDED_RECTANGLE, line=NAVY_LINE,
                  name="premio_cartao")
            d = min(0.62, ch * 0.28)
            _rect(slide, cx + (cw - d) / 2, cy + 0.18, d, d, ACCENT_YELLOW, shape=MSO_SHAPE.OVAL, name="premio_icone")
            star = d * 0.56
            _rect(slide, cx + (cw - star) / 2, cy + 0.18 + (d - star) / 2 - 0.01, star, star, NAVY_DEEP,
                  shape=MSO_SHAPE.STAR_5_POINT, name="premio_icone")
            name_y = cy + 0.3 + d
            _, fit = add_text(slide, item.get("nome", ""), cx + 0.15, name_y, cw - 0.3, min(0.85, ch * 0.32),
                              size=15, min_size=10, bold=True, color=WHITE, face=FONT_TITLE, align=PP_ALIGN.CENTER,
                              max_lines=3, spacing=1.05, ctx=ctx, what=f"o nome do reconhecimento {i + 1}",
                              name="premio_nome")
            desc = item.get("descricao") or " · ".join(filter(None, [item.get("cargo"), item.get("mensagem")]))
            desc_y = name_y + fit.height + 0.1
            if desc and cy + ch - 0.12 - desc_y > 0.2:
                add_text(slide, desc, cx + 0.15, desc_y, cw - 0.3, cy + ch - 0.12 - desc_y, size=12, min_size=9,
                         color=TEXT_MUTED, align=PP_ALIGN.CENTER, ctx=ctx,
                         what=f"a descrição do reconhecimento {i + 1}", name="premio_descricao")
    _sources_footer(slide, data, MARGIN_X, FOOTER_Y, 8.0)
    _ods_strip(slide, ctx.assets, 9.3, FOOTER_Y - 0.05, CONTENT_RIGHT - 9.3, 0.75)


def _draw_end(slide, data: dict, ctx: RenderContext) -> None:
    assets = ctx.assets
    _light_background(slide, assets, "cidade_noturna.png", ctx)
    qr = _asset("qr_code_contato.png", assets)
    if qr:
        place_image(slide, qr, MARGIN_X, 0.3, 1.2, 1.2, mode="contain", name="logo")
    _ods_strip(slide, assets, 8.4, 0.3, CONTENT_RIGHT - 8.4, 0.8)
    band_top = 6.0
    _rect(slide, 0, band_top, SLIDE_WIDTH_IN, SLIDE_HEIGHT_IN - band_top, WHITE, name="faixa_logos")
    _logo_group(slide, assets, 6.2, band_top + 0.3, CONTENT_RIGHT - 6.2, 0.75, dark_bg=False)
    add_text(slide, "© Prefeitura Municipal de Barueri — Secretaria de Inovação e Tecnologia", 6.2, 7.18,
             CONTENT_RIGHT - 6.2, 0.22, size=8, min_size=7, color=LIGHT_MUTED, align=PP_ALIGN.RIGHT, max_lines=1,
             name="copyright")

    _, fit = add_text(slide, data.get("titulo") or "OBRIGADO", 1.0, 1.55, 11.33, 1.5, size=80, min_size=40,
                      bold=True, color=LIGHT_TEXT, face=FONT_TITLE, upper=True, align=PP_ALIGN.CENTER,
                      max_lines=ctx.limits["titulo_max_linhas"], spacing=1.0, ctx=ctx, what="o título",
                      name="titulo")
    y = 1.55 + fit.height + 0.2
    limit_y = band_top - 0.2
    for key, size, color, lines, label in (("subtitulo", 22, LIGHT_MUTED, 2, "o subtítulo"),
                                           ("texto_apoio", 16, LIGHT_TEXT, 3, "o texto de apoio")):
        value = data.get(key) or ""
        if value and limit_y - y > 0.35:
            _, f = add_text(slide, value, 1.6, y, 10.13, min(1.0, limit_y - y), size=size, min_size=12,
                            color=color, align=PP_ALIGN.CENTER, max_lines=lines, ctx=ctx, what=label, name=key)
            y += f.height + 0.15
    points = data.get("pontos") or []
    if not points:
        contact = data.get("contato") or PRESENTATION_CONTACT
        if isinstance(contact, dict):
            points = [contact.get(k, "") for k in ("nome", "cargo", "telefone", "email", "website")]
            points = [p for p in points if isinstance(p, str) and p.strip()]
    if points and limit_y - y > 0.3:
        add_bullets(slide, points, 2.5, y + 0.05, 8.33, limit_y - y - 0.05, size=15, min_size=11,
                    color=LIGHT_TEXT, ctx=ctx, what="a lista final", align=PP_ALIGN.CENTER, bullets=False)


def _draw_references(slide, sources: list[dict], ctx: RenderContext, page: int, pages: int) -> None:
    add_background_rect(slide, NAVY_DEEP)
    _photo_strip(slide, ctx.assets, "skyline_barueri.png", w=1.2)
    title = "REFERÊNCIAS" + (f" ({page}/{pages})" if pages > 1 else "")
    _header(slide, {"titulo": title}, ctx)
    cols = 1 if len(sources) <= REFERENCES_PER_PAGE // 2 else 2
    gap = 0.4
    x0 = 1.5
    col_w = (CONTENT_RIGHT - x0 - gap * (cols - 1)) / cols
    per_col = math.ceil(len(sources) / cols)
    row_h = min(0.95, (CONTENT_BOTTOM + 0.3 - CONTENT_TOP) / max(1, per_col))
    for i, source in enumerate(sources):
        col, row = divmod(i, per_col)
        x, y = x0 + col * (col_w + gap), CONTENT_TOP + row * row_h
        label = f"{source.get('id', '')} — {source.get('titulo', 'Fonte sem título')}"
        publisher = source.get("fonte") or source.get("autor_ou_instituicao") or ""
        if publisher:
            label += f" ({publisher})"
        _, fit = add_text(slide, label, x, y, col_w, row_h * 0.62, size=16 if len(sources) <= 4 else 13,
                          min_size=9, bold=True, color=WHITE,
                          max_lines=2, spacing=1.08, ctx=ctx, what=f"a referência {source.get('id', i + 1)}",
                          name="referencia")
        url = source.get("url", "")
        if url:
            shape, _ = add_text(slide, url, x, y + fit.height + 0.03, col_w, min(0.26, row_h * 0.3),
                                size=12 if len(sources) <= 4 else 10,
                                min_size=8, color=LINK_BLUE, max_lines=1, name="referencia_url")
            try:
                shape.text_frame.paragraphs[0].runs[0].hyperlink.address = url
            except (IndexError, AttributeError):
                pass


# ── Registro ─────────────────────────────────────────────────────────────────

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


# ── Pontos de entrada ────────────────────────────────────────────────────────

def criar_apresentacao(presentation: dict, caminho_saida: str | Path, assets_dir: str | Path | None = None) -> Path:
    """Renderiza os slides em PPTX 16:9 no padrão visual SIT Barueri e retorna o caminho do arquivo.

    Avisos de ajuste (texto abreviado, itens acima do limite, imagens de baixa resolução) são
    acrescentados a ``presentation["limitacoes"]``.
    """
    guide = load_style_guide()
    limits = visual_limits(guide)
    assets_path = Path(assets_dir) if assets_dir else ASSETS_DIR
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_WIDTH_IN)
    prs.slide_height = Inches(SLIDE_HEIGHT_IN)
    blank_layout = prs.slide_layouts[6]
    warnings: list[str] = []

    def new_context() -> RenderContext:
        return RenderContext(slide_number=len(prs.slides._sldIdLst), limits=limits, assets=assets_path,
                             warnings=warnings)

    slides = presentation["slides"]
    end_index = next(
        (i for i, s in enumerate(slides) if s.get("tipo_layout") == "encerramento"),
        len(slides),
    )
    sources = presentation.get("fontes") or []
    reference_pages = [sources[i:i + REFERENCES_PER_PAGE] for i in range(0, len(sources), REFERENCES_PER_PAGE)]
    content_image_index = 0
    section_number = 0
    for index, slide_data in enumerate(slides + [None]):
        if index == end_index and reference_pages:
            for page_number, page in enumerate(reference_pages, start=1):
                ref_slide = prs.slides.add_slide(blank_layout)
                _draw_references(ref_slide, page, new_context(), page_number, len(reference_pages))
        if slide_data is None:
            break
        data = dict(slide_data)
        data["_slide_index"] = index + 1
        layout = data["tipo_layout"]
        if layout == "conteudo_com_metrica":
            content_image_index += 1
            numbered_image = _asset(f"foto_conteudo_{content_image_index:02d}.png", assets_path)
            data["_imagem_arquivo"] = (numbered_image or _asset("foto_conteudo.png", assets_path))
        if layout == "divisor_secao":
            section_number += 1
            data["_secao"] = section_number
        renderer = LAYOUT_RENDERERS.get(layout)
        if renderer is None:
            raise ValueError(f"Não há renderizador PPTX para o layout '{layout}'.")
        slide = prs.slides.add_slide(blank_layout)
        renderer(slide, data, new_context())

    output = Path(caminho_saida).resolve()
    project_root = PROJECT_ROOT.resolve()
    if not output.is_relative_to(project_root):
        raise ValueError("O arquivo PPTX precisa ser salvo dentro da pasta IA.")
    output.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output))

    if warnings:
        limitations = presentation.setdefault("limitacoes", [])
        limitations.extend(w for w in warnings if w not in limitations)
    return output


def validate_pptx_file(path: str | Path, *, minimum_slides: int = 3) -> None:
    """Confirma que o PPTX salvo é válido, tem slides suficientes e nenhum elemento fora da área do slide."""
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
    width, height = rendered.slide_width, rendered.slide_height
    tolerance = Inches(0.02)
    for number, slide in enumerate(rendered.slides, start=1):
        for shape in slide.shapes:
            if shape.left is None or shape.top is None:
                continue
            if (shape.left < -tolerance or shape.top < -tolerance
                    or shape.left + shape.width > width + tolerance
                    or shape.top + shape.height > height + tolerance):
                raise ValueError(
                    f"Slide {number}: o elemento '{shape.name}' ultrapassa a área do slide."
                )
