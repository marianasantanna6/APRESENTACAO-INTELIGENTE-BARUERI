"""Gera gráficos matplotlib no estilo visual SIT Barueri para inserção nos slides PPTX.

O gráfico é desenhado exatamente no tamanho (em polegadas) do quadro que vai ocupar no
slide, sem ``bbox_inches="tight"``: assim a proporção do PNG coincide com a do quadro e a
imagem nunca é esticada ou achatada pelo gerador de PPTX.
"""

from __future__ import annotations

import io
import re
import textwrap

import matplotlib
matplotlib.use("Agg")  # backend sem janela — essencial em servidor
import matplotlib.pyplot as plt


# ── Paletas (espelham services/pptx_generator.py) ────────────────────────────
_THEMES = {
    "dark": {
        "bg": "#161447",
        "track": "#24216A",
        "text": "#FFFFFF",
        "muted": "#AEB4CC",
        "accents": ["#2BC4B4", "#F5C518", "#F7943B", "#5B8DEF", "#A57CFF", "#E86A6A"],
    },
    "light": {
        "bg": "#F4F6FA",
        "track": "#E2E8F0",
        "text": "#14162B",
        "muted": "#5B6070",
        "accents": ["#1460A8", "#00A99D", "#F7943B", "#8064A2", "#C0504D", "#4BACC6"],
    },
}

_MAX_LABEL_LINES = 2
_DPI = 200


def _parse_value(raw: str | int | float) -> float | None:
    """Converte valores de KPI para float.

    Aceita formatos brasileiros e prefixos/sufixos comuns: ``"12.000"`` → 12000,
    ``"1,5"`` → 1.5, ``"R$ 23,9"`` → 23.9, ``"+3.473"`` → 3473, ``"40%"`` → 40,
    ``"1.5"`` → 1.5 (ponto seguido de menos de 3 dígitos é decimal).
    Retorna ``None`` quando não há número reconhecível.
    """
    if isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    match = re.search(r"-?\d[\d.,]*", str(raw))
    if not match:
        return None
    token = match.group(0).rstrip(".,")
    if "," in token and "." in token:
        token = token.replace(".", "").replace(",", ".")
    elif "," in token:
        token = token.replace(".", "").replace(",", ".")
    elif "." in token:
        groups = token.split(".")
        if all(len(group) == 3 for group in groups[1:]):
            token = token.replace(".", "")  # separador de milhar
    try:
        return float(token)
    except ValueError:
        return None


def _format_number(val: float) -> str:
    if abs(val) >= 1000:
        return f"{val:,.0f}".replace(",", ".")
    if val.is_integer():
        return f"{val:.0f}"
    return f"{val:.1f}".replace(".", ",")


def _wrap_label(label: str, width_chars: int) -> str:
    lines = textwrap.wrap(label, width=max(6, width_chars), break_long_words=True) or [""]
    if len(lines) > _MAX_LABEL_LINES:
        lines = lines[:_MAX_LABEL_LINES]
        lines[-1] = lines[-1][: max(1, width_chars - 1)].rstrip() + "…"
    return "\n".join(lines)


def _kpi_items(kpis: list[dict]) -> list[tuple[str, float, str, str]]:
    items: list[tuple[str, float, str, str]] = []
    for k in kpis[:6]:
        val = _parse_value(k.get("valor", ""))
        if val is None:
            continue
        items.append((
            str(k.get("label", "")).strip(),
            val,
            str(k.get("unidade") or "").strip(),
            str(k.get("contexto") or "").strip(),
        ))
    return items


def chartable_kpis(kpis: list[dict]) -> bool:
    """Indica se os KPIs podem virar um gráfico de barras honesto.

    Exige ao menos 2 valores numéricos com a mesma unidade — comparar barras de
    unidades diferentes (ex.: % contra km) produziria uma escala enganosa.
    """
    items = _kpi_items(kpis or [])
    if len(items) < 2:
        return False
    units = {unit.casefold() for _, _, unit, _ in items}
    return len(units) == 1 and all(val >= 0 for _, val, _, _ in items)


def generate_kpi_chart(
    kpis: list[dict],
    *,
    width_in: float = 6.0,
    height_in: float = 4.5,
    theme: str = "dark",
    allow_single: bool = False,
) -> io.BytesIO | None:
    """
    Recebe KPIs no formato ``[{"label", "valor", "unidade", "contexto"}, ...]`` e retorna
    um PNG com exatamente ``width_in`` × ``height_in`` polegadas, ou ``None`` quando os
    dados não sustentam um gráfico (menos de 2 valores ou unidades diferentes).
    """
    if not kpis or width_in <= 0 or height_in <= 0:
        return None
    palette = _THEMES.get(theme, _THEMES["dark"])
    items = _kpi_items(kpis)
    if len(items) == 1 and allow_single:
        return _single_kpi_card(items[0], width_in, height_in, palette)
    if not chartable_kpis(kpis):
        return None
    return _horizontal_bar_chart(items, width_in, height_in, palette)


