import { useEffect, useState } from "react";
import { FaFilter, FaSearch } from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCpu,
  FiFileText,
  FiFlag,
  FiGlobe,
  FiGrid,
  FiHeart,
  FiLayers,
  FiLoader,
  FiMap,
  FiMaximize,
  FiPackage,
  FiSave,
  FiShare2,
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
import { usePresentationData, usePresentationDeck } from "../../hooks";
import { templateService } from "../../services/templateService";
import { ShareModal } from "../../components/ShareModal";
import type { NewTemplatePayload } from "../../types/template";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { formatShortDate } from "../../lib/formatters";
import { presentationService } from "../../services/presentationService";
import { projectService } from "../../services/projectService";
import { MODULE_DEFINITIONS } from "../../services/suggestionEngine";
import { readPresentationFiltersFromSearchParams } from "../../router/presentationSearchParams";
import { ROUTE_PATHS } from "../../router/paths";
import type { PresentationCard } from "../../types/presentation";
import type {
  EventType,
  InstitutionalPresentation,
  PresentationLanguage,
  PresentationModuleId,
  PresentationStatus,
} from "../../types/institutionalPresentation";
import type { ProjectSummary } from "../../types/project";

// ─── Modal: Salvar como Template ─────────────────────────────────────────────

type SaveAsTemplateModalProps = {
  presentation: import("../../types/institutionalPresentation").InstitutionalPresentation;
  projects: import("../../types/project").ProjectSummary[];
  userId: string;
  userName?: string;
  onClose: () => void;
  onSaved: () => void;
};

