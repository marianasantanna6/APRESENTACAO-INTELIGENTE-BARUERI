/**
 * ProjectEditor — Editor de Projetos Institucionais
 *
 * Layout: overlay full-screen com navegação lateral não-linear.
 * Cada seção é um card expansível com indicador de completude.
 * Auto-save ativado 2 s após qualquer mudança.
 */

import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAward,
  FiCheck,
  FiClock,
  FiFileText,
  FiGlobe,
  FiImage,
  FiLink,
  FiLoader,
  FiTag,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import type { InstitutionalProject } from "../../types/project";
import { useAuth } from "../../context/AuthContext";
import { AwardsSection } from "./sections/AwardsSection";
import { ClassificationSection } from "./sections/ClassificationSection";
import { IdentitySection } from "./sections/IdentitySection";
import { IndicatorsSection } from "./sections/IndicatorsSection";
import { LinksSection } from "./sections/LinksSection";
import { MediaSection } from "./sections/MediaSection";
import { OdsSection } from "./sections/OdsSection";
import { useProjectEditor } from "./useProjectEditor";
import type { SaveStatus } from "./useProjectEditor";

// ─── Nav sections ─────────────────────────────────────────────────────────────

type NavSection = {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  required?: boolean;
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initial: InstitutionalProject | null; // null → criação
  onClose: () => void;
  onSaved: () => void;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProjectEditor({ initial, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const userId = user?.id ?? "unknown";
  const department = user?.department ?? "";

  const ed = useProjectEditor(initial, userId, department);
  const [activeSection, setActiveSection] = useState("section-identity");
  const mainRef = useRef<HTMLDivElement>(null);

  // Fecha com Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Intersection observer — destaca seção ativa no nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { root: mainRef.current, rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    const sections = mainRef.current?.querySelectorAll("section[id]");
    sections?.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }

  async function handleSave() {
    const ok = await ed.triggerSave("manual");
    if (ok) onSaved();
  }

  // Nav sections com contagem dinâmica
  const navSections: NavSection[] = [
    {
      id: "section-identity",
      label: "Identidade",
      icon: <FiFileText className="h-4 w-4" />,
      count: [ed.draft.name, ed.draft.shortDescription, ed.draft.fullDescription].filter(Boolean).length,
      required: true,
    },
    {
      id: "section-classification",
      label: "Classificação",
      icon: <FiTag className="h-4 w-4" />,
      count: ed.draft.categories.length,
      required: true,
    },
    {
      id: "section-indicators",
      label: "Indicadores",
      icon: <FiTrendingUp className="h-4 w-4" />,
      count: ed.draft.indicators.length,
    },
    {
      id: "section-media",
      label: "Mídia",
      icon: <FiImage className="h-4 w-4" />,
      count: ed.draft.images.length + ed.draft.videos.length,
    },
    {
      id: "section-ods",
      label: "ODS",
      icon: <FiGlobe className="h-4 w-4" />,
      count: ed.draft.ods.length,
    },
    {
      id: "section-links",
      label: "Links e Fontes",
      icon: <FiLink className="h-4 w-4" />,
      count: ed.draft.officialLinks.length + ed.draft.sources.length,
    },
    {
      id: "section-awards",
      label: "Prêmios",
      icon: <FiAward className="h-4 w-4" />,
      count: ed.draft.awards.length,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96)_0%,rgba(239,240,250,0.98)_100%)]"
      role="dialog"
      aria-modal="true"
      aria-label={ed.isNew ? "Novo projeto" : `Editar: ${ed.draft.name || "Projeto"}`}
    >
      {/* ── Barra de topo ── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-[#e5e7eb] bg-white/90 px-6 py-3 shadow-[0_2px_8px_rgba(20,33,51,0.06)] backdrop-blur-sm">
        {/* Título editável inline */}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={ed.draft.name}
            onChange={(e) => ed.patch({ name: e.target.value })}
            placeholder={ed.isNew ? "Nome do projeto…" : ""}
            aria-label="Nome do projeto"
            className="w-full truncate bg-transparent text-[1.1rem] font-bold text-[#1e1e1e] placeholder:text-[#d1d5db] focus:outline-none"
          />
          <p className="text-[0.74rem] text-[#9ca3af]">
            {ed.isNew ? "Novo projeto" : `Editando · versão ${(ed.draft.versionHistory?.length ?? 0) + 1}`}
          </p>
        </div>

        {/* Status do auto-save */}
        <SaveIndicator status={ed.saveStatus} lastSaved={ed.lastSaved} isDirty={ed.isDirty} />

        {/* Ações */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => ed.triggerSave("manual")}
            disabled={ed.saveStatus === "saving"}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-[0.86rem] font-semibold text-[#374151] transition hover:bg-[#f9fafb] disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={ed.saveStatus === "saving"}
            className="rounded-xl bg-[linear-gradient(135deg,#6fa8d6,#4f84c4)] px-4 py-2 text-[0.86rem] font-semibold text-white shadow-[0_4px_16px_rgba(97,159,208,0.4)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {ed.saveStatus === "saving" ? "Salvando…" : ed.isNew ? "Criar projeto" : "Salvar alterações"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar editor"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#1e1e1e]"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Corpo: nav lateral + conteúdo ── */}
      <div className="flex min-h-0 flex-1">
        {/* Nav lateral */}
        <nav
          aria-label="Seções do editor"
          className="hidden w-56 shrink-0 overflow-y-auto border-r border-[#e8e9f0] bg-white/60 px-3 py-6 md:flex md:flex-col"
        >
          <p className="mb-3 px-2 text-[0.7rem] font-bold uppercase tracking-widest text-[#9ca3af]">
            Seções
          </p>
          <div className="space-y-1">
            {navSections.map((sec) => {
              const isActive = activeSection === sec.id;
              const isComplete = (sec.count ?? 0) > 0;
              const hasError = sec.required && !isComplete;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollTo(sec.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[0.84rem] font-medium transition ${
                    isActive
                      ? "bg-[#eff6ff] text-[#1d4ed8] shadow-sm"
                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1e1e1e]"
                  }`}
                >
                  <span className={isActive ? "text-[#1d4ed8]" : "text-[#9ca3af]"}>
                    {sec.icon}
                  </span>
                  <span className="flex-1 truncate">{sec.label}</span>
                  {/* Indicador de completude */}
                  {hasError ? (
                    <span className="h-2 w-2 rounded-full bg-[#fca5a5]" />
                  ) : isComplete ? (
                    <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="mt-auto pt-6">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 space-y-1.5">
              <p className="text-[0.68rem] font-bold uppercase tracking-wide text-[#9ca3af]">Legenda</p>
              <div className="flex items-center gap-2 text-[0.74rem] text-[#6b7280]">
                <span className="h-2 w-2 rounded-full bg-[#4ade80]" /> Preenchido
              </div>
              <div className="flex items-center gap-2 text-[0.74rem] text-[#6b7280]">
                <span className="h-2 w-2 rounded-full bg-[#fca5a5]" /> Obrigatório
              </div>
            </div>
          </div>
        </nav>

        {/* Conteúdo principal com scroll */}
        <div
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
        >
          {/* Erros de validação */}
          {Object.keys(ed.errors).length > 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
              <FiAlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#b91c1c]" />
              <div>
                <p className="text-[0.84rem] font-bold text-[#b91c1c]">Corrija os campos obrigatórios:</p>
                <ul className="mt-1 space-y-0.5 text-[0.8rem] text-[#991b1b]">
                  {Object.values(ed.errors).map((msg, i) => (
                    <li key={i}>• {msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-4">
            <IdentitySection
              name={ed.draft.name}
              shortDescription={ed.draft.shortDescription}
              fullDescription={ed.draft.fullDescription}
              status={ed.draft.status}
              implementationDate={ed.draft.implementationDate}
              errors={ed.errors}
              onChange={(field, value) => ed.patch({ [field]: value } as never)}
              onStatusChange={ed.setStatus}
            />

            <ClassificationSection
              categories={ed.draft.categories}
              governmentArea={ed.draft.governmentArea}
              mainDepartment={ed.draft.mainDepartment}
              relatedDepartments={ed.draft.relatedDepartments}
              technologies={ed.draft.technologies}
              keywords={ed.draft.keywords}
              targetAudience={ed.draft.targetAudience}
              errors={ed.errors}
              onToggleCategory={ed.toggleCategory}
              onAreaChange={ed.setGovernmentArea}
              onFieldChange={(f, v) => ed.patch({ [f]: v } as never)}
              onAddTag={ed.addTag}
              onRemoveTag={ed.removeTag}
            />

            <IndicatorsSection
              indicators={ed.draft.indicators}
              onAdd={ed.addIndicator}
              onUpdate={ed.updateIndicator}
              onRemove={ed.removeIndicator}
            />

            <MediaSection
              images={ed.draft.images}
              videos={ed.draft.videos}
              onAddImage={ed.addImage}
              onUpdateImage={ed.updateImage}
              onRemoveImage={ed.removeImage}
              onSetPrimary={ed.setPrimaryImage}
              onAddVideo={ed.addVideo}
              onUpdateVideo={ed.updateVideo}
              onRemoveVideo={ed.removeVideo}
            />

            <OdsSection
              selected={ed.draft.ods}
              onToggle={ed.toggleOds}
            />

            <LinksSection
              links={ed.draft.officialLinks}
              sources={ed.draft.sources}
              onAddLink={ed.addLink}
              onUpdateLink={ed.updateLink}
              onRemoveLink={ed.removeLink}
              onAddSource={(v) => ed.addTag("sources", v)}
              onRemoveSource={(v) => ed.removeTag("sources", v)}
            />

            <AwardsSection
              awards={ed.draft.awards}
              onAdd={ed.addAward}
              onUpdate={ed.updateAward}
              onRemove={ed.removeAward}
            />

            {/* Espaçamento final */}
            <div className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SaveIndicator ────────────────────────────────────────────────────────────

function SaveIndicator({
  status,
  lastSaved,
  isDirty,
}: {
  status: SaveStatus;
  lastSaved: Date | null;
  isDirty: boolean;
}) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#6b7280]">
        <FiLoader className="h-3.5 w-3.5 animate-spin" /> Salvando…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#166534]">
        <FiCheck className="h-3.5 w-3.5" /> Salvo
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#b91c1c]">
        <FiAlertCircle className="h-3.5 w-3.5" /> Falha ao salvar
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#9ca3af]">
        <FiClock className="h-3.5 w-3.5" /> Alterações não salvas
      </span>
    );
  }
  if (lastSaved) {
    const time = lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return (
      <span className="flex items-center gap-1.5 text-[0.78rem] text-[#9ca3af]">
        <FiCheck className="h-3.5 w-3.5" /> Salvo às {time}
      </span>
    );
  }
  return null;
}