# ── Cartão de valor único (opcional) ─────────────────────────────────────────

def _single_kpi_card(item, width_in: float, height_in: float, palette: dict) -> io.BytesIO:
    label, val, unidade, ctx = item
    fig = plt.figure(figsize=(width_in, height_in), dpi=_DPI)
    fig.patch.set_facecolor(palette["bg"])
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(palette["bg"])
    ax.axis("off")
    num_text = f"{_format_number(val)} {unidade}".strip()
    big = min(72, height_in * 14, width_in * 110 / max(4, len(num_text)))
    ax.text(0.5, 0.60, num_text, ha="center", va="center", fontsize=big,
            fontweight="bold", color=palette["accents"][0])
    ax.text(0.5, 0.34, _wrap_label(label.upper(), int(width_in * 9)), ha="center", va="center",
            fontsize=max(9, big * 0.28), fontweight="bold", color=palette["text"])
    if ctx:
        ax.text(0.5, 0.18, _wrap_label(ctx, int(width_in * 11)), ha="center", va="center",
                fontsize=max(8, big * 0.2), color=palette["muted"])
    return _to_png(fig, palette)


# ── Barras horizontais (2–6 KPIs, mesma unidade) ─────────────────────────────

def _horizontal_bar_chart(items, width_in: float, height_in: float, palette: dict) -> io.BytesIO:
    n = len(items)
    fig = plt.figure(figsize=(width_in, height_in), dpi=_DPI)
    fig.patch.set_facecolor(palette["bg"])

    # Tipografia proporcional ao quadro: nunca ilegível, nunca maior que o espaço por barra.
    row_h_pt = (height_in * 0.78 / n) * 72
    font_size = max(8.0, min(13.0, row_h_pt * 0.28, width_in * 2.0))
    values = [t[1] for t in items]
    unit = items[0][2]
    renderer = fig.canvas.get_renderer()

    def text_width_in(text: str) -> float:
        probe = fig.text(0, 0, text, fontsize=font_size, fontweight="bold")
        width = probe.get_window_extent(renderer=renderer).width / _DPI
        probe.remove()
        return width

    # Rótulos (legendas das barras) quebrados até caberem em no máximo 40% da largura.
    max_label_w = width_in * 0.40
    label_chars = max(10, int(max_label_w * 72 / (font_size * 0.58)))
    while True:
        labels = [_wrap_label(t[0], label_chars) for t in items]
        label_w = max(text_width_in(line) for label in labels for line in label.split("\n"))
        if label_w <= max_label_w or label_chars <= 8:
            break
        label_chars -= 2
    left = min(0.47, max(0.16, (label_w + 0.2) / width_in))

    title_h = (font_size * 1.9) / 72 / height_in
    ax = fig.add_axes([left, 0.06, 0.97 - left, 0.94 - 0.06 - title_h])
    ax.set_facecolor(palette["bg"])

    max_val = max(values) or 1.0
    y_pos = list(range(n - 1, -1, -1))
    bar_h = 0.56
    ax.barh(y_pos, [max_val] * n, height=bar_h, color=palette["track"], zorder=1, edgecolor="none")
    colors = [palette["accents"][i % len(palette["accents"])] for i in range(n)]
    bars = ax.barh(y_pos, values, height=bar_h, color=colors, zorder=2, edgecolor="none")

    # Espaço à direita para o rótulo de valor mais longo: a barra máxima termina antes dele.
    value_w = max(text_width_in(f"{_format_number(v)} {unit}".strip()) for v in values)
    axis_w = width_in * (0.97 - left)
    gap_w = 0.1
    usable = max(axis_w * 0.35, axis_w - value_w - gap_w)
    ax.set_xlim(0, max_val * axis_w / usable)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=font_size, fontweight="bold", color=palette["text"])
    for bar, val in zip(bars, values):
        ax.text(bar.get_width() + max_val * (gap_w / usable) * 0.8, bar.get_y() + bar.get_height() / 2,
                f"{_format_number(val)} {unit}".strip(), va="center", ha="left",
                fontsize=font_size, fontweight="bold", color=palette["text"], zorder=3)
    ax.set_ylim(-0.6, n - 0.4)
    ax.xaxis.set_visible(False)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(left=False, pad=6)

    title = "INDICADORES" + (f" ({unit})" if unit else "")
    fig.text(left, 0.97, title, fontsize=font_size * 0.85, fontweight="bold",
             color=palette["muted"], va="top", ha="left")
    return _to_png(fig, palette)


def _to_png(fig, palette: dict) -> io.BytesIO:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=_DPI, facecolor=palette["bg"])
    plt.close(fig)
    buf.seek(0)
    return buf
