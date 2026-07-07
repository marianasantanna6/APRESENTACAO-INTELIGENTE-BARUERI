import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiFolder,
  FiLayers,
  FiPlus,
} from "react-icons/fi";
import {
  AddToPresentationModal,
  ConfirmDeleteModal,
  EMPTY_FILTERS,
  ProjectCard,
  ProjectFiltersBar,
  ProjectViewModal,
  RoleBanner,
} from "../../components/InstitutionalProjects";
import type { ProjectFiltersState } from "../../components/InstitutionalProjects";
import { ProjectEditor } from "../../components/ProjectEditor";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { projectService } from "../../services/projectService";
import type { InstitutionalProject, ProjectSummary } from "../../types/project";
import { ROLE_LABELS } from "../../types/user";
import type { UserRole } from "../../types/user";

// ── Tipos locais ──────────────────────────────────────────────────────────────

type Toast = { id: number; type: "success" | "error"; message: string };
type ModalState =
  | { kind: "none" }
  | { kind: "view";              project: InstitutionalProject }
  | { kind: "delete";            projectId: string; projectName: string }
  | { kind: "addToPresentation"; projectId: string; projectName: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyFilters(
  list: ProjectSummary[],
  filters: ProjectFiltersState,
  userDepartment: string,
  canViewAll: boolean,
): ProjectSummary[] {
  let result = canViewAll ? list : list.filter((p) => p.mainDepartment === userDepartment);

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q),
    );
  }
  if (filters.category) {
    result = result.filter((p) => p.categories.includes(filters.category as never));
  }
  if (filters.status) {
    result = result.filter((p) => p.status === filters.status);
  }
  if (filters.department) {
    result = result.filter((p) => p.mainDepartment === filters.department);
  }
  return result;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function InstitutionalProjectsPage() {
  const { user } = useAuth();
  const perms = usePermissions();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFiltersState>(EMPTY_FILTERS);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Editor state
  const [editorProject, setEditorProject] = useState<InstitutionalProject | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Role resolvido para exibição no banner
  const resolvedRole = perms.resolvedRole ?? "publico-externo";
  const roleLabel = ROLE_LABELS[resolvedRole as UserRole] ?? "Desconhecido";

  // Carrega projetos
  useEffect(() => {
    setLoading(true);
    projectService
      .getProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  // Verifica acesso: público externo não entra aqui
  if (!perms.canViewProjects()) {
    return <AccessDenied roleLabel={roleLabel} />;
  }

  // Filtragem
  const canViewAll = perms.canViewAllPresentations();
  const userDepartment = user?.department ?? "";
  const filtered = useMemo(
    () => applyFilters(projects, filters, userDepartment, canViewAll),
    [projects, filters, userDepartment, canViewAll],
  );

  // Secretarias únicas para o dropdown
  const departments = useMemo(
    () => [...new Set(projects.map((p) => p.mainDepartment))].sort(),
    [projects],
  );

  // Estatísticas
  const stats = useMemo(
    () => ({
      total:    filtered.length,
      active:   filtered.filter((p) => p.status === "active").length,
      draft:    filtered.filter((p) => p.status === "draft").length,
      archived: filtered.filter((p) => p.status === "archived").length,
    }),
    [filtered],
  );

  // ── Toast helpers ──
  function toast(type: Toast["type"], message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  // ── Handlers ──
  async function handleView(id: string) {
    try {
      const full = await projectService.getProjectById(id);
      if (full) setModal({ kind: "view", project: full });
    } catch {
      toast("error", "Erro ao carregar detalhes do projeto.");
    }
  }

  async function handleArchive(id: string) {
    try {
      await projectService.archiveProject(id);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "archived" as const } : p)),
      );
      toast("success", "Projeto arquivado com sucesso.");
    } catch {
      toast("error", "Erro ao arquivar projeto.");
    }
  }

  async function handleDelete() {
    if (modal.kind !== "delete") return;
    try {
      await projectService.deleteProject(modal.projectId);
      setProjects((prev) => prev.filter((p) => p.id !== modal.projectId));
      const name = modal.projectName;
      setModal({ kind: "none" });
      toast("success", `"${name}" excluído com sucesso.`);
    } catch {
      toast("error", "Erro ao excluir projeto.");
    }
  }

  function handleApprove(id: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "active" as const } : p)),
    );
    toast("success", "Projeto aprovado e marcado como ativo.");
  }

  // ── Editor handlers ──
  function openNewEditor() {
    setEditorProject(null);
    setIsEditorOpen(true);
  }

  async function openEditEditor(id: string) {
    try {
      const full = await projectService.getProjectById(id);
      if (full) {
        setEditorProject(full);
        setIsEditorOpen(true);
      }
    } catch {
      toast("error", "Erro ao carregar projeto para edição.");
    }
  }

  function handleEditorSaved() {
    setIsEditorOpen(false);
    // Recarrega lista para refletir criação/edição
    projectService.getProjects().then(setProjects);
    toast("success", "Projeto salvo com sucesso.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Editor overlay ── */}
      {isEditorOpen && (
        <ProjectEditor
          initial={editorProject}
          onClose={() => setIsEditorOpen(false)}
          onSaved={handleEditorSaved}
        />
      )}

      {/* ── Toast container ── */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>

      {/* ── Modais ── */}
      {modal.kind === "view" && (
        <ProjectViewModal
          project={modal.project}
          allProjects={projects}
          canEdit={perms.canEditProject({ projectDepartment: modal.project.mainDepartment })}
          onClose={() => setModal({ kind: "none" })}
          onUpdateRelated={async (projectId, relatedIds) => {
            await projectService.updateProject(projectId, { relatedProjectIds: relatedIds });
            projectService.getProjects().then(setProjects);
          }}
        />
      )}
      {modal.kind === "delete" && (
        <ConfirmDeleteModal
          projectName={modal.projectName}
          onConfirm={handleDelete}
          onCancel={() => setModal({ kind: "none" })}
        />
      )}
      {modal.kind === "addToPresentation" && (
        <AddToPresentationModal
          projectId={modal.projectId}
          projectName={modal.projectName}
          onClose={() => setModal({ kind: "none" })}
          onSuccess={(msg) => toast("success", msg)}
        />
      )}

      {/* ── Cabeçalho da área ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6fa8d6,#4f84c4)]">
              <FiLayers className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-[1.5rem] font-bold text-[#1e1e1e]">
              Projetos Institucionais
            </h1>
          </div>
          <p className="mt-1.5 text-[0.88rem] text-[#6b7280]">
            Gerencie os projetos e iniciativas do município de Barueri.
          </p>
        </div>

        {perms.canCreateProject() && (
          <button
            type="button"
            onClick={openNewEditor}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#6fa8d6,#4f84c4)] px-4 py-2.5 text-[0.9rem] font-semibold text-white shadow-[0_6px_20px_rgba(97,159,208,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(97,159,208,0.5)]"
          >
            <FiPlus className="h-4.5 w-4.5" />
            Novo Projeto
          </button>
        )}
      </header>

      {/* ── Banner de cargo ── */}
      {user && (
        <RoleBanner
          role={resolvedRole as UserRole}
          userName={user.name}
          department={userDepartment}
        />
      )}

      {/* ── Cards de estatísticas ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} color="text-[#1e1e1e]" />
        <StatCard label="Ativos" value={stats.active} color="text-[#166534]" />
        <StatCard label="Rascunhos" value={stats.draft} color="text-[#92400e]" />
        <StatCard label="Arquivados" value={stats.archived} color="text-[#475569]" />
      </div>

      {/* ── Filtros ── */}
      <div className="rounded-2xl border border-[#e8e9f0] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
        <ProjectFiltersBar
          filters={filters}
          departments={departments}
          onChange={setFilters}
          resultCount={filtered.length}
        />
      </div>

      {/* ── Grid de projetos ── */}
      {loading ? (
        <ProjectSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const canEdit               = perms.canEditProject({ projectDepartment: project.mainDepartment });
            const canDelete             = perms.canManageUsers();
            const canArchive            = perms.canArchiveProject();
            const canApprove            = perms.canApproveContent();
            const canAddToPresentation  = perms.canCreateProject();

            return (
              <ProjectCard
                key={project.id}
                project={project}
                actions={{ canEdit, canArchive, canDelete, canApprove, canAddToPresentation }}
                onView={handleView}
                onEdit={openEditEditor}
                onArchive={handleArchive}
                onDelete={(id) => {
                  const name = projects.find((p) => p.id === id)?.name ?? "";
                  setModal({ kind: "delete", projectId: id, projectName: name });
                }}
                onApprove={handleApprove}
                onAddToPresentation={(id) => {
                  const name = projects.find((p) => p.id === id)?.name ?? "";
                  setModal({ kind: "addToPresentation", projectId: id, projectName: name });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#e8e9f0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(20,33,51,0.05)]">
      <p className={`text-[1.6rem] font-bold leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-[0.78rem] text-[#9ca3af]">{label}</p>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando projetos">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-2xl border border-[#e8e9f0] bg-[#f3f4f6]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] py-16 text-center">
      <FiFolder className="h-10 w-10 text-[#d1d5db]" />
      <div>
        <p className="text-[1rem] font-semibold text-[#6b7280]">Nenhum projeto encontrado</p>
        <p className="mt-1 text-[0.84rem] text-[#9ca3af]">
          Tente ajustar os filtros ou criar um novo projeto.
        </p>
      </div>
    </div>
  );
}

function AccessDenied({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fef2f2]">
        <FiAlertCircle className="h-8 w-8 text-[#b91c1c]" />
      </div>
      <div>
        <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">Acesso negado</h2>
        <p className="mt-2 max-w-xs text-[0.88rem] text-[#6b7280]">
          Seu perfil <strong>{roleLabel}</strong> não possui permissão para acessar a área de
          Projetos Institucionais.
        </p>
      </div>
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(20,33,51,0.16)] text-[0.86rem] font-medium text-white ${
        t.type === "success" ? "bg-[#166534]" : "bg-[#b91c1c]"
      }`}
    >
      {t.type === "success"
        ? <FiCheckCircle className="h-4 w-4 shrink-0" />
        : <FiAlertCircle className="h-4 w-4 shrink-0" />}
      {t.message}
    </div>
  );
}