function SaveAsTemplateModal({ presentation: p, projects, userId, userName, onClose, onSaved }: SaveAsTemplateModalProps) {
  const [name, setName]       = useState(`Template — ${p.title}`);
  const [objective, setObj]   = useState(p.mainFocus ?? "");
  const [focus, setFocus]     = useState(p.mainFocus ?? "");
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: NewTemplatePayload = {
        name:      name.trim(),
        description: `Template gerado a partir de "${p.title}"`,
        eventName:   p.eventName,
        eventType:   p.eventType,
        focus:       focus.trim() || p.mainFocus || "Geral",
        objective:   objective.trim() || undefined,
        categories:  projects.flatMap((x) => x.categories).filter((v, i, a) => a.indexOf(v) === i),
        projects:    projects.map((x) => x.id),
        modules:     [],
        moduleOrder: [],
        moduleConfigs: p.moduleConfigs,
        language:    p.language,
        createdBy:   userId,
        createdByName: userName,
        status:      "draft",
        isOfficial:  false,
        estimatedDurationMinutes: 0,
        notes:       notes.trim() || undefined,
      };
      await templateService.createTemplate(payload);
      setDone(true);
      setTimeout(onSaved, 1200);
    } finally {
      setSaving(false);
    }
  }

  const activeModules = p.moduleConfigs.filter((m) => m.enabled && !m.hidden);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Salvar como Template">
      <div className="absolute inset-0 bg-[#142133]/50 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-[0_32px_80px_rgba(20,33,51,0.28)] max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-[#f0f1f5] px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)]">
              <FiBookOpen className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-[1rem] font-bold text-[#1e1e1e]">Salvar como Template</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {done ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dcfce7]">
                <FiCheck className="h-6 w-6 text-[#166534]" />
              </div>
              <p className="text-[0.95rem] font-bold text-[#166534]">Template salvo com sucesso!</p>
              <p className="text-[0.82rem] text-[#9ca3af]">Disponível em Templates Salvos.</p>
            </div>
          ) : (
            <>
              {/* Nome */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Nome do template *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20"
                />
              </div>

              {/* Evento (read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Evento</label>
                  <input
                    readOnly
                    value={p.eventName ?? "—"}
                    className="w-full rounded-xl border border-[#f0f1f5] bg-[#f8fafc] px-4 py-2.5 text-[0.87rem] text-[#6b7280] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Tipo de evento</label>
                  <input
                    readOnly
                    value={p.eventType}
                    className="w-full rounded-xl border border-[#f0f1f5] bg-[#f8fafc] px-4 py-2.5 text-[0.87rem] text-[#6b7280] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Objetivo</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObj(e.target.value)}
                  placeholder="Ex: Apresentar projetos de inovação para gestores…"
                  className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20"
                />
              </div>

              {/* Enfoque */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Enfoque principal</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Ex: Saúde Digital, Inovação, Infraestrutura…"
                  className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20"
                />
              </div>

              {/* Idioma (read-only) */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Idioma</label>
                <input
                  readOnly
                  value={p.language}
                  className="w-full rounded-xl border border-[#f0f1f5] bg-[#f8fafc] px-4 py-2.5 text-[0.87rem] text-[#6b7280] cursor-not-allowed"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anotações internas para a equipe…"
                  className="w-full resize-none rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20"
                />
              </div>

              {/* Projetos incluídos (read-only) */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">
                  Projetos incluídos <span className="font-normal text-[#9ca3af]">({projects.length})</span>
                </label>
                {projects.length === 0 ? (
                  <p className="text-[0.82rem] italic text-[#9ca3af]">Nenhum projeto selecionado.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {projects.map((proj) => (
                      <span key={proj.id} className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-0.5 text-[0.75rem] font-medium text-[#374151]">
                        {proj.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Módulos incluídos (read-only) */}
              <div>
                <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">
                  Módulos incluídos <span className="font-normal text-[#9ca3af]">({activeModules.length} ativos)</span>
                </label>
                {activeModules.length === 0 ? (
                  <p className="text-[0.82rem] italic text-[#9ca3af]">Nenhum módulo ativo.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {activeModules.map((m) => (
                      <span key={m.instanceId} className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2.5 py-0.5 text-[0.75rem] font-medium text-[#1d4ed8]">
                        {m.moduleId}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        {!done && (
          <div className="flex justify-end gap-3 border-t border-[#f0f1f5] px-6 py-4 shrink-0">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[0.86rem] font-semibold text-[#6b7280] hover:bg-[#f3f4f6]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-5 py-2 text-[0.86rem] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(217,119,6,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiSave className="h-3.5 w-3.5" />}
              Salvar Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
}: {
  presentation: InstitutionalPresentation;
  projects: ProjectSummary[];
  onBack: () => void;
  onToast: (msg: string) => void;
  onOpenPresenterMode: () => void;
  onSaveAsTemplate?: () => void;
  onShare?: () => void;
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
          {onSaveAsTemplate && (
            <button
              type="button"
              onClick={onSaveAsTemplate}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-[0.86rem] font-semibold text-[#d97706] transition hover:bg-[#fef3c7]"
            >
              <FiBookOpen className="h-3.5 w-3.5" />
              Salvar como Template
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

      {/* Estrutura: módulos ativos */}
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
  const [institutionalPresentation, setInstitutionalPresentation] =
    useState<InstitutionalPresentation | null>(null);
  const [institutionalProjects, setInstitutionalProjects] = useState<ProjectSummary[]>([]);
  const [institutionalLoading, setInstitutionalLoading] = useState(!!presentationId);

  useEffect(() => {
    if (!presentationId) return;
    setInstitutionalLoading(true);
    Promise.all([
      presentationService.getPresentationById(presentationId),
      projectService.getProjects(),
    ])
      .then(([pres, allProjects]) => {
        setInstitutionalPresentation(pres);
        if (pres && pres.selectedProjects.length > 0) {
          const ids = new Set(pres.selectedProjects);
          setInstitutionalProjects(allProjects.filter((p) => ids.has(p.id)));
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
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
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
            onOpenPresenterMode={() => setPresenterModeOpen(true)}
            onSaveAsTemplate={() => setSaveTemplateOpen(true)}
            onShare={() => setShareModalOpen(true)}
          />

          {/* Divisor */}
          <div className="my-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#e2e8f0]" />
            <span className="rounded-full bg-[#eff6ff] px-4 py-1.5 text-[0.78rem] font-bold uppercase tracking-widest text-[#1675b8]">
              Conteúdo Gerado
            </span>
            <div className="h-px flex-1 bg-[#e2e8f0]" />
          </div>

          {/* Dashboard + slides */}
          {renderSlidesSection()}
        </main>

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

        {saveTemplateOpen && (
          <SaveAsTemplateModal
            presentation={institutionalPresentation}
            projects={institutionalProjects}
            userId={user?.id ?? "unknown"}
            userName={user?.name}
            onClose={() => setSaveTemplateOpen(false)}
            onSaved={() => {
              setSaveTemplateOpen(false);
              setToast({ message: "Template salvo com sucesso! Disponível em Templates Salvos." });
            }}
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
