/**
 * InstitutionalPresenterMode — Modo Apresentador Unificado
 *
 * Chrome escuro + slides IDH reais + slides especiais (Capa, Agenda, Agradecimento).
 * Tela cheia mostra apenas o slide ativo com setas flutuantes.
 * Suporta deletar / restaurar slides do deck IDH.
 * Navegação não-linear: clique em qualquer item do índice lateral para pular diretamente.
 * initialSlideId: abre o presenter já posicionado no slide clicado na página.
 */

import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiFlag,
  FiLayers,
  FiLink,
  FiMaximize,
  FiMenu,
  FiMinimize,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { PresentationSlide } from "../PresentationCards";
import type { PresentationCard, PresentationData } from "../../types/presentation";
import type {
  EventType,
  InstitutionalPresentation,
} from "../../types/institutionalPresentation";

// ─── Labels de evento ─────────────────────────────────────────────────────────

const EVENT_LABELS: Record<EventType, string> = {
  "congresso":         "Congresso",
  "visita-tecnica":    "Visita Técnica",
  "premiacao":         "Premiação",
  "reuniao-interna":   "Reunião Interna",
  "feira":             "Feira / Expo",
  "audiencia-publica": "Audiência Pública",
  "outro":             "Outro",
};

// ─── Tipos internos ───────────────────────────────────────────────────────────

type SpecialKind = "capa" | "agenda" | "agradecimento";

type PresenterSlide =
  | { kind: "card";    id: string; title: string; card: PresentationCard }
  | { kind: "special"; id: string; title: string; type: SpecialKind };

function buildSlides(cards: PresentationCard[]): PresenterSlide[] {
  return [
    { kind: "special", id: "__capa__",         title: "Capa",          type: "capa" },
    { kind: "special", id: "__agenda__",        title: "Agenda",        type: "agenda" },
    ...cards.map((c) => ({ kind: "card" as const, id: c.id, title: c.title, card: c })),
    { kind: "special", id: "__agradecimento__", title: "Agradecimento", type: "agradecimento" },
  ];
}

// ─── Slides especiais ─────────────────────────────────────────────────────────

function CapaSlide({ pres }: { pres: InstitutionalPresentation }) {
  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0f3460_0%,#1255a0_45%,#1675b8_100%)] px-10 py-16 text-center text-white">
      <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
        <FiFlag className="h-9 w-9 text-white/80" />
      </div>
      <p className="text-[0.78rem] font-bold uppercase tracking-[0.28em] text-white/50">
        Prefeitura Municipal de Barueri
      </p>
      <h1 className="mt-4 max-w-[680px] text-[2.4rem] font-extrabold leading-tight tracking-[-0.04em]">
        {pres.title}
      </h1>
      {pres.eventName && pres.eventName !== pres.title && (
        <p className="mt-2 text-[1.05rem] font-medium text-white/65">{pres.eventName}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-white/15 px-4 py-1.5 text-[0.84rem] font-semibold ring-1 ring-white/20">
          {EVENT_LABELS[pres.eventType] ?? pres.eventType}
        </span>
        {pres.mainFocus && (
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-[0.84rem] font-semibold ring-1 ring-white/20">
            {pres.mainFocus}
          </span>
        )}
        {pres.audience && (
          <span className="rounded-full bg-white/15 px-4 py-1.5 text-[0.84rem] font-semibold ring-1 ring-white/20">
            {pres.audience}
          </span>
        )}
      </div>
      <p className="mt-10 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/30">
        Secretaria de Inovação e Tecnologia — SIT
      </p>
    </div>
  );
}

function AgendaSlide({ pres, cards }: { pres: InstitutionalPresentation; cards: PresentationCard[] }) {
  return (
    <div className="flex min-h-[520px] w-full flex-col rounded-[20px] bg-white px-10 py-10">
      <div className="mb-8 border-b border-[#e2e8f0] pb-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#1675b8]">
          {pres.title}
        </p>
        <h2 className="mt-1.5 text-[2rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e]">
          Agenda
        </h2>
        <p className="mt-1 text-[0.95rem] text-[#6b7280]">
          Tópicos que serão apresentados
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card, i) => (
          <div
            key={card.id}
            className="flex items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[0.72rem] font-bold text-[#1675b8]">
              {i + 1}
            </span>
            <p className="text-[0.9rem] font-semibold leading-tight text-[#374151]">{card.title}</p>
          </div>
        ))}
      </div>
      {pres.purpose && (
        <div className="mt-6 rounded-[12px] bg-[#eff6ff] px-5 py-4">
          <p className="text-[0.82rem] font-semibold text-[#1d4ed8]">{pres.purpose}</p>
        </div>
      )}
    </div>
  );
}

