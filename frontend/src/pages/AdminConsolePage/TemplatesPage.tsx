import { useEffect, useMemo, useState } from "react";
import {
  FiArchive,
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCopy,
  FiEdit2,
  FiExternalLink,
  FiFlag,
  FiGrid,
  FiHeart,
  FiImage,
  FiLayers,
  FiLink,
  FiLoader,
  FiMap,
  FiMoreVertical,
  FiPackage,
  FiPlay,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context";
import { usePermissions } from "../../hooks/usePermissions";
import { templateService } from "../../services/templateService";
import type {
  PresentationTemplate,
  TemplateModuleType,
  TemplateStatus,
} from "../../types/template";
import type {
  EventType,
  PresentationLanguage,
} from "../../types/institutionalPresentation";
import { ROUTE_PATHS } from "../../router/paths";

// ─── Ícones e labels por tipo de módulo ──────────────────────────────────────

const MODULE_TYPE_ICONS: Record<
  TemplateModuleType,
  React.ComponentType<{ className?: string }>
> = {
  intro:                FiFlag,
  "project-card":       FiPackage,
  "indicator-highlight":FiBarChart2,
  "media-gallery":      FiImage,
  comparison:           FiTrendingUp,
  timeline:             FiCalendar,
  map:                  FiMap,
  closing:              FiHeart,
  custom:               FiGrid,
};

const MODULE_TYPE_LABELS: Record<TemplateModuleType, string> = {
  intro:                "Abertura",
  "project-card":       "Projetos",
  "indicator-highlight":"Indicadores",
  "media-gallery":      "Galeria de mídia",
  comparison:           "Comparativo",
  timeline:             "Linha do tempo",
  map:                  "Mapa",
  closing:              "Encerramento",
  custom:               "Personalizado",
};

// ─── Metadados de exibição ────────────────────────────────────────────────────

const STATUS_CFG: Record<TemplateStatus, { label: string; cls: string }> = {
  active:   { label: "Ativo",     cls: "bg-[#dcfce7] text-[#166534]" },
  draft:    { label: "Rascunho",  cls: "bg-[#fef9c3] text-[#92400e]" },
  archived: { label: "Arquivado", cls: "bg-[#f1f5f9] text-[#475569]" },
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

const EVENT_COLORS: Record<EventType, string> = {
  "congresso":         "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  "visita-tecnica":    "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]",
  "premiacao":         "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  "reuniao-interna":   "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  "feira":             "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  "audiencia-publica": "bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]",
  "outro":             "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
};

const LANG_LABELS: Record<PresentationLanguage, string> = {
  "pt-BR": "PT-BR",
  "en-US": "EN-US",
  "es":    "ES",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; type: "success" | "error"; message: string };

