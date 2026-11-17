"""Gera gráficos matplotlib no estilo visual de Barueri para inserção nos slides PPTX."""

from __future__ import annotations

import io
import re

import matplotlib
matplotlib.use("Agg")  # backend sem janela — essencial em servidor
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch


# ── Paleta de cores (espelha pptx_style) ─────────────────────────────────────
_BLUE       = "#1675b8"
_DARK_BLUE  = "#0d5283"
_LIGHT_BLUE = "#eff6ff"
_LIGHT_GRAY = "#f8fafc"
_BORDER     = "#e2e8f0"
_TEXT       = "#1e1e1e"
_TEXT_MED   = "#6b7280"
_WHITE      = "#ffffff"

_FIG_W = 10.0   # polegadas (escala interna matplotlib)
_FIG_H = 8.5


def _parse_value(raw: str | int | float) -> float | None:
    """Converte '12.000', '40%', '1,5k' etc. para float, ou None se não numérico."""
    if isinstance(raw, (int, float)):
        return float(raw)
    s = str(raw).strip()
    s = re.sub(r"[%\s]", "", s)
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def generate_kpi_chart(kpis: list[dict]) -> io.BytesIO | None:
    """
    Recebe lista de KPIs no formato:
        [{"label": str, "valor": str|num, "unidade": str, "contexto": str}, ...]
    Retorna BytesIO com PNG do gráfico, ou None se não houver dados válidos.
    """
    if not kpis:
        return None

    # Filtra KPIs com valor numérico parseável
    items: list[tuple[str, float, str, str]] = []
    for k in kpis[:6]:
        val = _parse_value(k.get("valor", ""))
        if val is None:
            continue
        label   = str(k.get("label", "")).strip()
        unidade = str(k.get("unidade") or "").strip()
        ctx     = str(k.get("contexto") or "").strip()
        items.append((label, val, unidade, ctx))

    if not items:
        return None

    # ── Escolhe tipo de gráfico conforme quantidade de KPIs ──────────────────
    if len(items) == 1:
        return _single_kpi_card(items[0])
    return _horizontal_bar_chart(items)


# ── Gráfico de barra única (1 KPI) ───────────────────────────────────────────

def _single_kpi_card(item: tuple[str, float, str, str]) -> io.BytesIO:
    label, val, unidade, ctx = item
    fig, ax = plt.subplots(figsize=(_FIG_W, _FIG_H))
    fig.patch.set_facecolor(_LIGHT_GRAY)
    ax.set_facecolor(_LIGHT_GRAY)
    ax.axis("off")

    # Valor grande centralizado
    num_text = f"{val:,.0f}".replace(",", ".") if val >= 1000 else f"{val:g}"
    if unidade:
        num_text = f"{num_text} {unidade}"
    ax.text(0.5, 0.60, num_text, transform=ax.transAxes,
            ha="center", va="center", fontsize=72, fontweight="bold",
            color=_BLUE)
    ax.text(0.5, 0.35, label.upper(), transform=ax.transAxes,
            ha="center", va="center", fontsize=20, fontweight="bold",
            color=_TEXT_MED)
    if ctx:
        ax.text(0.5, 0.20, ctx, transform=ax.transAxes,
                ha="center", va="center", fontsize=14, color=_TEXT_MED)

    # Borda decorativa
    for spine in ax.spines.values():
        spine.set_visible(False)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=_LIGHT_GRAY)
    plt.close(fig)
    buf.seek(0)
    return buf


# ── Gráfico de barras horizontais (2–6 KPIs) ─────────────────────────────────

def _horizontal_bar_chart(items: list[tuple[str, float, str, str]]) -> io.BytesIO:
    n = len(items)
    fig_h = max(5.0, 2.0 + n * 1.1)
    fig, ax = plt.subplots(figsize=(_FIG_W, fig_h))
    fig.patch.set_facecolor(_LIGHT_GRAY)
    ax.set_facecolor(_LIGHT_GRAY)

    labels  = [t[0] for t in items]
    values  = [t[1] for t in items]
    units   = [t[2] for t in items]

    max_val = max(values) if max(values) != 0 else 1
    y_pos   = list(range(n - 1, -1, -1))  # inverte para leitura de cima para baixo
    bar_h   = 0.55

    bars = ax.barh(y_pos, values, height=bar_h, color=_BLUE,
                   zorder=2, edgecolor="none")

    # Fundo cinza claro para cada barra (trilha)
    for y in y_pos:
        ax.barh(y, max_val, height=bar_h, color=_BORDER,
                zorder=1, edgecolor="none")

    # Re-desenha barras sobre a trilha
    ax.barh(y_pos, values, height=bar_h, color=_BLUE, zorder=2, edgecolor="none")

    # Rótulos à esquerda (labels)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=13, fontweight="bold", color=_TEXT)

    # Valores à direita das barras
    for bar, val, unit in zip(bars, values, units):
        num_str = f"{val:,.0f}".replace(",", ".") if val >= 1000 else f"{val:g}"
        label_str = f"{num_str} {unit}".strip()
        ax.text(bar.get_width() + max_val * 0.015,
                bar.get_y() + bar.get_height() / 2,
                label_str, va="center", ha="left",
                fontsize=13, fontweight="bold", color=_BLUE)

    ax.set_xlim(0, max_val * 1.25)
    ax.xaxis.set_visible(False)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_visible(False)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False)

    # Título discreto
    ax.set_title("INDICADORES", fontsize=11, fontweight="bold",
                 color=_TEXT_MED, loc="left", pad=10)

    # Linha decorativa no topo
    fig.add_artist(
        mpatches.FancyArrowPatch(
            (0.04, 0.97), (0.96, 0.97), transform=fig.transFigure,
            arrowstyle="-", color=_BLUE, linewidth=2,
        )
    )

    fig.tight_layout(pad=1.2)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=_LIGHT_GRAY)
    plt.close(fig)
    buf.seek(0)
    return buf
