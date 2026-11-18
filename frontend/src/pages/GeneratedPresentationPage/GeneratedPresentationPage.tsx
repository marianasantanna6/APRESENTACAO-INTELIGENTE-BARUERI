import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiEdit2,
  FiCalendar,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGlobe,
  FiImage,
  FiLayers,
  FiLoader,
  FiMaximize,
  FiSave,
  FiTag,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { useAuth } from "../../context";
import { authFetch } from "../../lib/apiClient";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { formatShortDate } from "../../lib/formatters";
import { ROUTE_PATHS } from "../../router/paths";
import type {
  EventType,
  InstitutionalPresentation,
  PresentationLanguage,
  PresentationStatus,
} from "../../types/institutionalPresentation";

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresentationStatus, { label: string; cls: string }> = {
  draft:  { label: "Pendente",  cls: "bg-[#fef9c3] text-[#92400e]" },
  active: { label: "Aprovado",  cls: "bg-[#dcfce7] text-[#166534]" },
};

const EVENT_LABELS: Record<EventType, string> = {
  "congresso":         "Congresso",
  "visita-tecnica":    "Visita Técnica",
  "premiacao":         "Premiação",
  "reuniao-interna":   "Reunião Interna",
  "feira":             "Feira / Expo",
  "audiencia-publica": "Audiência Pública",
  "outro":             "Outro",
};

const LANGUAGE_LABELS: Record<PresentationLanguage, string> = {
  "pt-BR": "Português (BR)",
  "en-US": "English (US)",
  "es":    "Español",
};

// ─── Tipos de slides da IA ────────────────────────────────────────────────────

type IaKpi = { label: string; valor: string; unidade?: string; contexto?: string };
type IaFonteRef = string; // ID que referencia o catálogo top-level
type IaFonteCatalog = { id: string; titulo?: string; url?: string; fonte?: string; autor_ou_instituicao?: string };
type IaBloco = { titulo?: string; conteudo?: string };
type IaCitacao = { texto?: string; autor?: string; cargo?: string; instituicao?: string };
type IaReconhecimento = { nome?: string; cargo?: string; mensagem?: string };

export type IaSlide = {
  tipo_layout: string;
  titulo?: string;
  subtitulo?: string;
  texto_apoio?: string;
  pontos?: string[];
  kpis?: IaKpi[];
  fontes?: IaFonteRef[];
  imagem_descricao?: string;
  tags?: string[];
  blocos?: IaBloco[];
  citacao?: IaCitacao;
  reconhecimentos?: IaReconhecimento[];
};

// ─── Renderizador de slide individual ────────────────────────────────────────

const LAYOUT_LABELS: Record<string, string> = {
  capa:                "Capa",
  encerramento:        "Encerramento",
  titulo_conteudo:     "Título + Conteúdo",
  destaque_citacao:    "Destaque / Citação",
  conteudo_com_metrica:"Conteúdo + Métrica",
  divisor_secao:       "Divisor de Seção",
  nuvem_de_tags:       "Nuvem de Tags",
  reconhecimento:      "Reconhecimento",
};