function ToastItem({ t }: { t: Toast }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(20,33,51,0.16)] text-[0.86rem] font-medium text-white ${
        t.type === "success" ? "bg-[#166534]" : "bg-[#b91c1c]"
      }`}
    >
      <FiCheck className="h-4 w-4 shrink-0" />
      {t.message}
    </div>
  );
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

function EditModal({
  template,
  onClose,
  onSaved,
}: {
  template: PresentationTemplate;
  onClose: () => void;
  onSaved: (t: PresentationTemplate) => void;
}) {
  const [name, setName]   = useState(template.name);
  const [desc, setDesc]   = useState(template.description);
  const [focus, setFocus] = useState(template.focus);
  const [notes, setNotes] = useState(template.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await templateService.updateTemplate(template.id, {
        name: name.trim(),
        description: desc.trim(),
        focus: focus.trim(),
        notes: notes.trim() || undefined,
      });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#142133]/50 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-[0_32px_80px_rgba(20,33,51,0.28)]">
        <div className="flex items-center justify-between border-b border-[#f0f1f5] px-6 py-4">
          <h2 className="text-[1rem] font-bold text-[#1e1e1e]">Editar Template</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Nome *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Descrição</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Enfoque</label>
            <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#374151]">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observações internas…"
              className="w-full resize-none rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] placeholder:text-[#9ca3af] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20" />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#f0f1f5] px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-[0.86rem] font-semibold text-[#6b7280] hover:bg-[#f3f4f6]">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={!name.trim() || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-5 py-2 text-[0.86rem] font-semibold text-white disabled:opacity-50">
            {saving ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiCheck className="h-3.5 w-3.5" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de template ─────────────────────────────────────────────────────────

function TemplateCard({
  template: t,
  canEdit,
  onEdit,
  onDuplicate,
  onShare,
  onArchive,
  onUse,
}: {
  template: PresentationTemplate;
  canEdit: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onArchive: () => void;
  onUse: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status    = STATUS_CFG[t.status];
  const evtColor  = EVENT_COLORS[t.eventType] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
  const evtLabel  = EVENT_LABELS[t.eventType] ?? t.eventType;

  // Módulos em ordem
  const orderedModules = useMemo(() => {
    const byId = Object.fromEntries(t.modules.map((m) => [m.id, m]));
    const ordered = t.moduleOrder.map((id) => byId[id]).filter(Boolean);
    // Módulos sem ordem explícita vão ao final
    const inOrder = new Set(t.moduleOrder);
    const rest = t.modules.filter((m) => !inOrder.has(m.id));
    return [...ordered, ...rest];
  }, [t.modules, t.moduleOrder]);

  const requiredModules  = orderedModules.filter((m) => !m.isOptional);
  const optionalModules  = orderedModules.filter((m) => m.isOptional);

  return (
    <div className="flex flex-col rounded-2xl border border-[#e8e9f0] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(20,33,51,0.11)]">

      {/* ── Cabeçalho do card ─── */}
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3 border-b border-[#f4f5f7]">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tipo de evento — badge principal */}
          <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[0.72rem] font-bold ${evtColor}`}>
            {evtLabel}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${status.cls}`}>
            {status.label}
          </span>
          {t.isOfficial && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#d97706]">
              <FiStar className="h-2.5 w-2.5" /> Oficial
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-lg bg-[#f1f5f9] px-2 py-0.5 text-[0.68rem] font-semibold text-[#475569]">
          {LANG_LABELS[t.language]}
        </span>
      </div>

      {/* ── Nome + enfoque ─── */}
      <div className="px-5 pt-3.5 pb-1">
        <h3 className="text-[0.97rem] font-bold leading-snug text-[#1e1e1e]">{t.name}</h3>
        {t.focus && (
          <p className="mt-0.5 text-[0.78rem] text-[#6b7280]">
            <span className="font-medium text-[#374151]">{t.focus}</span>
          </p>
        )}
      </div>

      {/* ── SUMÁRIO DE MÓDULOS — diferencial principal ─── */}
      <div className="mx-5 mt-3 mb-3 rounded-xl bg-[#fafaf8] border border-[#ede8da] overflow-hidden">
        {/* Header do sumário */}
        <div className="flex items-center gap-1.5 border-b border-[#ede8da] bg-[#fffbeb] px-3 py-1.5">
          <FiLayers className="h-3 w-3 text-[#d97706]" />
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#d97706]">
            Estrutura do Deck — {orderedModules.length} seções
          </span>
          {t.estimatedDurationMinutes > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[0.68rem] text-[#9ca3af]">
              <FiClock className="h-2.5 w-2.5" />
              ~{t.estimatedDurationMinutes} min
            </span>
          )}
        </div>
        {/* Lista de módulos em ordem */}
        <ol className="px-3 py-2 space-y-1.5">
          {orderedModules.map((mod, i) => {
            const Icon = MODULE_TYPE_ICONS[mod.type] ?? FiGrid;
            return (
              <li key={mod.id} className="flex items-center gap-2">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15 text-[0.6rem] font-bold text-[#d97706]">
                  {i + 1}
                </span>
                <Icon className="h-3 w-3 shrink-0 text-[#6b7280]" />
                <span className="text-[0.78rem] font-medium text-[#374151] leading-tight truncate">
                  {mod.title}
                </span>
                {mod.isOptional && (
                  <span className="ml-auto shrink-0 text-[0.64rem] text-[#9ca3af] italic">opcional</span>
                )}
              </li>
            );
          })}
        </ol>
        {/* Resumo obrigatório/opcional */}
        {optionalModules.length > 0 && (
          <div className="border-t border-[#ede8da] px-3 py-1.5 flex items-center gap-3 text-[0.68rem] text-[#9ca3af]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#d97706]" />
              {requiredModules.length} obrigatória{requiredModules.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#d1d5db]" />
              {optionalModules.length} opcional{optionalModules.length !== 1 ? "is" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Projetos sugeridos ─── */}
      {t.projects.length > 0 && (
        <div className="px-5 mb-3">
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-[#9ca3af]">
            {t.projects.length} projeto{t.projects.length !== 1 ? "s" : ""} sugerido{t.projects.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.categories.slice(0, 4).map((cat) => (
              <span key={cat} className="rounded-full border border-[#e5e7eb] px-2 py-0.5 text-[0.7rem] font-medium text-[#6b7280]">
                {cat}
              </span>
            ))}
            {t.categories.length > 4 && (
              <span className="rounded-full border border-[#e5e7eb] px-2 py-0.5 text-[0.7rem] text-[#9ca3af]">
                +{t.categories.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Metadados ─── */}
      <div className="mx-5 mb-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#f0f1f5] pt-2.5">
        <span className="inline-flex items-center gap-1 text-[0.72rem] text-[#9ca3af]">
          <FiUser className="h-3 w-3" /> {t.createdByName ?? t.createdBy}
        </span>
        <span className="inline-flex items-center gap-1 text-[0.72rem] text-[#9ca3af]">
          <FiCalendar className="h-3 w-3" /> {formatDate(t.createdAt)}
        </span>
      </div>

      {/* ── Ações ─── */}
      <div className="mt-auto border-t border-[#f0f1f5] px-4 py-3 flex items-center gap-2">
        {/* CTA principal */}
        <button
          type="button"
          onClick={onUse}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-3 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_12px_-4px_rgba(217,119,6,0.45)] transition hover:-translate-y-0.5"
        >
          <FiPlay className="h-3.5 w-3.5" />
          Usar este Template
        </button>

        {/* Ações secundárias */}
        <button type="button" onClick={onDuplicate}
          className="rounded-xl p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#1e1e1e]"
          title="Duplicar">
          <FiCopy className="h-4 w-4" />
        </button>
        <button type="button" onClick={onShare}
          className="rounded-xl p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#1e1e1e]"
          title="Compartilhar link">
          <FiLink className="h-4 w-4" />
        </button>

        {/* Menu contextual */}
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((v) => !v)}
            className="rounded-xl p-2 text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151]"
            aria-label="Mais ações">
            <FiMoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(20,33,51,0.14)]">
                {canEdit && (
                  <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[0.82rem] font-medium text-[#374151] hover:bg-[#f8fafc]">
                    <FiEdit2 className="h-3.5 w-3.5 text-[#6b7280]" /> Editar
                  </button>
                )}
                {t.shareLink && (
                  <a href={t.shareLink} target="_blank" rel="noreferrer"
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[0.82rem] font-medium text-[#374151] hover:bg-[#f8fafc]">
                    <FiExternalLink className="h-3.5 w-3.5 text-[#6b7280]" /> Abrir link
                  </a>
                )}
                {canEdit && t.status !== "archived" && (
                  <button type="button" onClick={() => { setMenuOpen(false); onArchive(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[0.82rem] font-medium text-[#b91c1c] hover:bg-[#fef2f2]">
                    <FiArchive className="h-3.5 w-3.5" /> Arquivar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return <div className="h-80 animate-pulse rounded-2xl border border-[#e8e9f0] bg-[#f3f4f6]" />;
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const perms = usePermissions();

  const [templates, setTemplates] = useState<PresentationTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [editTarget, setEditTarget] = useState<PresentationTemplate | null>(null);

  const [query, setQuery]         = useState("");
  const [eventFilter, setEvt]     = useState<EventType | "">("");
  const [langFilter, setLang]     = useState<PresentationLanguage | "">("");
  const [statusFilter, setStatus] = useState<TemplateStatus | "">("");
  const [typeFilter, setType]     = useState<"" | "official" | "personal">("");

  useEffect(() => {
    setLoading(true);
    templateService.getTemplates().then(setTemplates).finally(() => setLoading(false));
  }, []);

  function toast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  async function handleDuplicate(t: PresentationTemplate) {
    try {
      const copy = await templateService.duplicateTemplate(t.id, user?.id ?? "unknown", user?.name);
      setTemplates((prev) => [copy, ...prev]);
      toast("success", `"${t.name}" duplicado com sucesso.`);
    } catch {
      toast("error", "Erro ao duplicar template.");
    }
  }

  async function handleShare(t: PresentationTemplate) {
    try {
      const link = t.shareLink ?? await templateService.generateShareLink(t.id);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, shareLink: link } : x)));
      await navigator.clipboard.writeText(link).catch(() => {});
      toast("success", "Link copiado para a área de transferência.");
    } catch {
      toast("error", "Erro ao gerar link.");
    }
  }

  async function handleArchive(t: PresentationTemplate) {
    try {
      const updated = await templateService.archiveTemplate(t.id);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      toast("success", `"${t.name}" arquivado.`);
    } catch {
      toast("error", "Erro ao arquivar template.");
    }
  }

  function handleEditSaved(updated: PresentationTemplate) {
    setTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditTarget(null);
    toast("success", "Template atualizado.");
  }

  function handleUse(t: PresentationTemplate) {
    navigate(`${ROUTE_PATHS.createPresentation}?templateId=${t.id}`);
  }

  const filtered = useMemo(() => {
    let list = templates;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.focus.toLowerCase().includes(q) ||
          t.modules.some((m) => m.title.toLowerCase().includes(q)),
      );
    }
    if (eventFilter)  list = list.filter((t) => t.eventType === eventFilter);
    if (langFilter)   list = list.filter((t) => t.language === langFilter);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (typeFilter === "official") list = list.filter((t) => t.isOfficial);
    if (typeFilter === "personal") list = list.filter((t) => !t.isOfficial);
    return list;
  }, [templates, query, eventFilter, langFilter, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total:    templates.length,
    active:   templates.filter((t) => t.status === "active").length,
    official: templates.filter((t) => t.isOfficial).length,
    avgModules: templates.length
      ? Math.round(templates.reduce((s, t) => s + t.modules.length, 0) / templates.length)
      : 0,
  }), [templates]);

  const canCreate = perms.canSaveTemplate();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2" aria-live="polite">
        {toasts.map((t) => <ToastItem key={t.id} t={t} />)}
      </div>

      {editTarget && (
        <EditModal template={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEditSaved} />
      )}

      {/* ── Cabeçalho ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)]">
              <FiBookOpen className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-[1.5rem] font-bold text-[#1e1e1e]">Templates de Apresentação</h1>
          </div>
          <p className="mt-1.5 text-[0.88rem] text-[#6b7280]">
            Estruturas pré-montadas de deck para reutilizar em diferentes ocasiões.
          </p>
        </div>
        {canCreate && (
          <Link
            to={ROUTE_PATHS.createPresentation}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-2.5 text-[0.9rem] font-semibold text-white shadow-[0_6px_20px_rgba(217,119,6,0.35)] transition hover:-translate-y-0.5"
          >
            <FiPlus className="h-4.5 w-4.5" /> Nova Apresentação
          </Link>
        )}
      </header>

      {/* ── Banner explicativo ── */}
      <div className="rounded-2xl border border-[#fde68a] bg-[linear-gradient(135deg,#fffbeb,#fef9c3)] px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b]/20">
            <FiZap className="h-5 w-5 text-[#d97706]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[0.9rem] font-bold text-[#92400e]">O que é um Template?</h2>
            <p className="mt-1 text-[0.83rem] leading-5.5 text-[#78350f]">
              Um template é um <strong>esqueleto de apresentação</strong> pronto para reutilizar. Ele define
              a <strong>sequência de seções</strong> (abertura, projetos, indicadores, encerramento…),
              o tipo de evento e a duração estimada — mas não o conteúdo em si. Ao clicar em
              <strong> "Usar este Template"</strong>, o wizard é iniciado com essa estrutura já configurada.
            </p>
            <p className="mt-1.5 text-[0.78rem] text-[#92400e]">
              Diferente dos <strong>Projetos Institucionais</strong> (que são o acervo de conteúdo da prefeitura),
              os templates são receitas de <em>como montar</em> uma apresentação para cada ocasião.
            </p>
          </div>
          <div className="hidden shrink-0 flex-col gap-2 sm:flex">
            {[
              { label: "Projetos Institucionais", sub: "acervo de conteúdo (os ingredientes)", icon: FiLayers, color: "text-[#1d4ed8]", bg: "bg-[#eff6ff]" },
              { label: "Templates", sub: "receitas de apresentação (a estrutura)", icon: FiBookOpen, color: "text-[#d97706]", bg: "bg-[#fffbeb]" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2 rounded-lg ${item.bg} border border-[#e5e7eb] px-3 py-2`}>
                <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
                <div>
                  <p className={`text-[0.72rem] font-bold ${item.color}`}>{item.label}</p>
                  <p className="text-[0.67rem] text-[#6b7280]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Estatísticas ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Templates",      value: stats.total,      color: "text-[#1e1e1e]" },
          { label: "Ativos",         value: stats.active,     color: "text-[#166534]" },
          { label: "Oficiais",       value: stats.official,   color: "text-[#d97706]" },
          { label: "Méd. de seções", value: stats.avgModules, color: "text-[#1675b8]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e8e9f0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
            <p className={`text-[1.6rem] font-bold leading-none ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-[0.78rem] text-[#9ca3af]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Busca + Filtros ── */}
      <div className="rounded-2xl border border-[#e8e9f0] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, enfoque ou seção do deck…"
              className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] pl-10 pr-4 text-[0.88rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/10"
            />
          </div>
          <select value={eventFilter} onChange={(e) => setEvt(e.target.value as EventType | "")}
            className="h-10 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[0.86rem] text-[#374151] focus:border-[#f59e0b] focus:outline-none">
            <option value="">Todos os eventos</option>
            {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={langFilter} onChange={(e) => setLang(e.target.value as PresentationLanguage | "")}
            className="h-10 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[0.86rem] text-[#374151] focus:border-[#f59e0b] focus:outline-none">
            <option value="">Todos os idiomas</option>
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es">Español</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as TemplateStatus | "")}
            className="h-10 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[0.86rem] text-[#374151] focus:border-[#f59e0b] focus:outline-none">
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="draft">Rascunho</option>
            <option value="archived">Arquivado</option>
          </select>
          <select value={typeFilter} onChange={(e) => setType(e.target.value as "" | "official" | "personal")}
            className="h-10 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[0.86rem] text-[#374151] focus:border-[#f59e0b] focus:outline-none">
            <option value="">Oficial + Pessoal</option>
            <option value="official">Apenas Oficiais</option>
            <option value="personal">Apenas Pessoais</option>
          </select>
          {(query || eventFilter || langFilter || statusFilter || typeFilter) && (
            <button type="button"
              onClick={() => { setQuery(""); setEvt(""); setLang(""); setStatus(""); setType(""); }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 text-[0.82rem] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]">
              <FiX className="h-3.5 w-3.5" /> Limpar
            </button>
          )}
        </div>
        <p className="mt-3 text-[0.78rem] text-[#9ca3af]">
          {filtered.length} template{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Grid de cards ── */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] py-20 text-center">
          <FiBookOpen className="h-10 w-10 text-[#d1d5db]" />
          <div>
            <p className="text-[1rem] font-semibold text-[#6b7280]">Nenhum template encontrado</p>
            <p className="mt-1 text-[0.84rem] text-[#9ca3af]">
              Ajuste os filtros ou{" "}
              <Link to={ROUTE_PATHS.createPresentation} className="font-semibold text-[#d97706] hover:underline">
                crie uma apresentação
              </Link>{" "}
              e salve como template.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const canEdit = perms.canApproveContent() || t.createdBy === (user?.id ?? "");
            return (
              <TemplateCard
                key={t.id}
                template={t}
                canEdit={canEdit}
                onEdit={() => setEditTarget(t)}
                onDuplicate={() => handleDuplicate(t)}
                onShare={() => handleShare(t)}
                onArchive={() => handleArchive(t)}
                onUse={() => handleUse(t)}
              />
            );
          })}
        </div>
      )}

      {/* ── Dica de uso ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <FiArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
          <p className="text-[0.78rem] text-[#9ca3af]">
            Clique em <strong className="text-[#374151]">"Usar este Template"</strong> para iniciar o wizard de criação
            com a estrutura de seções já pré-configurada. Os conteúdos (projetos, indicadores) são escolhidos no wizard.
          </p>
        </div>
      )}
    </div>
  );
}