function AgradecimentoSlide({ pres }: { pres: InstitutionalPresentation }) {
  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#0f3460_0%,#1255a0_45%,#1675b8_100%)] px-10 py-16 text-center text-white">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
        <FiFlag className="h-9 w-9 text-white/80" />
      </div>
      <h1 className="text-[3.2rem] font-extrabold tracking-[-0.05em]">Obrigado!</h1>
      <p className="mt-3 text-[1.05rem] font-medium text-white/65">
        {pres.eventName && pres.eventName !== pres.title ? pres.eventName : pres.title}
      </p>
      <div className="mt-8 h-px w-16 bg-white/20" />
      <p className="mt-6 text-[0.88rem] text-white/50">Dúvidas e perguntas</p>
      <p className="mt-2 text-[0.74rem] font-semibold uppercase tracking-[0.15em] text-white/30">
        sit.barueri.sp.gov.br
      </p>
    </div>
  );
}

// ─── QR Code decorativo ───────────────────────────────────────────────────────

function QrCodeSvg() {
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,0,1,1,0,0,1,0,1,1,0,0,1,0,1,0,1],
    [0,1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,0,1,0],
    [1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,0,1,1,0,1,1],
    [0,0,1,0,1,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0,0],
    [1,0,1,1,0,1,1,1,1,0,1,0,1,0,1,1,0,1,0,1,1],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,0,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,1,1,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,0,1,0,0,1,0],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,0,1,0,0,0,1,0,1,1,0,1],
  ];
  return (
    <svg viewBox="0 0 21 21" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="white" /> : null,
        ),
      )}
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type InstitutionalPresenterModeProps = {
  slides: PresentationCard[];
  data: PresentationData;
  presentation: InstitutionalPresentation;
  isOpen: boolean;
  onClose: () => void;
  /** ID do slide IDH a mostrar ao abrir — permite navegar direto do clique na página */
  initialSlideId?: string;
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onRestoreSlides?: () => void;
  hasHiddenSlides?: boolean;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function InstitutionalPresenterMode({
  slides,
  data,
  presentation,
  isOpen,
  onClose,
  initialSlideId,
  onDeleteSlide,
  onRestoreSlides,
  hasHiddenSlides = false,
}: InstitutionalPresenterModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [indexOpen,    setIndexOpen]    = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLink,     setShowLink]     = useState(false);
  const [linkCopied,   setLinkCopied]   = useState(false);
  const containerRef   = useRef<HTMLDivElement>(null);
  const sidebarItemRef = useRef<(HTMLButtonElement | null)[]>([]);

  const allSlides = buildSlides(slides);
  const total     = allSlides.length;
  const active    = allSlides[currentIndex] ?? null;
  const progress  = total > 1 ? currentIndex / (total - 1) : 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < total - 1;
  const link      = presentation.publicLink ?? "sit.barueri.sp.gov.br/apresentacao";

  // Ao abrir: navega para o slide pedido ou volta ao início
  useEffect(() => {
    if (!isOpen) return;
    if (initialSlideId) {
      const built = buildSlides(slides);
      const idx = built.findIndex((s) => s.id === initialSlideId);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSlideId]);

  // Scroll da sidebar para acompanhar o slide ativo
  useEffect(() => {
    sidebarItemRef.current[currentIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  // Clamp se slides IDH forem deletados
  useEffect(() => {
    if (currentIndex >= total && total > 0) setCurrentIndex(total - 1);
  }, [total, currentIndex]);

  // Teclado
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowRight": case "ArrowDown":
          e.preventDefault();
          setCurrentIndex((i) => Math.min(i + 1, total - 1));
          break;
        case "ArrowLeft": case "ArrowUp":
          e.preventDefault();
          setCurrentIndex((i) => Math.max(i - 1, 0));
          break;
        case "i": case "I": setIndexOpen((v) => !v); break;
        case "f": case "F": toggleFullscreen(); break;
        case "Escape":
          if (document.fullscreenElement) document.exitFullscreen?.();
          else if (showLink) setShowLink(false);
          else onClose();
          break;
        case "Home": setCurrentIndex(0); break;
        case "End":  setCurrentIndex(total - 1); break;
        case "Delete": case "Backspace":
          if (active?.kind === "card" && onDeleteSlide) {
            e.preventDefault();
            onDeleteSlide(active.card.id);
          }
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, total, showLink, active, onDeleteSlide, onClose]);

  // Detecta mudança de fullscreen
  useEffect(() => {
    function onChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {});
  }

  function handleDeleteActive() {
    if (active?.kind === "card" && onDeleteSlide) onDeleteSlide(active.card.id);
  }

  if (!isOpen) return null;

  // ── Slide ativo ──────────────────────────────────────────────────────────────

  function renderSlide() {
    if (!active) return null;
    if (active.kind === "special") {
      switch (active.type) {
        case "capa":          return <CapaSlide pres={presentation} />;
        case "agenda":        return <AgendaSlide pres={presentation} cards={slides} />;
        case "agradecimento": return <AgradecimentoSlide pres={presentation} />;
      }
    }
    return <PresentationSlide card={active.card} data={data} variant="stage" />;
  }

  // ── MODO TELA CHEIA — só o slide + setas flutuantes ─────────────────────────

  if (isFullscreen) {
    return (
      <div
        ref={containerRef}
        data-presenter-mode="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1117]"
      >
        <div className="w-full max-w-[1320px] px-4">
          {renderSlide()}
        </div>

        {/* Seta esquerda */}
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={!canGoPrev}
          aria-label="Slide anterior"
          className="fixed left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-20 sm:left-6 sm:h-14 sm:w-14"
        >
          <FiChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        {/* Seta direita */}
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.min(i + 1, total - 1))}
          disabled={!canGoNext}
          aria-label="Próximo slide"
          className="fixed right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-20 sm:right-6 sm:h-14 sm:w-14"
        >
          <FiChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        {/* Sair da tela cheia */}
        <button
          type="button"
          onClick={() => document.exitFullscreen?.()}
          aria-label="Sair da tela cheia"
          className="fixed right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-[0.84rem] font-semibold text-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition hover:bg-white"
        >
          <FiMinimize className="h-4 w-4" />
          Sair da tela cheia
        </button>

        {/* Contador */}
        <div className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-5 py-2 text-[0.78rem] font-semibold text-white/60 backdrop-blur-sm">
          {currentIndex + 1} / {total}{active?.title ? ` — ${active.title}` : ""}
        </div>
      </div>
    );
  }

  // ── MODO NORMAL — chrome escuro + sidebar + conteúdo ────────────────────────

  return (
    <div
      ref={containerRef}
      data-presenter-mode="true"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Apresentador"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0d1117] text-white"
    >
      {/* ── Top bar ── */}
      <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIndexOpen((v) => !v)}
            aria-label="Alternar índice"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <FiMenu className="h-4.5 w-4.5" />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1675b8]/30">
            <FiFlag className="h-4 w-4 text-[#7fb4db]" />
          </div>
          <span className="truncate text-[0.92rem] font-bold text-white/90">
            {presentation.title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mr-2 hidden text-[0.64rem] text-white/20 xl:block">
            ← → navegar · I índice · F tela cheia · Esc fechar
          </span>

          {hasHiddenSlides && onRestoreSlides && (
            <button
              type="button"
              onClick={onRestoreSlides}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8rem] font-semibold text-[#fbbf24]/80 transition hover:bg-white/10 hover:text-[#fbbf24]"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Restaurar slides</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLink((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8rem] font-semibold transition ${
              showLink ? "bg-[#7fb4db]/20 text-[#7fb4db]" : "text-white/45 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FiLink className="h-4 w-4" />
            <span className="hidden sm:block">Link</span>
          </button>

          {onDeleteSlide && active?.kind === "card" && (
            <button
              type="button"
              onClick={handleDeleteActive}
              aria-label="Remover slide atual"
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/30 transition hover:bg-red-500/20 hover:text-red-400"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Tela cheia"
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <FiMaximize className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <FiX className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* ── Link / QR Panel ── */}
      {showLink && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#161b22] px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#1675b8] p-2">
              <QrCodeSvg />
            </div>
            <div>
              <p className="text-[0.64rem] font-bold uppercase tracking-wide text-[#7fb4db]/60">
                Link público (modo leitura)
              </p>
              <p className="mt-0.5 font-mono text-[0.82rem] text-[#7fb4db]">{link}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 rounded-lg bg-[#7fb4db]/20 px-4 py-2 text-[0.8rem] font-semibold text-[#7fb4db] transition hover:bg-[#7fb4db]/30"
          >
            {linkCopied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
            {linkCopied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      )}

      {/* ── Corpo: sidebar + slide ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar (índice não-linear) ── */}
        <aside
          className="shrink-0 overflow-hidden border-r border-white/10 bg-[#0d1117] transition-[width] duration-200"
          style={{ width: indexOpen ? "260px" : "0px" }}
        >
          <div className="flex h-full flex-col py-3" style={{ width: "260px" }}>
            <div className="mb-3 flex items-center justify-between px-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white/30">
                Índice de Slides
              </p>
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[0.62rem] font-semibold text-white/25">
                {total}
              </span>
            </div>

            <nav
              className="flex-1 space-y-0.5 overflow-y-auto px-2"
              aria-label="Navegação não-linear"
            >
              {allSlides.map((slide, i) => {
                const isActive  = i === currentIndex;
                const isSpecial = slide.kind === "special";
                return (
                  <button
                    key={slide.id}
                    ref={(el) => { sidebarItemRef.current[i] = el; }}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-current={isActive ? "step" : undefined}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.93)" : "transparent",
                      color:      isActive ? "#0d1117" : "rgba(255,255,255,0.45)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold"
                      style={{
                        background: isActive  ? "#1675b8"
                                  : isSpecial ? "rgba(255,255,255,0.06)"
                                  :             "rgba(255,255,255,0.1)",
                        color:      isActive  ? "white"
                                  : isSpecial ? "rgba(255,255,255,0.3)"
                                  :             "rgba(255,255,255,0.35)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate text-[0.84rem] font-semibold leading-tight">{slide.title}</span>
                    {!isSpecial && onDeleteSlide && (
                      <button
                        type="button"
                        aria-label={`Remover ${slide.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlide((slide as Extract<PresenterSlide, { kind: "card" }>).card.id);
                        }}
                        className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                        style={{ color: isActive ? "#dc2626" : undefined }}
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                );
              })}
            </nav>

            {slides.length === 0 && hasHiddenSlides && onRestoreSlides && (
              <div className="px-3 pt-2">
                <button
                  type="button"
                  onClick={onRestoreSlides}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#fbbf24]/15 px-3 py-2.5 text-[0.8rem] font-semibold text-[#fbbf24] transition hover:bg-[#fbbf24]/25"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" /> Restaurar slides
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Área do slide ── */}
        <main className="flex flex-1 flex-col items-center overflow-y-auto bg-[#161b22] px-4 py-6 sm:px-8 sm:py-8">
          {slides.length === 0 && active?.kind === "special" && active.type === "agenda" ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <FiLayers className="h-10 w-10 text-white/15" />
              <div>
                <p className="text-[1rem] font-semibold text-white/40">
                  Todos os slides foram removidos
                </p>
                <p className="mt-1 text-[0.84rem] text-white/25">Restaure para voltar ao conteúdo</p>
              </div>
              {hasHiddenSlides && onRestoreSlides && (
                <button
                  type="button"
                  onClick={onRestoreSlides}
                  className="flex items-center gap-2 rounded-full bg-[#fbbf24]/20 px-5 py-2.5 text-[0.86rem] font-semibold text-[#fbbf24] transition hover:bg-[#fbbf24]/30"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" /> Restaurar slides
                </button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-[1040px] overflow-visible rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
              {renderSlide()}
            </div>
          )}
        </main>
      </div>

      {/* ── Rodapé de navegação ── */}
      <footer className="flex h-14 shrink-0 items-center gap-4 border-t border-white/10 px-5">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={!canGoPrev}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[0.86rem] font-semibold text-white/45 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20"
        >
          <FiChevronLeft className="h-4.5 w-4.5" />
          Anterior
        </button>

        <div className="flex-1 space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7fb4db] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-center text-[0.72rem] font-medium text-white/30">
            {currentIndex + 1} / {total}{active?.title ? ` — ${active.title}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.min(i + 1, total - 1))}
          disabled={!canGoNext}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-[0.86rem] font-semibold text-white/45 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20"
        >
          Próximo
          <FiChevronRight className="h-4.5 w-4.5" />
        </button>
      </footer>
    </div>
  );
}