function IaSlideCard({ slide, index, fonteCatalog = [] }: { slide: IaSlide; index: number; fonteCatalog?: IaFonteCatalog[] }) {
  const label = LAYOUT_LABELS[slide.tipo_layout] ?? slide.tipo_layout;
  const isCapa = slide.tipo_layout === "capa";
  const isEnc  = slide.tipo_layout === "encerramento";
  const isDiv  = slide.tipo_layout === "divisor_secao";

  return (
    <div className={`relative flex flex-col h-full min-h-[340px] rounded-[20px] border-2 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${
      isCapa ? "border-[#1675b8] bg-[linear-gradient(135deg,#1675b8_0%,#0d5283_100%)] text-white"
      : isEnc ? "border-[#16a34a] bg-[linear-gradient(135deg,#16a34a,#166534)] text-white"
      : isDiv ? "border-[#e2e8f0] bg-[#f8fafc]"
      : "border-[#e2e8f0] bg-white"
    }`}>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-widest mb-3 ${
        isCapa || isEnc ? "bg-white/20 text-white" : "bg-[#eff6ff] text-[#1675b8]"
      }`}>
        {index + 1} · {label}
      </span>

      {slide.titulo && (
        <h3 className={`text-[1.1rem] font-extrabold leading-tight mb-1 ${isCapa || isEnc ? "text-white" : "text-[#1e1e1e]"}`}>
          {slide.titulo}
        </h3>
      )}
      {slide.subtitulo && (
        <p className={`text-[0.88rem] mb-3 ${isCapa || isEnc ? "text-white/80" : "text-[#6b7280]"}`}>
          {slide.subtitulo}
        </p>
      )}
      {slide.texto_apoio && (
        <p className={`text-[0.84rem] leading-relaxed mb-3 ${isCapa || isEnc ? "text-white/90" : "text-[#374151]"}`}>
          {slide.texto_apoio}
        </p>
      )}

      {slide.imagem_descricao && (
        <div className={`mb-3 flex items-center gap-2.5 rounded-[12px] border-2 border-dashed py-5 px-4 ${isCapa || isEnc ? "border-white/30" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
          <FiImage className={`h-5 w-5 shrink-0 ${isCapa || isEnc ? "text-white/50" : "text-[#9ca3af]"}`} />
          <p className={`text-[0.78rem] italic ${isCapa || isEnc ? "text-white/60" : "text-[#9ca3af]"}`}>{slide.imagem_descricao}</p>
        </div>
      )}

      {slide.pontos && slide.pontos.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {slide.pontos.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[0.84rem] text-[#374151]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1675b8]" />
              {p}
            </li>
          ))}
        </ul>
      )}

      {slide.kpis && slide.kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-3">
          {slide.kpis.map((k, i) => (
            <div key={i} className="rounded-[14px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2.5">
              <p className="text-[1.2rem] font-extrabold text-[#1675b8]">{k.valor}{k.unidade ? <span className="text-[0.8rem] font-semibold ml-0.5">{k.unidade}</span> : null}</p>
              <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#6b7280]">{k.label}</p>
              {k.contexto && <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">{k.contexto}</p>}
            </div>
          ))}
        </div>
      )}

      {slide.blocos && slide.blocos.length > 0 && (
        <div className="space-y-2 mb-3">
          {slide.blocos.map((b, i) => (
            <div key={i} className="rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
              {b.titulo && <p className="text-[0.8rem] font-bold text-[#374151] mb-0.5">{b.titulo}</p>}
              {b.conteudo && <p className="text-[0.82rem] text-[#6b7280]">{b.conteudo}</p>}
            </div>
          ))}
        </div>
      )}

      {slide.citacao?.texto && (
        <blockquote className="border-l-4 border-[#1675b8] pl-4 mb-3">
          <p className="text-[0.9rem] italic text-[#374151]">"{slide.citacao.texto}"</p>
          {(slide.citacao.autor || slide.citacao.cargo) && (
            <p className="mt-1 text-[0.75rem] font-semibold text-[#9ca3af]">
              — {[slide.citacao.autor, slide.citacao.cargo, slide.citacao.instituicao].filter(Boolean).join(", ")}
            </p>
          )}
        </blockquote>
      )}

      {slide.tags && slide.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {slide.tags.map((t, i) => (
            <span key={i} className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.74rem] font-semibold text-[#475569]">
              #{t}
            </span>
          ))}
        </div>
      )}

      {slide.reconhecimentos && slide.reconhecimentos.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {slide.reconhecimentos.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <FiUser className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
              <p className="text-[0.82rem] text-[#374151]">
                <span className="font-semibold">{r.nome}</span>
                {r.cargo ? ` · ${r.cargo}` : ""}
                {r.mensagem ? <span className="ml-1 text-[#6b7280]">— {r.mensagem}</span> : null}
              </p>
            </div>
          ))}
        </div>
      )}

      {(() => {
        const fonteRefs = (slide.fontes ?? [])
          .map(id => fonteCatalog.find(c => c.id === id))
          .filter((f): f is IaFonteCatalog => !!f?.url); // só fontes externas com URL
        if (!fonteRefs.length) return null;
        return (
          <div className={`mt-auto pt-3 border-t ${isCapa || isEnc ? "border-white/20" : "border-[#f1f5f9]"}`}>
            <p className={`text-[0.62rem] font-bold uppercase tracking-widest mb-1 ${isCapa || isEnc ? "text-white/40" : "text-[#9ca3af]"}`}>Fontes</p>
            <div className="space-y-0.5">
              {fonteRefs.map((f, i) => (
                <p key={i} className={`text-[0.69rem] leading-snug ${isCapa || isEnc ? "text-white/50" : "text-[#9ca3af]"}`}>
                  [{i + 1}] {f.titulo ?? f.id}
                  {f.fonte ? <span className="opacity-70"> · {f.fonte}</span> : null}
                  {" — "}
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className={`hover:underline break-all ${isCapa || isEnc ? "text-white/70" : "text-[#1675b8]"}`}>{f.url}</a>
                </p>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Modo Apresentação IA ─────────────────────────────────────────────────────

function IaPresenterOverlay({
  slides,
  enabled,
  initialIndex,
  onClose,
  fonteCatalog = [],
}: {
  slides: IaSlide[];
  enabled: Record<number, boolean>;
  initialIndex: number;
  onClose: () => void;
  fonteCatalog?: IaFonteCatalog[];
}) {
  const activeSlides = slides
    .map((s, i) => ({ slide: s, origIndex: i }))
    .filter(({ origIndex }) => enabled[origIndex] !== false);

  const [curr, setCurr] = useState(() => {
    const idx = activeSlides.findIndex(({ origIndex }) => origIndex === initialIndex);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) void document.exitFullscreen?.(); };
  }, []);

  const slide = activeSlides[curr];
  if (!slide) return null;

  const canPrev = curr > 0;
  const canNext = curr < activeSlides.length - 1;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") canNext && setCurr(c => c + 1);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   canPrev && setCurr(c => c - 1);
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={0}
      onKeyDown={handleKey}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a1628] text-white outline-none"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/30">
        <span className="text-[0.8rem] font-bold uppercase tracking-widest text-white/60">
          {curr + 1} / {activeSlides.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fechar modo apresentação"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Conteúdo do slide */}
      <div className="flex flex-1 items-center justify-center px-8 py-6 overflow-auto">
        <div className="w-full max-w-4xl">
          <IaSlideCard slide={slide.slide} index={slide.origIndex} fonteCatalog={fonteCatalog} />
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-center gap-6 px-6 py-4 bg-black/30">
        <button
          type="button"
          onClick={() => setCurr(c => c - 1)}
          disabled={!canPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurr(i)}
              className={`h-2 rounded-full transition-all ${
                i === curr ? "w-6 bg-white" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCurr(c => c + 1)}
          disabled={!canNext}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
        >
          <FiArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Modo Apresentação com as imagens do PPTX ─────────────────────────────────
// Exibe exatamente os slides do arquivo gerado pela IA (convertidos em imagem no
// servidor), em vez de remontá-los em React a partir do JSON.

function IaImagePresenterOverlay({
  images,
  enabled,
  initialIndex,
  onClose,
}: {
  images: string[];
  enabled: Record<number, boolean>;
  initialIndex: number;
  onClose: () => void;
}) {
  const activeSlides = images
    .map((src, i) => ({ src, origIndex: i }))
    .filter(({ origIndex }) => enabled[origIndex] !== false);

  const [curr, setCurr] = useState(() => {
    const idx = activeSlides.findIndex(({ origIndex }) => origIndex === initialIndex);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) void document.exitFullscreen?.(); };
  }, []);

  // Pré-carrega os slides vizinhos para a troca ser instantânea.
  useEffect(() => {
    [curr - 1, curr + 1].forEach((i) => {
      const neighbor = activeSlides[i];
      if (neighbor) {
        const img = new Image();
        img.src = neighbor.src;
      }
    });
  }, [curr, activeSlides]);

  const total = activeSlides.length;

  // Teclado na janela inteira: o autoFocus do React não foca <div>, então um onKeyDown
  // no diálogo nunca receberia as setas.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        setCurr(c => Math.min(c + 1, total - 1));
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        setCurr(c => Math.max(c - 1, 0));
      } else if (e.key === "Home") {
        setCurr(0);
      } else if (e.key === "End") {
        setCurr(total - 1);
      } else if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total, onClose]);

  const slide = activeSlides[curr];
  if (!slide) return null;

  const canPrev = curr > 0;
  const canNext = curr < total - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo apresentação"
      // Acima do seletor de idioma flutuante (#gt-wrapper, z-index 9999).
      className="fixed inset-0 z-[10000] flex flex-col bg-black text-white outline-none"
    >
      <div className="flex items-center justify-between px-6 py-2.5 bg-white/5">
        <span className="text-[0.8rem] font-bold uppercase tracking-widest text-white/60">
          {curr + 1} / {activeSlides.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Fechar modo apresentação"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
        <img
          key={slide.src}
          src={slide.src}
          alt={`Slide ${slide.origIndex + 1}`}
          onClick={() => canNext && setCurr(c => c + 1)}
          className="aspect-video h-auto max-h-full w-auto max-w-full cursor-pointer select-none object-contain shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          draggable={false}
        />
      </div>

      <div className="flex items-center justify-center gap-6 px-6 py-3 bg-white/5">
        <button
          type="button"
          onClick={() => setCurr(c => c - 1)}
          disabled={!canPrev}
          aria-label="Slide anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          {activeSlides.map((s, i) => (
            <button
              key={s.origIndex}
              type="button"
              aria-label={`Ir para o slide ${i + 1}`}
              onClick={() => setCurr(i)}
              className={`h-2 rounded-full transition-all ${
                i === curr ? "w-6 bg-white" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCurr(c => c + 1)}
          disabled={!canNext}
          aria-label="Próximo slide"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30"
        >
          <FiArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { message: string };

function FeedbackToast({ message }: ToastState) {
  return (
    <div
      data-toast-surface="info"
      className="fixed left-4 right-4 top-4 z-[70] flex max-w-[360px] items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_40px_rgba(20,33,51,0.18)] backdrop-blur-[6px] sm:left-auto sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <FiFileText className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-[0.9rem] font-semibold leading-6">{message}</p>
    </div>
  );
}

// ─── Cabeçalho institucional ──────────────────────────────────────────────────

function InstitutionalHeader({
  presentation: p,
  onBack,
  onToast,
  onOpenPresenterMode,
  onDownloadPptx,
  onExportPdf,
  onNewVersion,
  onApprove,
  onReject,
  backLabel,
}: {
  presentation: InstitutionalPresentation;
  onBack: () => void;
  backLabel?: string;
  onToast: (msg: string) => void;
  onOpenPresenterMode: () => void;
  onDownloadPptx?: () => void;
  onExportPdf?: () => void;
  onNewVersion?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
  const eventLabel = EVENT_LABELS[p.eventType] ?? p.eventType;
  const languageLabel = LANGUAGE_LABELS[p.language] ?? p.language;

  return (
    <>
      {/* Breadcrumb + ações */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-[#6b7280] transition hover:text-[#1675b8]"
        >
          <FiArrowLeft className="h-4 w-4" />
          {backLabel ?? "Minhas Apresentações"}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {onApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a] px-4 py-2 text-[0.86rem] font-bold text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)] transition hover:bg-[#15803d]"
            >
              <FiCheck className="h-3.5 w-3.5" />
              Aprovar
            </button>
          )}
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#fecaca] bg-[#fef2f2] px-4 py-2 text-[0.86rem] font-semibold text-[#dc2626] transition hover:bg-[#fee2e2]"
            >
              <FiX className="h-3.5 w-3.5" />
              Rejeitar
            </button>
          )}
          {onDownloadPptx && (
            <button
              type="button"
              onClick={onDownloadPptx}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-[0.86rem] font-semibold text-[#166534] transition hover:bg-[#dcfce7]"
            >
              <FiSave className="h-3.5 w-3.5" />
              Baixar PPTX
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[0.86rem] font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
            >
              <FiFileText className="h-3.5 w-3.5" />
              Exportar PDF
            </button>
          )}
          {onNewVersion && (
            <button
              type="button"
              onClick={onNewVersion}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-4 py-2 text-[0.86rem] font-semibold text-[#4338ca] transition hover:bg-[#e0e7ff]"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
              Nova versão
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPresenterMode}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1675b8] px-4 py-2 text-[0.86rem] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(22,117,184,0.5)] transition hover:-translate-y-0.5"
          >
            <FiMaximize className="h-3.5 w-3.5" />
            Modo Apresentador
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="mb-10 rounded-[28px] border border-[#e2e8f0] bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.76rem] font-bold ${status.cls}`}>
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-3 py-1 text-[0.76rem] font-semibold text-[#475569]">
            <FiTag className="h-3 w-3" />
            {eventLabel}
          </span>
          {p.mainFocus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-3 py-1 text-[0.76rem] font-semibold text-[#166534]">
              <FiZap className="h-3 w-3" />
              {p.mainFocus}
            </span>
          )}
        </div>

        <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.4rem]">
          {p.title}
        </h1>
        {p.eventName && p.eventName !== p.title && (
          <p className="mt-1 text-[1rem] text-[#6b7280]">{p.eventName}</p>
        )}

        <div className="mt-5 flex flex-wrap gap-5 border-t border-[#f1f5f9] pt-5">
          {p.audience && (
            <MetaChip icon={<FiUser className="h-3.5 w-3.5" />} label="Público" value={p.audience} />
          )}
          <MetaChip icon={<FiGlobe className="h-3.5 w-3.5" />} label="Idioma" value={languageLabel} />
          <MetaChip icon={<FiCalendar className="h-3.5 w-3.5" />} label="Atualizado" value={formatShortDate(p.updatedAt)} />
          <MetaChip icon={<FiCheck className="h-3.5 w-3.5" />} label="Versão" value={`v${p.version}`} />
        </div>
      </div>

    </>
  );
}

function MetaChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#9ca3af]">{icon}</span>
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#9ca3af]">{label}</p>
        <p className="text-[0.84rem] font-semibold text-[#374151]">{value}</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GeneratedPresentationPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canCreate = canCreatePresentations(user);
  const presentationsRoute = getPresentationsRouteForUser(user);
  const [searchParams] = useSearchParams();

  // ── Apresentação institucional (quando vem do wizard com ?pid) ──
  const presentationId = searchParams.get("pid");
  const returnTo = searchParams.get("returnTo");

  // Fontes reais consultadas pela IA nesta geração
  const [iaSources, setIaSources] = useState<
    Array<{ fonte: string; status: string; resultados: number; mensagem?: string }> | null
  >(null);
  useEffect(() => {
    try {
      const iaId = sessionStorage.getItem("ia_last_presentation_id");
      if (!iaId) return;
      const raw = sessionStorage.getItem(`ia_sources_${iaId}`);
      if (raw) setIaSources(JSON.parse(raw));
    } catch {}
  }, []);

  const [institutionalPresentation, setInstitutionalPresentation] =
    useState<InstitutionalPresentation | null>(null);
  const [institutionalLoading, setInstitutionalLoading] = useState(!!presentationId);

  // ── Slides da IA ──
  const [iaSlides, setIaSlides] = useState<IaSlide[] | null>(null);
  const [iaFonteCatalog, setIaFonteCatalog] = useState<IaFonteCatalog[]>([]);
  const [iaSlideEnabled, setIaSlideEnabled] = useState<Record<number, boolean>>({});
  const [iaPresenterOpen, setIaPresenterOpen] = useState(false);
  const [iaPresenterIndex, setIaPresenterIndex] = useState(0);
  // Imagens dos slides do próprio PPTX (vazio em projetos antigos → usa os cards em React).
  const [iaSlideImages, setIaSlideImages] = useState<string[]>([]);
  const [iaImageEnabled, setIaImageEnabled] = useState<Record<number, boolean>>({});
  const [iaPdfUrl, setIaPdfUrl] = useState<string | null>(null);
  const hasSlideImages = iaSlideImages.length > 0;

  useEffect(() => {
    if (!presentationId) return;
    setInstitutionalLoading(true);

    authFetch(`/api/projects?id=${encodeURIComponent(presentationId)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const list = await res.json() as Array<{
          id: string; name: string; user: string; version: string; family: string; team: string;
          status: number; short_description?: string | null;
          audience?: string | null; areas: string[];
          last_update: string;
          slides_json?: {
            titulo?: string;
            slides?: IaSlide[];
            fontes?: IaFonteCatalog[];
            imagens_slides?: string[];
            pdf_url?: string | null;
          } | null;
        }>;
        const project = list[0];
        if (!project) return;
        setProjectFamily(project.family);
        setProjectTeam(project.team);
        setProjectRawStatus(project.status);
        const pres: InstitutionalPresentation = {
          id: project.id,
          title: project.name,
          eventName: "",
          eventType: "outro",
          purpose: project.short_description ?? "",
          audience: project.audience ?? "",
          mainFocus: project.areas[0] ?? "",
          secondaryFocuses: project.areas.slice(1),
          selectedProjects: [],
          moduleConfigs: [],
          language: "pt-BR",
          status: project.status === 2 ? "active" : "draft",
          createdBy: project.user,
          createdAt: project.last_update,
          updatedAt: project.last_update,
          version: parseInt(project.version, 10),
        };
        setInstitutionalPresentation(pres);

        const rawSlides = project.slides_json?.slides;
        const rawFontes = project.slides_json?.fontes;
        const rawImages = project.slides_json?.imagens_slides;
        if (Array.isArray(rawFontes)) setIaFonteCatalog(rawFontes);
        if (Array.isArray(rawImages) && rawImages.every((src) => typeof src === "string")) {
          setIaSlideImages(rawImages);
          const initialImages: Record<number, boolean> = {};
          rawImages.forEach((_, i) => { initialImages[i] = true; });
          setIaImageEnabled(initialImages);
        }
        setIaPdfUrl(
          typeof project.slides_json?.pdf_url === "string" ? project.slides_json.pdf_url : null,
        );
        if (Array.isArray(rawSlides) && rawSlides.length > 0) {
          setIaSlides(rawSlides);
          const initial: Record<number, boolean> = {};
          rawSlides.forEach((_, i) => { initial[i] = true; });
          setIaSlideEnabled(initial);
        }
      })
      .finally(() => setInstitutionalLoading(false));
  }, [presentationId]);

  const [toast, setToast] = useState<ToastState | null>(null);
  const [projectFamily, setProjectFamily] = useState<string | null>(null);
  const [projectTeam, setProjectTeam] = useState<string | null>(null);
  const [projectRawStatus, setProjectRawStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  async function handleDownloadPptx() {
    if (!presentationId) return;
    try {
      const res = await authFetch(`/api/projects/${encodeURIComponent(presentationId)}/pptx`);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${institutionalPresentation?.title ?? "apresentacao"}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Erro ao baixar o PPTX. Tente novamente." });
    }
  }

  async function handleDownloadPdf() {
    if (!iaPdfUrl) return;
    try {
      const res = await fetch(iaPdfUrl);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${institutionalPresentation?.title ?? "apresentacao"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(iaPdfUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleApproveProject() {
    if (!presentationId) return;
    try {
      const res = await authFetch(`/api/projects/${presentationId}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setToast({ message: "Projeto aprovado com sucesso!" });
      setProjectRawStatus(2);
      if (institutionalPresentation) {
        setInstitutionalPresentation({ ...institutionalPresentation, status: "active" });
      }
      if (returnTo) setTimeout(() => navigate(returnTo), 1200);
    } catch {
      setToast({ message: "Erro ao aprovar o projeto. Tente novamente." });
    }
  }

  async function handleRejectProject() {
    if (!presentationId) return;
    try {
      const res = await authFetch(`/api/projects/${presentationId}/reject`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setToast({ message: "Projeto rejeitado." });
      setProjectRawStatus(3);
      if (institutionalPresentation) {
        setInstitutionalPresentation({ ...institutionalPresentation, status: "draft" });
      }
      if (returnTo) setTimeout(() => navigate(returnTo), 1200);
    } catch {
      setToast({ message: "Erro ao rejeitar o projeto. Tente novamente." });
    }
  }

  const header = (
    <AuthenticatedHeader
      activeItem="create"
      canCreate={canCreate}
      logoTo={canCreate ? ROUTE_PATHS.createPresentation : presentationsRoute}
      onLogout={handleLogout}
      presentationsTo={presentationsRoute}
      showMobilePresentationsShortcut
      user={user}
      customCenterNav={
        returnTo === ROUTE_PATHS.teams ? (
          <Link
            to={returnTo}
            className="flex h-10 items-center justify-center rounded-[50px] border border-[#1675b8] bg-[rgba(22,117,184,0.5)] px-3 text-[1rem] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] lg:h-11 lg:px-3.5"
          >
            Projetos Pendentes
          </Link>
        ) : undefined
      }
    />
  );

  // Sem ?pid não há apresentação real para mostrar.
  if (!presentationId) {
    return <Navigate to={presentationsRoute} replace />;
  }

  {
    if (institutionalLoading) {
      return (
        <div data-page-theme="generated" className="min-h-screen bg-[#f8fafc]">
          {header}
          <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center">
            <FiLoader className="h-8 w-8 animate-spin text-[#1675b8]" />
          </main>
        </div>
      );
    }

    if (!institutionalPresentation) {
      return (
        <div data-page-theme="generated" className="min-h-screen bg-[#f8fafc]">
          {header}
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto flex min-h-screen max-w-[600px] items-center justify-center px-5 text-center"
          >
            <div className="rounded-[20px] border border-[#fecaca] bg-[#fff7f7] px-6 py-8">
              <h1 className="text-[1.3rem] font-bold text-[#991b1b]">Apresentação não encontrada</h1>
              <p className="mt-2 text-[0.9rem] text-[#7f1d1d]">
                O ID "{presentationId}" não corresponde a nenhuma apresentação.
              </p>
              <button
                type="button"
                onClick={() => navigate(presentationsRoute)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1675b8] px-5 py-2.5 text-[0.9rem] font-bold text-white"
              >
                <FiArrowLeft className="h-4 w-4" />
                Voltar para Minhas Apresentações
              </button>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div
        data-page-theme="generated"
        className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)] text-[#1e1e1e]"
      >
        {toast && <FeedbackToast message={toast.message} />}
        {header}

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8"
        >
          {/* Contexto institucional: breadcrumb, hero, módulos, projetos */}
          <InstitutionalHeader
            presentation={institutionalPresentation}
            onBack={() => navigate(returnTo ?? presentationsRoute)}
            backLabel={returnTo === ROUTE_PATHS.teams ? "Voltar à análise" : undefined}
            onToast={(msg) => setToast({ message: msg })}
            onApprove={
              projectRawStatus === 1 && institutionalPresentation.createdBy !== user?.id
                ? handleApproveProject
                : undefined
            }
            onReject={
              projectRawStatus === 1 && institutionalPresentation.createdBy !== user?.id
                ? handleRejectProject
                : undefined
            }
            onOpenPresenterMode={() => {
              if (hasSlideImages || iaSlides?.length) {
                setIaPresenterIndex(0);
                setIaPresenterOpen(true);
              } else {
                setToast({ message: "Esta apresentação não tem slides gerados." });
              }
            }}
            onDownloadPptx={
              institutionalPresentation.createdBy === user?.id &&
              institutionalPresentation.status === "active"
                ? handleDownloadPptx
                : undefined
            }
            onExportPdf={
              institutionalPresentation.createdBy === user?.id &&
              institutionalPresentation.status === "active"
                ? iaPdfUrl
                  ? handleDownloadPdf
                  : () => setToast({ message: "O PDF desta apresentação ainda não está disponível." })
                : undefined
            }
            onNewVersion={
              institutionalPresentation.createdBy === user?.id &&
              projectRawStatus !== 1 &&
              projectFamily
                ? () => navigate(
                    `${ROUTE_PATHS.createPresentation}?editFamily=${projectFamily}${projectTeam ? `&teamId=${projectTeam}` : ""}`
                  )
                : undefined
            }
          />

          {/* Divisor */}
          <div className="my-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="rounded-full bg-[#eff6ff] px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-widest text-[#1675b8]">
              Conteúdo Gerado
            </span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          {!iaSlides && !hasSlideImages && (
            <section className="mx-auto max-w-2xl rounded-[20px] border border-dashed border-[#d1d5db] bg-white px-6 py-10 text-center">
              <p className="text-[1rem] font-semibold text-[#374151]">Esta apresentação não tem slides gerados.</p>
              <p className="mt-1 text-[0.88rem] text-[#6b7280]">
                Crie uma nova versão para gerar os slides com a IA.
              </p>
            </section>
          )}

          {/* Fontes consultadas pela IA */}
          {iaSources && iaSources.length > 0 && (
            <section className="mx-auto mt-8 max-w-4xl rounded-[20px] border border-[#e2e8f0] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <p className="mb-3 text-[0.78rem] font-bold uppercase tracking-widest text-[#94a3b8]">
                Fontes consultadas pela IA
              </p>
              <div className="flex flex-wrap gap-2">
                {iaSources.map((s) => {
                  const ok = s.status === "success" && s.resultados > 0;
                  const skipped = s.status === "skipped";
                  const failed = s.status === "failed";
                  return (
                    <span
                      key={s.fonte}
                      title={s.mensagem ?? `${s.resultados} resultado${s.resultados !== 1 ? "s" : ""}`}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.8rem] font-semibold",
                        ok      ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]" : "",
                        skipped ? "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]" : "",
                        failed  ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]" : "",
                        !ok && !skipped && !failed ? "border-[#fef08a] bg-[#fefce8] text-[#92400e]" : "",
                      ].join(" ")}
                    >
                      <span>{ok ? "✓" : skipped ? "—" : "✗"}</span>
                      {s.fonte}
                      {ok && <span className="opacity-60">· {s.resultados}</span>}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Slides gerados pela IA ── */}
          {iaSlides && iaSlides.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1675b8,#0d5283)]">
                    <FiLayers className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em] text-[#1e1e1e]">
                      Módulos da Apresentação
                    </h2>
                    <p className="text-[0.84rem] text-[#878787]">
                      {hasSlideImages
                        ? `${Object.values(iaImageEnabled).filter(Boolean).length} de ${iaSlideImages.length} slides ativos — os mesmos do arquivo PPTX; clique no olho para ocultar/mostrar`
                        : `${Object.values(iaSlideEnabled).filter(Boolean).length} de ${iaSlides.length} módulos ativos — clique no olho para ocultar/mostrar`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIaPresenterIndex(0); setIaPresenterOpen(true); }}
                  className="flex items-center gap-2 rounded-full bg-[#1675b8] px-4 py-2 text-[0.84rem] font-bold text-white shadow-[0_2px_10px_rgba(22,117,184,0.3)] hover:bg-[#1262a0] transition-colors"
                >
                  <FiMaximize className="h-4 w-4" />
                  Apresentar
                </button>
              </div>

              {hasSlideImages ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {iaSlideImages.map((src, i) => {
                    const active = iaImageEnabled[i] !== false;
                    return (
                      <div key={src} className={`relative transition-opacity ${active ? "opacity-100" : "opacity-40"}`}>
                        <button
                          type="button"
                          aria-label={active ? "Ocultar slide" : "Mostrar slide"}
                          onClick={() => setIaImageEnabled(prev => ({ ...prev, [i]: !(prev[i] !== false) }))}
                          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                        >
                          {active ? <FiEye className="h-3.5 w-3.5 text-[#1675b8]" /> : <FiEyeOff className="h-3.5 w-3.5 text-[#9ca3af]" />}
                        </button>
                        <button
                          type="button"
                          aria-label={`Apresentar a partir do slide ${i + 1}`}
                          onClick={() => { setIaPresenterIndex(i); setIaPresenterOpen(true); }}
                          className="block w-full overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-[#0e0c2c] shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.16)]"
                        >
                          <img
                            src={src}
                            alt={`Slide ${i + 1}`}
                            loading="lazy"
                            className="aspect-video w-full object-contain"
                          />
                        </button>
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.7rem] font-bold text-white">
                          {i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {iaSlides.map((slide, i) => {
                  const active = iaSlideEnabled[i] !== false;
                  return (
                    <div key={i} className={`relative flex flex-col transition-opacity ${active ? "opacity-100" : "opacity-40"}`}>
                      <button
                        type="button"
                        aria-label={active ? "Ocultar slide" : "Mostrar slide"}
                        onClick={() => setIaSlideEnabled(prev => ({ ...prev, [i]: !prev[i] }))}
                        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                      >
                        {active ? <FiEye className="h-3.5 w-3.5 text-[#1675b8]" /> : <FiEyeOff className="h-3.5 w-3.5 text-[#9ca3af]" />}
                      </button>
                      <button
                        type="button"
                        aria-label="Apresentar a partir deste slide"
                        onClick={() => { setIaPresenterIndex(i); setIaPresenterOpen(true); }}
                        className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                      >
                        <FiMaximize className="h-3.5 w-3.5 text-[#374151]" />
                      </button>
                      <IaSlideCard slide={slide} index={i} fonteCatalog={iaFonteCatalog} />
                    </div>
                  );
                })}

                {/* Card de Referências — igual ao slide final do PPTX */}
                {iaFonteCatalog.filter(f => f.url).length > 0 && (
                  <div className="sm:col-span-2 xl:col-span-3">
                    <div className="rounded-[20px] border-2 border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                      <span className="inline-block rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-widest text-[#1675b8] mb-4">
                        Referências
                      </span>
                      <div className="space-y-3">
                        {iaFonteCatalog.filter(f => f.url).map((f, i) => (
                          <div key={i} className="flex gap-3">
                            <span className="shrink-0 mt-0.5 text-[0.72rem] font-bold text-[#9ca3af]">[{i + 1}]</span>
                            <div>
                              <p className="text-[0.82rem] font-semibold text-[#374151] leading-snug">{f.titulo ?? f.id}</p>
                              {f.fonte && <p className="text-[0.72rem] text-[#9ca3af]">{f.fonte}</p>}
                              <a href={f.url} target="_blank" rel="noopener noreferrer"
                                className="text-[0.72rem] text-[#1675b8] hover:underline break-all">
                                {f.url}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}
            </section>
          )}

        </main>

        {/* Modo apresentação para slides da IA */}
        {iaPresenterOpen && hasSlideImages && (
          <IaImagePresenterOverlay
            images={iaSlideImages}
            enabled={iaImageEnabled}
            initialIndex={iaPresenterIndex}
            onClose={() => setIaPresenterOpen(false)}
          />
        )}
        {iaPresenterOpen && !hasSlideImages && iaSlides && (
          <IaPresenterOverlay
            slides={iaSlides}
            enabled={iaSlideEnabled}
            initialIndex={iaPresenterIndex}
            onClose={() => setIaPresenterOpen(false)}
            fonteCatalog={iaFonteCatalog}
          />
        )}

      </div>
    );
  }
}
