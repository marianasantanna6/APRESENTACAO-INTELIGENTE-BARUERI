import { useEffect, useState } from "react";
import { FaFilter, FaSearch } from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiFlag,
  FiGlobe,
  FiImage,
  FiGrid,
  FiHeart,
  FiLayers,
  FiLoader,
  FiMap,
  FiMaximize,
  FiPackage,
  FiSave,
  FiShare2,
  FiSliders,
  FiTag,
  FiTrendingUp,
  FiUser,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DEFAULT_PRESENTATION_FILTERS } from "../../api/presentation";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { InstitutionalPresenterMode } from "../../components/InstitutionalPresenterMode/InstitutionalPresenterMode";
import DashboardSection from "../../components/DashboardSection";
import { PresentationModeOverlay } from "../../components/PresentationMode";
import PresentationCardsSection from "../../components/PresentationCardsSection";
import { useAuth } from "../../context";
import { authFetch } from "../../lib/apiClient";
import { usePresentationData, usePresentationDeck } from "../../hooks";
import { ShareModal } from "../../components/ShareModal";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { formatShortDate } from "../../lib/formatters";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import { CANONICAL_MODULE_ORDER, MODULE_DEFINITIONS } from "../../services/suggestionEngine";
import { readPresentationFiltersFromSearchParams } from "../../router/presentationSearchParams";
import { ROUTE_PATHS } from "../../router/paths";
import type { PresentationCard } from "../../types/presentation";
import type {
  EventType,
  InstitutionalPresentation,
  PresentationLanguage,
  PresentationModuleConfig,
  PresentationModuleId,
  PresentationStatus,
} from "../../types/institutionalPresentation";
import type { ProjectSummary } from "../../types/project";

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresentationStatus, { label: string; cls: string }> = {
  draft:     { label: "Rascunho",    cls: "bg-[#fef9c3] text-[#92400e]" },
  ready:     { label: "Pronto",      cls: "bg-[#dbeafe] text-[#1e40af]" },
  presented: { label: "Apresentado", cls: "bg-[#dcfce7] text-[#166534]" },
  archived:  { label: "Arquivado",   cls: "bg-[#f1f5f9] text-[#475569]" },
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

const MODULE_ICONS: Record<PresentationModuleId, React.ComponentType<{ className?: string }>> = {
  "capa-institucional":      FiFlag,
  "dados-gerais-barueri":    FiMap,
  "dados-macro":             FiTrendingUp,
  "apresentacao-sit":        FiCpu,
  "apresentacao-secretario": FiUser,
  "visao-geral-projetos":    FiGrid,
  "projetos-selecionados":   FiPackage,
  "indicadores":             FiBarChart2,
  "premios":                 FiAward,
  "ods":                     FiGlobe,
  "videos":                  FiVideo,
  "encerramento":            FiHeart,
  "agradecimento":           FiZap,
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
  projects,
  onBack,
  onToast,
  onOpenPresenterMode,
  onSaveAsTemplate,
  onShare,
  onDownloadPptx,
  hideStructure,
}: {
  presentation: InstitutionalPresentation;
  projects: ProjectSummary[];
  onBack: () => void;
  onToast: (msg: string) => void;
  onOpenPresenterMode: () => void;
  onShare?: () => void;
  onDownloadPptx?: () => void;
  hideStructure?: boolean;
}) {
  const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
  const eventLabel = EVENT_LABELS[p.eventType] ?? p.eventType;
  const languageLabel = LANGUAGE_LABELS[p.language] ?? p.language;
  const activeModules = p.moduleConfigs.filter((m) => m.enabled && !m.hidden);

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
          Minhas Apresentações
        </button>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => onToast("Exportação em PDF será conectada em breve.")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[0.86rem] font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
          >
            <FiFileText className="h-3.5 w-3.5" />
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={onShare ?? (() => onToast("Compartilhamento indisponível."))}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[0.86rem] font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
          >
            <FiShare2 className="h-3.5 w-3.5" />
            Compartilhar
          </button>
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
          <MetaChip
            icon={<FiGrid className="h-3.5 w-3.5" />}
            label="Módulos ativos"
            value={`${activeModules.length} de ${p.moduleConfigs.length}`}
          />
          {projects.length > 0 && (
            <MetaChip
              icon={<FiLayers className="h-3.5 w-3.5" />}
              label="Projetos"
              value={`${projects.length} selecionado${projects.length !== 1 ? "s" : ""}`}
            />
          )}
          <MetaChip icon={<FiCheck className="h-3.5 w-3.5" />} label="Versão" value={`v${p.version}`} />
        </div>
      </div>

      {/* Estrutura: módulos ativos — oculto quando slides da IA já mostram isso */}
      {!hideStructure && (
      <div className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1675b8,#1255a0)]">
            <FiGrid className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em] text-[#1e1e1e]">
              Estrutura da Apresentação
            </h2>
            <p className="text-[0.84rem] text-[#878787]">
              {activeModules.length} módulo{activeModules.length !== 1 ? "s" : ""} ativo{activeModules.length !== 1 ? "s" : ""} na ordem de exibição
            </p>
          </div>
        </div>

        {activeModules.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-10 text-center">
            <p className="text-[0.95rem] font-semibold text-[#6b7280]">Nenhum módulo ativo</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {activeModules.map((cfg, i) => {
              const info = MODULE_DEFINITIONS[cfg.moduleId];
              const Icon = MODULE_ICONS[cfg.moduleId];
              return (
                <div
                  key={cfg.instanceId}
                  className="flex items-center gap-3 rounded-[14px] border border-[#e2e8f0] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[0.7rem] font-bold text-[#1675b8]">
                    {i + 1}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc] text-[#1675b8]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.86rem] font-bold text-[#1e1e1e]">{info.title}</p>
                    <p className="truncate text-[0.74rem] text-[#9ca3af]">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Projetos incluídos */}
      {projects.length > 0 && (
        <div className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6fa8d6,#4f84c4)]">
              <FiLayers className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em] text-[#1e1e1e]">
                Projetos Incluídos
              </h2>
              <p className="text-[0.84rem] text-[#878787]">
                {projects.length} projeto{projects.length !== 1 ? "s" : ""} do acervo institucional
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
              >
                <p className="font-bold leading-tight text-[#1e1e1e]">{project.name}</p>
                <p className="mt-1.5 line-clamp-2 text-[0.84rem] leading-6 text-[#6b7280]">
                  {project.shortDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.74rem] font-semibold text-[#475569]">
                    {project.mainDepartment}
                  </span>
                  {project.categories.slice(0, 2).map((cat) => (
                    <span key={cat} className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[0.74rem] font-semibold text-[#1d4ed8]">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link público (se existir) */}
      {p.publicLink && (
        <div className="mb-10 rounded-[18px] border border-[#bbf7d0] bg-[#f0fdf4] p-5">
          <p className="mb-1 text-[0.78rem] font-bold uppercase tracking-wide text-[#166534]">Link Público</p>
          <a
            href={p.publicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[0.9rem] font-semibold text-[#1675b8] hover:underline"
          >
            <FiGlobe className="h-4 w-4 shrink-0" />
            {p.publicLink}
            <FiArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
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
  const filters = readPresentationFiltersFromSearchParams(searchParams, DEFAULT_PRESENTATION_FILTERS);

  // ── Apresentação institucional (quando vem do wizard com ?pid) ──
  const presentationId = searchParams.get("pid");
  const downloadUrlParam = searchParams.get("dlUrl");

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
  const [institutionalProjects, setInstitutionalProjects] = useState<ProjectSummary[]>([]);
  const [institutionalLoading, setInstitutionalLoading] = useState(!!presentationId);

  // ── Módulos editáveis (pós-geração) ──
  const [editModuleConfigs, setEditModuleConfigs] = useState<PresentationModuleConfig[]>([]);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [modulesSaved, setModulesSaved] = useState(false);

  // ── Slides da IA ──
  const [iaSlides, setIaSlides] = useState<IaSlide[] | null>(null);
  const [iaFonteCatalog, setIaFonteCatalog] = useState<IaFonteCatalog[]>([]);
  const [iaSlideEnabled, setIaSlideEnabled] = useState<Record<number, boolean>>({});
  const [iaPresenterOpen, setIaPresenterOpen] = useState(false);
  const [iaPresenterIndex, setIaPresenterIndex] = useState(0);

  useEffect(() => {
    if (!presentationId) return;
    setInstitutionalLoading(true);

    authFetch(`/api/projects?id=${encodeURIComponent(presentationId)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const list = await res.json() as Array<{
          id: string; name: string; user: string; version: string;
          status: number; short_description?: string | null;
          audience?: string | null; areas: string[];
          last_update: string;
          slides_json?: { titulo?: string; slides?: IaSlide[]; fontes?: IaFonteCatalog[] } | null;
        }>;
        const project = list[0];
        if (!project) return;
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
        if (Array.isArray(rawFontes)) setIaFonteCatalog(rawFontes);
        if (Array.isArray(rawSlides) && rawSlides.length > 0) {
          setIaSlides(rawSlides);
          const initial: Record<number, boolean> = {};
          rawSlides.forEach((_, i) => { initial[i] = true; });
          setIaSlideEnabled(initial);
        } else {
          setEditModuleConfigs(
            CANONICAL_MODULE_ORDER.map((moduleId) => ({
              instanceId: `inst-${moduleId}`,
              moduleId,
              enabled: true,
              hidden: false,
            })),
          );
        }
      })
      .finally(() => setInstitutionalLoading(false));
  }, [presentationId]);

  // ── Slides / dashboard (sempre carregados — usados em ambos os modos) ──
  const { data: presentationData, error, isLoading } = usePresentationData(filters);
  const presentationDeck = usePresentationDeck({
    cards: presentationData?.presentationCards ?? [],
    storageKey: `presentation-deck:${filters.query}:${filters.category}:${filters.year}`,
  });

  const [query, setQuery] = useState(filters.query);
  const [showFilters, setShowFilters] = useState(false);
  const [requestFullscreenOnOpen, setRequestFullscreenOnOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [presenterModeOpen, setPresenterModeOpen] = useState(false);
  const [presenterInitialSlideId, setPresenterInitialSlideId] = useState<string | undefined>(undefined);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const activeCategory = filters.category;
  const activeYear = filters.year;
  const presentationViewData = presentationData
    ? { ...presentationData, presentationCards: presentationDeck.visibleSlides }
    : null;
  const canGoPrevious = presentationDeck.activeSlideIndex > 0;
  const canGoNext =
    presentationDeck.activeSlideIndex > -1 &&
    presentationDeck.activeSlideIndex < presentationDeck.visibleSlides.length - 1;

  useEffect(() => {
    if (presentationDeck.viewerMode !== "closed") return;
    setRequestFullscreenOnOpen(false);
  }, [presentationDeck.viewerMode]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  function handleOpenDeck() {
    setRequestFullscreenOnOpen(false);
    presentationDeck.openDeck();
  }

  function handleOpenDashboardSlide(slideId: PresentationCard["id"]) {
    setRequestFullscreenOnOpen(false);
    presentationDeck.openDeck(slideId);
  }

  function handleOpenSolo(slideId: PresentationCard["id"]) {
    setRequestFullscreenOnOpen(true);
    presentationDeck.openSolo(slideId);
  }

  function handleExportPdfRequest() {
    setToast({ message: "A exportação em PDF será conectada aqui em breve." });
  }

  async function handleDownloadPptx() {
    if (!downloadUrlParam) return;
    try {
      const fetchUrl = downloadUrlParam.startsWith("http")
        ? downloadUrlParam
        : `/api${downloadUrlParam}`;
      const res = await authFetch(fetchUrl);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "apresentacao.pptx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Erro ao baixar o PPTX. Tente novamente." });
    }
  }

  // ── Edição de módulos (pós-geração) ──
  function toggleModuleEnabled(instanceId: string) {
    setEditModuleConfigs((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, enabled: !m.enabled } : m)),
    );
    setModulesSaved(false);
  }

  function toggleModuleHidden(instanceId: string) {
    setEditModuleConfigs((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, hidden: !m.hidden } : m)),
    );
    setModulesSaved(false);
  }

  function moveModule(instanceId: string, direction: -1 | 1) {
    setEditModuleConfigs((prev) => {
      const idx = prev.findIndex((m) => m.instanceId === instanceId);
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      setModulesSaved(false);
      return next;
    });
  }

  function duplicateModule(instanceId: string) {
    setEditModuleConfigs((prev) => {
      const idx = prev.findIndex((m) => m.instanceId === instanceId);
      if (idx === -1) return prev;
      const source = prev[idx];
      const copy: PresentationModuleConfig = {
        ...source,
        instanceId: `${source.instanceId}-copy-${Date.now()}`,
        duplicatedFrom: instanceId,
      };
      setModulesSaved(false);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  async function saveModules() {
    if (!institutionalPresentation) return;
    setIsSavingModules(true);
    try {
      const updated = await presentationService.updatePresentation(institutionalPresentation.id, {
        moduleConfigs: editModuleConfigs,
      });
      setInstitutionalPresentation(updated);
      setModulesSaved(true);
      setToast({ message: "Módulos salvos com sucesso!" });
    } catch {
      setToast({ message: "Erro ao salvar módulos. Tente novamente." });
    } finally {
      setIsSavingModules(false);
    }
  }

  // ── Seção de slides compartilhada (usada nos dois modos) ──
  function renderSlidesSection() {
    if (isLoading || !presentationData || !presentationViewData) {
      return (
        <div className="flex items-center justify-center py-16">
          <FiLoader className="h-7 w-7 animate-spin text-[#1675b8]" />
        </div>
      );
    }

    // Em modo institucional, qualquer clique em gráfico/slide abre o presenter
    // diretamente no slide correspondente (navegação não-linear).
    const openSlideHandler = presentationId
      ? (slideId: string) => {
          setPresenterInitialSlideId(slideId);
          setPresenterModeOpen(true);
        }
      : handleOpenDashboardSlide;

    const openSoloHandler = presentationId
      ? (slideId: string) => {
          setPresenterInitialSlideId(slideId);
          setPresenterModeOpen(true);
        }
      : handleOpenSolo;

    return (
      <>
        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#1675b8,#0d5283)]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Indicadores</p>
              <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em] text-[#1e1e1e]">Dashboard de Dados</h2>
            </div>
          </div>
          <DashboardSection data={presentationData} onOpenSlide={openSlideHandler} />
        </section>

        <PresentationCardsSection
          allowEditing={canCreate}
          data={presentationViewData}
          hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
          onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
          onOpenDeck={presentationId ? undefined : handleOpenDeck}
          onOpenSolo={openSoloHandler}
          onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
        />
      </>
    );
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
    />
  );

  // ── Modo institucional (vem do wizard com ?pid) ──
  if (presentationId) {
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
            projects={institutionalProjects}
            onBack={() => navigate(presentationsRoute)}
            onToast={(msg) => setToast({ message: msg })}
            onOpenPresenterMode={() => {
              if (iaSlides?.length) {
                setIaPresenterIndex(0);
                setIaPresenterOpen(true);
              } else {
                setPresenterModeOpen(true);
              }
            }}
            onShare={() => setShareModalOpen(true)}
            onDownloadPptx={downloadUrlParam ? handleDownloadPptx : undefined}
            hideStructure={!!iaSlides?.length}
          />

          {/* Divisor */}
          <div className="my-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="rounded-full bg-[#eff6ff] px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-widest text-[#1675b8]">
              Conteúdo Gerado
            </span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          {/* Slides da IA (quando gerados pelo wizard) ou dashboard/slides antigo */}
          {iaSlides ? null : renderSlidesSection()}

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
                      {Object.values(iaSlideEnabled).filter(Boolean).length} de {iaSlides.length} módulos ativos — clique no olho para ocultar/mostrar
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
            </section>
          )}

          {/* ── Módulos — ajuste de ordem e visibilidade (fallback quando não há slides da IA) ── */}
          {editModuleConfigs.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6fa8d6,#4f84c4)]">
                  <FiSliders className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-[1.3rem] font-extrabold tracking-[-0.03em] text-[#1e1e1e]">
                    Ajustar Módulos
                  </h2>
                  <p className="text-[0.84rem] text-[#878787]">
                    Reordene, oculte ou desative módulos da apresentação
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                <div className="space-y-2">
                  {editModuleConfigs.map((config, index) => {
                    const info = MODULE_DEFINITIONS[config.moduleId];
                    const Icon = MODULE_ICONS[config.moduleId];
                    const inactive = !config.enabled || config.hidden;
                    return (
                      <div
                        key={config.instanceId}
                        className={`flex items-center gap-3 rounded-[16px] border-2 bg-white px-4 py-3 transition-all ${
                          inactive
                            ? "border-[#e2e8f0] opacity-50"
                            : "border-[#1675b8] shadow-[0_2px_10px_rgba(22,117,184,0.08)]"
                        }`}
                      >
                        {/* Reordenar */}
                        <div className="flex shrink-0 flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveModule(config.instanceId, -1)}
                            disabled={index === 0}
                            aria-label="Mover para cima"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151] disabled:opacity-30"
                          >
                            <FiChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(config.instanceId, 1)}
                            disabled={index === editModuleConfigs.length - 1}
                            aria-label="Mover para baixo"
                            className="flex h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151] disabled:opacity-30"
                          >
                            <FiChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Ícone */}
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${inactive ? "bg-[#f1f5f9] text-[#94a3b8]" : "bg-[#eff6ff] text-[#1675b8]"}`}>
                          <Icon className="h-4 w-4" />
                        </span>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.88rem] font-bold text-[#1e1e1e]">{info.title}</p>
                          <p className="truncate text-[0.76rem] text-[#9ca3af]">{info.description}</p>
                        </div>

                        {/* Ações */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleModuleHidden(config.instanceId)}
                            title={config.hidden ? "Exibir" : "Ocultar"}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[#f3f4f6] ${config.hidden ? "text-[#f59e0b]" : "text-[#9ca3af]"}`}
                          >
                            {config.hidden ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateModule(config.instanceId)}
                            title="Duplicar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151]"
                          >
                            <FiCopy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleModuleEnabled(config.instanceId)}
                            title={config.enabled ? "Desativar" : "Ativar"}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-[0.75rem] font-bold transition ${
                              config.enabled
                                ? "bg-[#1675b8] text-white hover:bg-[#0d5e96]"
                                : "border border-[#d1d5db] text-[#9ca3af] hover:border-[#1675b8] hover:text-[#1675b8]"
                            }`}
                          >
                            {config.enabled ? <FiCheck className="h-3.5 w-3.5" /> : <FiX className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Painel de salvar */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                  <div className="rounded-[20px] border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <p className="text-[0.78rem] font-bold uppercase tracking-widest text-[#9ca3af]">
                      Resumo
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-[0.84rem]">
                        <span className="text-[#6b7280]">Ativos</span>
                        <span className="font-bold text-[#1675b8]">
                          {editModuleConfigs.filter((m) => m.enabled && !m.hidden).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[0.84rem]">
                        <span className="text-[#6b7280]">Ocultos</span>
                        <span className="font-semibold text-[#f59e0b]">
                          {editModuleConfigs.filter((m) => m.hidden).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[0.84rem]">
                        <span className="text-[#6b7280]">Desativados</span>
                        <span className="font-semibold text-[#9ca3af]">
                          {editModuleConfigs.filter((m) => !m.enabled).length}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={saveModules}
                      disabled={isSavingModules || modulesSaved}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#1675b8_0%,#1255a0_100%)] py-3 text-[0.9rem] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,117,184,0.5)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isSavingModules ? (
                        <FiLoader className="h-4 w-4 animate-spin" />
                      ) : modulesSaved ? (
                        <><FiCheck className="h-4 w-4" /> Salvo</>
                      ) : (
                        <><FiSave className="h-4 w-4" /> Salvar alterações</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Modo apresentação para slides da IA */}
        {iaPresenterOpen && iaSlides && (
          <IaPresenterOverlay
            slides={iaSlides}
            enabled={iaSlideEnabled}
            initialIndex={iaPresenterIndex}
            onClose={() => setIaPresenterOpen(false)}
            fonteCatalog={iaFonteCatalog}
          />
        )}

        {presentationData && (
          <InstitutionalPresenterMode
            slides={presentationDeck.visibleSlides}
            data={presentationData}
            presentation={institutionalPresentation}
            isOpen={presenterModeOpen}
            initialSlideId={presenterInitialSlideId}
            onClose={() => { setPresenterModeOpen(false); setPresenterInitialSlideId(undefined); }}
            onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
            onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
            hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
          />
        )}

        {shareModalOpen && (
          <ShareModal
            presentationId={institutionalPresentation.id}
            presentationTitle={institutionalPresentation.title}
            presentationStatus={institutionalPresentation.status}
            userId={user?.id ?? "unknown"}
            onClose={() => setShareModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // ── Modo legado — IDH dashboard + slides ──

  if (error) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        data-page-theme="generated"
        className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16 text-center"
      >
        <div
          data-generated-surface="feedback-card"
          className="max-w-[480px] rounded-[20px] border border-[#fecaca] bg-[#fff7f7] px-6 py-8 shadow-[0_12px_40px_-24px_rgba(127,29,29,0.28)]"
        >
          <h1 className="text-[1.5rem] font-extrabold text-[#991b1b]">Falha ao carregar os dados</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#7f1d1d]">
            Verifique a implementação da camada de API em{" "}
            <code>src/api/presentation</code> e tente novamente.
          </p>
        </div>
      </main>
    );
  }

  if (isLoading || !presentationData || !presentationViewData) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        data-page-theme="generated"
        className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16"
      >
        <div
          data-generated-surface="feedback-card"
          className="rounded-[20px] border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_12px_40px_-24px_rgba(15,23,42,0.24)]"
        >
          <p className="text-[1rem] font-semibold text-slate-700">
            Carregando dashboard e apresentação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      data-page-theme="generated"
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)] text-[#1e1e1e]"
    >
      {toast ? <FeedbackToast message={toast.message} /> : null}
      {header}

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8"
      >
        {/* Barra de busca (modo legado) */}
        <section className="reveal-on-scroll mb-16 space-y-6">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-generated-surface="search-input"
              className="h-14 w-full rounded-[50px] bg-white pl-14 pr-16 text-[0.96rem] font-light text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15 sm:h-[62px] sm:pl-24 sm:pr-24 sm:text-[1.2rem]"
            />
            <div className="pointer-events-none absolute left-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#898989] sm:left-11">
              <FaSearch className="h-4.5 w-4.5" />
            </div>
            <button
              type="button"
              aria-label="Abrir filtros"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((v) => !v)}
              data-generated-surface="filter-toggle"
              className={`absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition sm:right-8 sm:h-11 sm:w-11 ${
                showFilters
                  ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_12px_30px_-18px_rgba(59,130,246,0.6)]"
                  : "border-slate-200 bg-white text-[#475569] hover:bg-slate-50"
              }`}
            >
              <FaFilter className="h-5 w-5" />
            </button>
          </div>

          {showFilters && (
            <div
              data-generated-surface="filter-panel"
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-32px_rgba(15,23,42,0.32)]"
            >
              <div className="bg-gradient-to-r from-[#eff6ff] via-white to-[#f8fafc] px-5 py-4">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Filtros ativos</p>
                    <p className="mt-1 text-xs text-slate-500">Parâmetros mostrados na visualização atual.</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    Ativo
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 px-5 pb-5 pt-4">
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]">
                  Módulo: {activeCategory}
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]">
                  Ano: {activeYear}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#1675b8,#0d5283)]">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Indicadores</p>
              <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em] text-[#1e1e1e]">Dashboard de Dados</h2>
            </div>
          </div>
          <DashboardSection data={presentationData} onOpenSlide={handleOpenDashboardSlide} />
        </section>

        <PresentationCardsSection
          allowEditing={canCreate}
          data={presentationViewData}
          hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
          onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
          onOpenDeck={handleOpenDeck}
          onOpenSolo={handleOpenSolo}
          onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
        />
      </main>

      <PresentationModeOverlay
        activeSlide={presentationDeck.activeSlide}
        activeSlideIndex={presentationDeck.activeSlideIndex}
        allowEditing={canCreate}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        data={presentationViewData}
        hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
        isOpen={presentationDeck.viewerMode !== "closed"}
        requestFullscreenOnOpen={requestFullscreenOnOpen}
        slides={presentationDeck.visibleSlides}
        viewerMode={presentationDeck.viewerMode}
        onClose={presentationDeck.closeViewer}
        onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
        onExportPdfRequest={handleExportPdfRequest}
        onFullscreenRequestHandled={() => setRequestFullscreenOnOpen(false)}
        onGoNext={presentationDeck.openNextSlide}
        onGoPrevious={presentationDeck.openPreviousSlide}
        onOpenDeck={presentationDeck.openDeck}
        onOpenSolo={handleOpenSolo}
        onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
        onSelectSlide={presentationDeck.selectSlide}
      />
    </div>
  );
}
