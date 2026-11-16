import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFolder,
  FiMaximize,
  FiPlus,
  FiSettings,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminConsole } from "../../context/AdminConsoleContext";
import { authFetch } from "../../lib/apiClient";
import { projectService } from "../../services/projectService";
import type { ProjectSummary } from "../../types/project";
import { ROUTE_PATHS } from "../../router/paths";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabId = "projetos" | "membros";

type RoleEntry = { id: string; user: string; sector: string; team: string | null };

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:    { label: "Aguardando aprovação", cls: "bg-[#fef9c3] text-[#92400e]", icon: FiClock },
  active:   { label: "Ativo",               cls: "bg-[#dcfce7] text-[#166534]", icon: FiCheck },
  archived: { label: "Arquivado",           cls: "bg-[#f3f4f6] text-[#6b7280]", icon: FiFolder },
} as const;

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const { employees } = useAdminConsole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("projetos");

  const team = user?.teams?.find((t) => t.id === teamId);
  const isApproverOnly = !!(team?.approver && !team?.areaManager);
  const isManager = !!(team?.areaManager || user?.head_manager || user?.sectorManager);
  const availableTabs: TabId[] = isManager ? ["projetos", "membros"] : ["projetos"];

  // Redirect pure approver to /times (approval queue)
  useEffect(() => {
    if (isApproverOnly) navigate(ROUTE_PATHS.teams, { replace: true });
  }, [isApproverOnly, navigate]);

  if (!user || !teamId) return null;

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FiAlertCircle className="mb-3 h-10 w-10 text-[#b91c1c]" />
        <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">Time não encontrado</h2>
        <p className="mt-1 text-[0.88rem] text-[#6b7280]">
          Você não está neste time ou ele não existe.
        </p>
        <Link
          to={ROUTE_PATHS.presentations}
          className="mt-4 inline-flex items-center gap-2 text-[0.88rem] font-semibold text-[#1675b8] hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
    );
  }

  if (isApproverOnly) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to={ROUTE_PATHS.presentations}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e0eaf3] bg-white text-[#6b7280] shadow-sm transition hover:-translate-y-0.5 hover:text-[#1675b8]"
          aria-label="Voltar"
        >
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[1.4rem] font-bold text-[#1e1e1e]">{team.name}</h1>
              <p className="mt-0.5 text-[0.84rem] text-[#6b7280]">{team.sectorName}</p>
            </div>
            {!isApproverOnly && (
              <Link
                to={`${ROUTE_PATHS.createPresentation}?teamId=${teamId}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#4f84c4,#1675b8)] px-4 py-2.5 text-[0.88rem] font-semibold text-white shadow-[0_6px_20px_rgba(22,117,184,0.3)] transition hover:-translate-y-0.5"
              >
                <FiPlus className="h-4 w-4" />
                Nova Apresentação
              </Link>
            )}
          </div>

          {/* Role badge */}
          <div className="mt-2">
            {team.areaManager ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[0.76rem] font-semibold text-[#15803d]">
                <FiSettings className="h-3 w-3" />
                Gerente de Área
              </span>
            ) : team.approver ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[0.76rem] font-semibold text-[#1d4ed8]">
                <FiCheck className="h-3 w-3" />
                Aprovador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.76rem] font-semibold text-[#475569]">
                <FiUser className="h-3 w-3" />
                Membro
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs (only shown when manager) */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1 rounded-xl border border-[#e0eaf3] bg-[#f8fafd] p-1">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-[0.88rem] font-semibold transition ${
                activeTab === tab
                  ? "bg-white text-[#1675b8] shadow-sm"
                  : "text-[#6b7280] hover:text-[#1e1e1e]"
              }`}
            >
              {tab === "projetos" ? "Projetos" : "Membros"}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {activeTab === "projetos" && (
        <ProjectsTab teamId={teamId} />
      )}
      {activeTab === "membros" && (
        <MembersTab teamId={teamId} team={team} employees={employees} />
      )}
    </div>
  );
}

// ─── Projects tab ───────────────────────────────────────────────────────────────

function ProjectsTab({ teamId }: { teamId: string }) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    projectService
      .getProjects({ teamId })
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-[#e8e9f0] bg-[#f3f4f6]" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d1d5db] bg-[#f9fafb] py-16 text-center">
        <FiFolder className="mb-3 h-10 w-10 text-[#d1d5db]" />
        <p className="text-[0.95rem] font-semibold text-[#6b7280]">Nenhuma apresentação ainda</p>
        <p className="mt-1 text-[0.84rem] text-[#9ca3af]">
          Clique em "Nova Apresentação" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

// ─── Project card ───────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[project.status];
  const StatusIcon = cfg.icon;

  function goToPresentation() {
    const params = new URLSearchParams({ pid: project.id });
    if (project.slidesUrl) params.set("dlUrl", project.slidesUrl);
    navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToPresentation}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") goToPresentation(); }}
      className="group flex cursor-pointer flex-col rounded-2xl border border-[#e8e9f0] bg-white p-5 shadow-[0_2px_8px_rgba(20,33,51,0.05)] transition hover:-translate-y-0.5 hover:border-[#bcd5ef] hover:shadow-[0_6px_20px_rgba(22,117,184,0.1)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex-1 text-[0.95rem] font-semibold leading-snug text-[#1e1e1e] line-clamp-2">
          {project.name}
        </h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${cfg.cls}`}
        >
          <StatusIcon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      {project.shortDescription && (
        <p className="mt-2 text-[0.82rem] text-[#6b7280] line-clamp-2">
          {project.shortDescription}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="flex items-center gap-2 text-[0.76rem] text-[#9ca3af]">
          <FiCalendar className="h-3 w-3 shrink-0" />
          <span>
            {new Date(project.lastUpdatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-lg bg-[#eff6ff] px-2.5 py-1 text-[0.76rem] font-semibold text-[#1675b8] transition group-hover:bg-[#1675b8] group-hover:text-white">
          <FiMaximize className="h-3 w-3" />
          Ver apresentação
        </span>
      </div>
    </div>
  );
}

// ─── Members tab ────────────────────────────────────────────────────────────────

type EmployeeEntry = { id: string; name: string; email: string };

function MembersTab({
  teamId,
  team,
  employees,
}: {
  teamId: string;
  team: { id: string; name: string; sectorId: string };
  employees: EmployeeEntry[];
}) {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    authFetch("/api/users-role")
      .then((r) => (r.ok ? (r.json() as Promise<RoleEntry[]>) : Promise.resolve([])))
      .then(setRoles)
      .catch(() => setError("Erro ao carregar membros."))
      .finally(() => setLoading(false));
  }, [teamId]);

  const teamRoles = useMemo(
    () => roles.filter((r) => r.team === teamId),
    [roles, teamId],
  );

  const members = useMemo(
    () =>
      teamRoles.map((r) => {
        const emp = employees.find((e) => e.id === r.user);
        return { roleId: r.id, name: emp?.name ?? `Usuário #${r.user}`, email: emp?.email ?? "" };
      }),
    [teamRoles, employees],
  );

  async function handleRemove(roleId: string) {
    setRemovingId(roleId);
    setError(null);
    try {
      const res = await authFetch(`/api/users-role/${roleId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message ?? "Erro ao remover membro.");
        return;
      }
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch {
      setError("Erro ao remover membro.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="text-[0.88rem] text-[#9ca3af]">Carregando membros...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8e9f0] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[0.95rem] font-bold text-[#1e1e1e]">
          Membros do time
          <span className="ml-2 text-[0.82rem] font-normal text-[#9ca3af]">
            {members.length} {members.length === 1 ? "membro" : "membros"}
          </span>
        </h2>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FiUsers className="mb-2 h-8 w-8 text-[#d1d5db]" />
          <p className="text-[0.88rem] text-[#6b7280]">Nenhum membro neste time.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f3f4f6]">
          {members.map((m) => (
            <li key={m.roleId} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569]">
                  <FiUser className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[0.88rem] font-semibold text-[#1e1e1e]">{m.name}</p>
                  {m.email && <p className="text-[0.76rem] text-[#9ca3af]">{m.email}</p>}
                </div>
              </div>
              <button
                type="button"
                disabled={removingId === m.roleId}
                onClick={() => handleRemove(m.roleId)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#fee2e2] hover:text-[#b91c1c] disabled:opacity-50"
                title="Remover do time"
                aria-label={`Remover ${m.name}`}
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 text-[0.82rem] text-[#b91c1c]">{error}</p>
      )}

      <p className="mt-4 text-[0.76rem] text-[#9ca3af]">
        Remover um membro não desativa a conta, apenas remove do time.
      </p>
    </div>
  );
}
