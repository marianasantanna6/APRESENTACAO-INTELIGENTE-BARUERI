import { useEffect, useRef, useState } from "react";
import {
  FiAward,
  FiCalendar,
  FiExternalLink,
  FiLink,
  FiLink2,
  FiMapPin,
  FiTag,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import type { InstitutionalProject, ProjectSummary } from "../../types/project";
import { ProjectCategoryBadge } from "./ProjectCategoryBadge";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

type Props = {
  project: InstitutionalProject;
  allProjects?: ProjectSummary[];
  canEdit?: boolean;
  onClose: () => void;
  onUpdateRelated?: (projectId: string, relatedIds: string[]) => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ProjectViewModal({ project, allProjects = [], canEdit = false, onClose, onUpdateRelated }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [relatedIds, setRelatedIds] = useState<string[]>(project.relatedProjectIds ?? []);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const relatedProjects = allProjects.filter((p) => relatedIds.includes(p.id));
  const linkableProjects = allProjects.filter(
    (p) => p.id !== project.id && !relatedIds.includes(p.id),
  );

  useEffect(() => {
    dialogRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showLinkPicker) { setShowLinkPicker(false); return; }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, showLinkPicker]);

  async function handleLink(id: string) {
    const next = [...relatedIds, id];
    setRelatedIds(next);
    setShowLinkPicker(false);
    if (onUpdateRelated) {
      setSaving(true);
      await onUpdateRelated(project.id, next);
      setSaving(false);
    }
  }

  async function handleUnlink(id: string) {
    const next = relatedIds.filter((r) => r !== id);
    setRelatedIds(next);
    if (onUpdateRelated) {
      setSaving(true);
      await onUpdateRelated(project.id, next);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do projeto ${project.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#142133]/50 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Painel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_32px_80px_rgba(20,33,51,0.28)] focus:outline-none"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f1f5] px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              <span className="inline-flex items-center gap-1 text-[0.78rem] text-[#9ca3af]">
                <FiMapPin className="h-3 w-3" /> {project.mainDepartment}
              </span>
              {saving && (
                <span className="text-[0.72rem] text-[#9ca3af]">Salvando…</span>
              )}
            </div>
            <h2 className="mt-2 text-[1.2rem] font-bold text-[#1e1e1e]">
              {project.name}
            </h2>
            <p className="mt-1 text-[0.84rem] text-[#6b7280]">
              {project.shortDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="shrink-0 rounded-full p-2 text-[#6b7280] transition hover:bg-[#f3f4f6]"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* ── Corpo com scroll ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Descrição completa */}
          <section>
            <p className="text-[0.9rem] leading-relaxed text-[#374151]">
              {project.fullDescription}
            </p>
          </section>

          {/* Categorias */}
          <section>
            <SectionTitle icon={<FiTag />} title="Categorias" />
            <div className="mt-2 flex flex-wrap gap-2">
              {project.categories.map((cat) => (
                <ProjectCategoryBadge key={cat} category={cat} />
              ))}
            </div>
          </section>

          {/* Projetos Relacionados */}
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle icon={<FiLink2 />} title="Projetos Relacionados" />
              {canEdit && linkableProjects.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLinkPicker((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1675b8]/20 bg-[#eff6ff] px-3 py-1 text-[0.75rem] font-semibold text-[#1675b8] transition hover:bg-[#dbeafe]"
                  >
                    <FiLink className="h-3 w-3" />
                    Vincular projeto
                  </button>

                  {showLinkPicker && (
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(20,33,51,0.14)]">
                      <p className="border-b border-[#f0f1f5] px-3 py-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">
                        Selecionar projeto
                      </p>
                      <ul className="max-h-52 overflow-y-auto py-1">
                        {linkableProjects.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => handleLink(p.id)}
                              className="w-full px-3 py-2 text-left transition hover:bg-[#f8fafc]"
                            >
                              <p className="text-[0.82rem] font-semibold text-[#1e1e1e]">{p.name}</p>
                              <p className="text-[0.72rem] text-[#9ca3af]">{p.mainDepartment}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3">
              {relatedProjects.length === 0 ? (
                <p className="text-[0.82rem] text-[#9ca3af]">
                  {canEdit
                    ? "Nenhum projeto vinculado. Clique em \"Vincular projeto\" para associar."
                    : "Nenhum projeto relacionado cadastrado."}
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedProjects.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ProjectStatusBadge status={rel.status} />
                          <p className="text-[0.84rem] font-semibold text-[#1e1e1e] truncate">
                            {rel.name}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[0.72rem] text-[#9ca3af]">
                          {rel.mainDepartment} · {rel.categories.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleUnlink(rel.id)}
                          aria-label={`Desvincular ${rel.name}`}
                          className="shrink-0 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-[0.72rem] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]"
                        >
                          Desvincular
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Indicadores */}
          {project.indicators.length > 0 && (
            <section>
              <SectionTitle icon={<FiTrendingUp />} title="Indicadores" />
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.indicators.map((ind) => (
                  <div key={ind.id} className="rounded-xl bg-[#f8f9fc] p-3">
                    <p className="text-[1.1rem] font-bold text-[#1e1e1e]">
                      {ind.value}
                      {ind.unit && (
                        <span className="ml-1 text-[0.72rem] font-medium text-[#9ca3af]">
                          {ind.unit}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-[#6b7280]">{ind.label}</p>
                    <p className="mt-1 text-[0.68rem] text-[#9ca3af]">
                      {ind.source} · {ind.year}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tecnologias */}
          {project.technologies.length > 0 && (
            <section>
              <SectionTitle icon={<FiTag />} title="Tecnologias" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.technologies.map((t) => (
                  <span
                    key={t}
                    className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-[0.78rem] text-[#374151]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ODS */}
          {project.ods.length > 0 && (
            <section>
              <SectionTitle icon={<FiAward />} title="Objetivos de Desenvolvimento Sustentável (ODS)" />
              <div className="mt-2 flex flex-wrap gap-2">
                {project.ods.map((n) => (
                  <span
                    key={n}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d4ed8] text-[0.78rem] font-bold text-white shadow"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Prêmios */}
          {project.awards.length > 0 && (
            <section>
              <SectionTitle icon={<FiAward />} title="Prêmios e Reconhecimentos" />
              <div className="mt-2 space-y-2">
                {project.awards.map((aw) => (
                  <div key={aw.id} className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                    <p className="text-[0.86rem] font-semibold text-[#92400e]">
                      🏆 {aw.name} — {aw.organization} ({aw.year})
                    </p>
                    {aw.description && (
                      <p className="mt-1 text-[0.78rem] text-[#b45309]">{aw.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Links oficiais */}
          {project.officialLinks.length > 0 && (
            <section>
              <SectionTitle icon={<FiExternalLink />} title="Links Oficiais" />
              <div className="mt-2 flex flex-wrap gap-2">
                {project.officialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[0.8rem] font-medium text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                  >
                    <FiExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Metadados */}
          <section className="border-t border-[#f0f1f5] pt-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[0.78rem] text-[#9ca3af]">
              <span className="inline-flex items-center gap-1">
                <FiCalendar className="h-3 w-3" />
                Implementado em {formatDate(project.implementationDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiCalendar className="h-3 w-3" />
                Atualizado em {formatDate(project.lastUpdatedAt)}
              </span>
              <span>Versão {project.versionHistory.length}</span>
              <span>Área: {project.governmentArea}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[0.82rem] font-semibold uppercase tracking-wide text-[#6b7280]">
      <span className="h-3.5 w-3.5">{icon}</span>
      {title}
    </div>
  );
}
