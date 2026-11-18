import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiEdit2,
  FiEye,
  FiFolder,
  FiGrid,
  FiPlus,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminConsole } from "../../context/AdminConsoleContext";
import { authFetch } from "../../lib/apiClient";
import { canAccessAdminModules, canCreatePresentations } from "../../lib/accessControl";
import type { AuthSessionUser } from "../../types/auth";
import type { EmployeeDirectoryEntry, SetorEntry, TimeEntry } from "../../types/admin";
import type { ProjectStatus } from "../../types/project";
import { ROUTE_PATHS } from "../../router/paths";

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserTeam = NonNullable<AuthSessionUser["teams"]>[number];

type SectorGroup = {
  sectorId: string;
  sectorName: string;
  teams: UserTeam[];
};

type RoleEntry = { id: string; user: string; sector: string; team: string | null };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function groupTeamsBySector(teams: UserTeam[]): SectorGroup[] {
  const map = new Map<string, SectorGroup>();
  for (const t of teams) {
    if (!map.has(t.sectorId)) {
      map.set(t.sectorId, { sectorId: t.sectorId, sectorName: t.sectorName, teams: [] });
    }
    map.get(t.sectorId)!.teams.push(t);
  }
  return Array.from(map.values());
}

// ─── Manager: Minhas Apresentações ────────────────────────────────────────────

type ApiProject = {
  id: string;
  name: string;
  short_description: string | null;
  status: number;
  last_update: string | null;
  team: string | null;
  slides_url: string | null;
  family: string | null;
  version: string | null;
};

type MappedProject = {
  id: string;
  name: string;
  shortDescription: string;
  status: ProjectStatus;
  lastUpdatedAt: string;
  teamId: string | null;
  slidesUrl: string | null;
  family: string | null;
  version: string | null;
};

function mapStatus(s: number): ProjectStatus {
  if (s === 2) return "active";
  if (s === 3) return "archived";
  return "draft";
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; cls: string }> = {
  draft:    { label: "Pendente",   cls: "bg-[#fef9c3] text-[#92400e]" },
  active:   { label: "Aprovado",   cls: "bg-[#dcfce7] text-[#166534]" },
  archived: { label: "Arquivado",  cls: "bg-[#f3f4f6] text-[#6b7280]" },
};

type StatusFilter = "all" | ProjectStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all",      label: "Todos" },
  { key: "draft",    label: "Pendentes" },
  { key: "active",   label: "Aprovados" },
  { key: "archived", label: "Arquivados" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function ManagerProjectsView() {
  const { user } = useAuth();
  const { times } = useAdminConsole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<MappedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = canCreatePresentations(user);
  const statusFilter = (searchParams.get("status") ?? "all") as StatusFilter;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    authFetch("/api/projects?mine=true")
      .then((r) => (r.ok ? (r.json() as Promise<ApiProject[]>) : Promise.resolve([])))
      .then((data) => {
        setProjects(data.map((p) => ({
          id: p.id,
          name: p.name,
          shortDescription: p.short_description ?? "",
          status: mapStatus(p.status),
          lastUpdatedAt: p.last_update ?? "",
          teamId: p.team,
          slidesUrl: p.slides_url,
          family: p.family,
          version: p.version,
        })));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [user]);

  const teamNameById = useMemo(
    () => new Map(times.map((t) => [t.id, t.nome])),
    [times],
  );

  const latestByFamily = useMemo(() => {
    const map = new Map<string, MappedProject>();
    for (const p of projects) {
      const key = p.family ?? p.id;
      const existing = map.get(key);
      if (!existing || (p.version ?? "1") > (existing.version ?? "1")) map.set(key, p);
    }
    return Array.from(map.values());
  }, [projects]);

  const filtered = useMemo(
    () => statusFilter === "all" ? latestByFamily : latestByFamily.filter((p) => p.status === statusFilter),
    [latestByFamily, statusFilter],
  );

  function handleStatusTab(key: StatusFilter) {
    setSearchParams(key === "all" ? {} : { status: key }, { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#eff6ff] px-3 py-1.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#1675b8]">
            <FiFolder className="h-3.5 w-3.5" />
            Projetos
          </div>
          <h1 className="text-[1.9rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.3rem]">
            Minhas Apresentações
          </h1>
          <p className="mt-1 text-[0.92rem] text-[#6b7280]">
            {loading ? "Carregando..." : `${latestByFamily.length} apresentaç${latestByFamily.length !== 1 ? "ões" : "ão"} no total`}
          </p>
        </div>
        {canCreate && (
          <Link
            to={ROUTE_PATHS.createPresentation}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#1675b8] px-5 py-2.5 text-[0.92rem] font-semibold text-white shadow-[0_6px_20px_rgba(22,117,184,0.28)] transition hover:-translate-y-0.5 sm:self-auto"
          >
            <FiPlus className="h-4 w-4" />
            Nova Apresentação
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = tab.key === statusFilter;
          const count = tab.key === "all" ? latestByFamily.length : latestByFamily.filter((p) => p.status === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[0.86rem] font-semibold transition-all ${
                isActive
                  ? "border-[#1675b8] bg-[#1675b8] text-white shadow-[0_4px_12px_rgba(22,117,184,0.25)]"
                  : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#1675b8] hover:text-[#1675b8]"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[0.72rem] font-bold ${isActive ? "bg-white/25 text-white" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1675b8] border-t-transparent" />
          <span className="ml-3 text-[1rem] font-medium text-[#6b7280]">Carregando apresentações...</span>
        </div>
      )}

      {!loading && latestByFamily.length === 0 && (
        <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#d1d5db] bg-[#f9fafb] py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eff6ff]">
            <FiFolder className="h-8 w-8 text-[#1675b8]" />
          </div>
          <div>
            <p className="text-[1.1rem] font-bold text-[#374151]">Nenhuma apresentação</p>
            <p className="mt-1 text-[0.92rem] text-[#9ca3af]">
              {canCreate ? "Crie sua primeira apresentação para começar." : "Você ainda não possui apresentações."}
            </p>
          </div>
          {canCreate && (
            <Link
              to={ROUTE_PATHS.createPresentation}
              className="inline-flex items-center gap-2 rounded-full bg-[#1675b8] px-6 py-3 text-[0.92rem] font-semibold text-white shadow-[0_6px_20px_rgba(22,117,184,0.28)] transition hover:-translate-y-0.5"
            >
              <FiPlus className="h-4 w-4" />
              Nova Apresentação
            </Link>
          )}
        </div>
      )}

      {!loading && latestByFamily.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[#e5e7eb] py-14 text-center">
          <p className="text-[0.95rem] font-medium text-[#9ca3af]">Nenhuma apresentação com este filtro.</p>
          <button type="button" onClick={() => handleStatusTab("all")} className="text-[0.88rem] font-semibold text-[#1675b8] underline">
            Ver todas
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const statusCfg = STATUS_CONFIG[project.status];
            const teamName = project.teamId ? (teamNameById.get(project.teamId) ?? null) : null;
            return (
              <div
                key={project.id}
                className="flex flex-col rounded-[20px] border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_12px_rgba(20,33,51,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,33,51,0.12)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                  {teamName && (
                    <span className="max-w-[120px] truncate text-[0.72rem] text-[#9ca3af]" title={teamName}>
                      {teamName}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 line-clamp-2 flex-1 text-[0.95rem] font-bold text-[#1e1e1e]">
                  {project.name}
                </h3>
                {project.shortDescription && (
                  <p className="mb-3 line-clamp-2 text-[0.82rem] text-[#6b7280]">{project.shortDescription}</p>
                )}
                <div className="mb-4 flex items-center gap-1.5 text-[0.78rem] text-[#9ca3af]">
                  <FiClock className="h-3 w-3 shrink-0" />
                  {formatDate(project.lastUpdatedAt)}
                  {project.version && (
                    <span className="ml-auto rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[0.7rem] font-semibold text-[#64748b]">
                      v{project.version}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {project.slidesUrl && (
                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTE_PATHS.generatedPresentation}?pid=${project.id}&returnTo=${ROUTE_PATHS.presentations}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#1675b8] bg-[rgba(22,117,184,0.06)] py-2 text-[0.82rem] font-semibold text-[#1675b8] transition hover:bg-[rgba(22,117,184,0.12)]"
                    >
                      <FiEye className="h-3.5 w-3.5" />
                      Ver
                    </button>
                  )}
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => navigate(`${ROUTE_PATHS.createPresentation}?edit=${project.family ?? project.id}`)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#e5e7eb] py-2 text-[0.82rem] font-semibold text-[#6b7280] transition hover:border-[#1675b8] hover:text-[#1675b8]"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                  {!project.slidesUrl && !canCreate && (
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#f3f4f6] py-2 text-[0.82rem] text-[#9ca3af]">
                      Sem apresentação gerada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const { setores, times, employees } = useAdminConsole();

  if (!user) return null;

  // Managers veem suas próprias apresentações; usuários comuns veem seus times
  if (canAccessAdminModules(user)) {
    return <ManagerProjectsView />;
  }

  if (user.head_manager) {
    return <HeadManagerView setores={setores} times={times} employees={employees} />;
  }

  if (!user.teams || user.teams.length === 0) {
    return <NoTeamsState />;
  }

  const sectors = groupTeamsBySector(user.teams);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f84c4,#1675b8)]">
            <FiGrid className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="text-[1.5rem] font-bold text-[#1e1e1e]">Meus Times</h1>
        </div>
        <p className="mt-1.5 text-[0.88rem] text-[#6b7280]">
          Selecione um time para criar ou aprovar apresentações.
        </p>
      </header>

      <div className="space-y-6">
        {sectors.map((sector) => (
          <SectorCard
            key={sector.sectorId}
            sector={sector}
            user={user}
            employees={employees}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SectorCard ────────────────────────────────────────────────────────────────

function SectorCard({
  sector,
  user,
  employees,
}: {
  sector: SectorGroup;
  user: AuthSessionUser;
  employees: EmployeeDirectoryEntry[];
}) {
  const navigate = useNavigate();
  const [adminTeamId, setAdminTeamId] = useState<string | null>(null);

  // Gear icon shows if user is head_manager, sectorManager, or areaManager in any team of this sector
  const canAdmin =
    user.head_manager ||
    user.sectorManager ||
    sector.teams.some((t) => t.areaManager);

  function handleTeamClick(team: UserTeam) {
    if (team.approver && !team.areaManager) {
      // Pure approver for this team → approval queue
      navigate(ROUTE_PATHS.teams);
    } else {
      // Can create → team detail page (shows existing projects + "Nova" button)
      navigate(ROUTE_PATHS.teamDetail.replace(":teamId", team.id));
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e0eaf3] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)]">
      {/* Sector header */}
      <div className="flex items-center justify-between bg-[linear-gradient(135deg,#f0f7ff,#e8f4fb)] px-6 py-4">
        <div>
          <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">{sector.sectorName}</h2>
          <p className="mt-0.5 text-[0.8rem] text-[#6b7280]">
            {sector.teams.length} {sector.teams.length === 1 ? "time" : "times"}
          </p>
        </div>
        {canAdmin && (
          <button
            type="button"
            onClick={() => setAdminTeamId(sector.teams[0]?.id ?? null)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c9dff0] bg-white text-[#4f84c4] shadow-[0_2px_8px_rgba(79,132,196,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(79,132,196,0.25)]"
            title="Administrar setor"
            aria-label={`Administrar ${sector.sectorName}`}
          >
            <FiSettings className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Teams grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sector.teams.map((team) => (
            <TeamSquare
              key={team.id}
              team={team}
              onClick={() => handleTeamClick(team)}
            />
          ))}
        </div>
      </div>

      {/* Admin modal */}
      {adminTeamId !== null && (
        <SectorAdminModal
          sector={sector}
          initialTeamId={adminTeamId}
          user={user}
          employees={employees}
          onClose={() => setAdminTeamId(null)}
        />
      )}
    </div>
  );
}

// ─── TeamSquare ────────────────────────────────────────────────────────────────

function TeamSquare({ team, onClick }: { team: UserTeam; onClick: () => void }) {
  const isApproverOnly = team.approver && !team.areaManager;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center rounded-xl border border-[#e0eaf3] bg-[#f8fafd] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#4f84c4] hover:bg-white hover:shadow-[0_6px_20px_rgba(79,132,196,0.15)] focus:outline-none focus:ring-2 focus:ring-[#4f84c4]/30"
    >
      {/* Icon background */}
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
          isApproverOnly
            ? "bg-[linear-gradient(135deg,#dbeafe,#bfdbfe)]"
            : team.areaManager
            ? "bg-[linear-gradient(135deg,#dcfce7,#bbf7d0)]"
            : "bg-[linear-gradient(135deg,#f1f5f9,#e2e8f0)]"
        }`}
      >
        <FiUsers
          className={`h-5 w-5 ${
            isApproverOnly
              ? "text-[#1d4ed8]"
              : team.areaManager
              ? "text-[#15803d]"
              : "text-[#475569]"
          }`}
        />
      </div>

      {/* Team name */}
      <span className="mb-2 text-[0.88rem] font-semibold leading-tight text-[#1e1e1e]">
        {team.name}
      </span>

      {/* Role badge */}
      {team.areaManager ? (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[0.72rem] font-semibold text-[#15803d]">
          <FiShield className="h-3 w-3" />
          Gerente
        </span>
      ) : team.approver ? (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#dbeafe] px-2 py-0.5 text-[0.72rem] font-semibold text-[#1d4ed8]">
          <FiCheck className="h-3 w-3" />
          Aprovador
        </span>
      ) : (
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[0.72rem] font-semibold text-[#475569]">
          <FiUser className="h-3 w-3" />
          Membro
        </span>
      )}

      {/* Action hint */}
      <span className="inline-flex items-center gap-1 text-[0.75rem] text-[#9ca3af] group-hover:text-[#4f84c4]">
        {isApproverOnly ? (
          <>
            <FiClock className="h-3 w-3" />
            Aprovar
          </>
        ) : (
          <>
            <FiZap className="h-3 w-3" />
            Criar
          </>
        )}
        <FiArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

// ─── SectorAdminModal ──────────────────────────────────────────────────────────

function SectorAdminModal({
  sector,
  initialTeamId,
  user,
  employees,
  onClose,
}: {
  sector: SectorGroup;
  initialTeamId: string;
  user: AuthSessionUser;
  employees: EmployeeDirectoryEntry[];
  onClose: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Teams this user can manage
  const manageableTeams = user.head_manager || user.sectorManager
    ? sector.teams
    : sector.teams.filter((t) => t.areaManager);

  const selectedTeamName = sector.teams.find((t) => t.id === selectedTeamId)?.name ?? "";

  useEffect(() => {
    setLoading(true);
    setError(null);
    authFetch("/api/users-role")
      .then((r) => (r.ok ? (r.json() as Promise<RoleEntry[]>) : Promise.resolve([])))
      .then(setRoles)
      .catch(() => setError("Erro ao carregar membros."))
      .finally(() => setLoading(false));
  }, []);

  const teamRoles = useMemo(
    () => roles.filter((r) => r.team === selectedTeamId),
    [roles, selectedTeamId],
  );

  const teamMembers = useMemo(
    () =>
      teamRoles.map((r) => {
        const emp = employees.find((e) => e.id === r.user);
        return {
          roleId: r.id,
          userId: r.user,
          name: emp?.name ?? `Usuário #${r.user}`,
          email: emp?.email ?? "",
        };
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#142133]/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Gerenciar membros — ${sector.sectorName}`}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(20,33,51,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e9f0] px-6 py-4">
          <div>
            <h3 className="text-[1.05rem] font-bold text-[#1e1e1e]">{sector.sectorName}</h3>
            <p className="text-[0.82rem] text-[#6b7280]">Gerenciar membros dos times</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e9f0] text-[#6b7280] transition hover:bg-[#f3f4f6]"
            aria-label="Fechar"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Team selector */}
        {manageableTeams.length > 1 && (
          <div className="border-b border-[#e8e9f0] px-6 py-3">
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {manageableTeams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[0.82rem] font-medium transition ${
                    selectedTeamId === t.id
                      ? "bg-[#1675b8] text-white"
                      : "border border-[#e0eaf3] text-[#6b7280] hover:border-[#1675b8] hover:text-[#1675b8]"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="max-h-72 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="text-[0.88rem] text-[#9ca3af]">Carregando membros...</span>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FiUsers className="mb-2 h-8 w-8 text-[#d1d5db]" />
              <p className="text-[0.88rem] text-[#6b7280]">
                Nenhum membro em <strong>{selectedTeamName}</strong>
              </p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Membros do time">
              {teamMembers.map((m) => (
                <li
                  key={m.roleId}
                  className="flex items-center justify-between rounded-xl border border-[#e8e9f0] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569]">
                      <FiUser className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[0.88rem] font-semibold text-[#1e1e1e]">{m.name}</p>
                      {m.email && (
                        <p className="text-[0.76rem] text-[#9ca3af]">{m.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={removingId === m.roleId}
                    onClick={() => handleRemove(m.roleId)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#fee2e2] hover:text-[#b91c1c] disabled:opacity-50"
                    title="Remover do time"
                    aria-label={`Remover ${m.name} do time`}
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
        </div>

        {/* Footer note */}
        <div className="border-t border-[#e8e9f0] px-6 py-3">
          <p className="text-[0.76rem] text-[#9ca3af]">
            Remover um membro não desativa a conta, apenas remove a associação ao time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── HeadManagerView ───────────────────────────────────────────────────────────

function HeadManagerView({
  setores,
  times,
  employees,
}: {
  setores: SetorEntry[];
  times: TimeEntry[];
  employees: EmployeeDirectoryEntry[];
}) {
  const sectorGroups = useMemo(
    () =>
      setores
        .map((s) => ({
          sectorId: s.id,
          sectorName: s.nome,
          teams: times
            .filter((t) => t.secretariaId === s.id)
            .map((t) => ({
              id: t.id,
              name: t.nome,
              sectorId: s.id,
              sectorName: s.nome,
              areaManager: false,
              approver: false,
            })),
        }))
        .filter((s) => s.teams.length > 0),
    [setores, times],
  );

  // Fake head_manager user for the modal
  const fakeUser = useMemo(
    () => ({ head_manager: true } as AuthSessionUser),
    [],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)]">
            <FiShield className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="text-[1.5rem] font-bold text-[#1e1e1e]">Visão Geral</h1>
        </div>
        <p className="mt-1.5 text-[0.88rem] text-[#6b7280]">
          Todos os setores e times da organização.
        </p>
      </header>

      {sectorGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FiGrid className="mb-4 h-10 w-10 text-[#d1d5db]" />
          <p className="text-[0.88rem] text-[#6b7280]">
            Nenhum setor ou time cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sectorGroups.map((sector) => (
            <HeadManagerSectorCard
              key={sector.sectorId}
              sector={sector}
              fakeUser={fakeUser}
              employees={employees}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type HeadSectorGroup = {
  sectorId: string;
  sectorName: string;
  teams: UserTeam[];
};

function HeadManagerSectorCard({
  sector,
  fakeUser,
  employees,
}: {
  sector: HeadSectorGroup;
  fakeUser: AuthSessionUser;
  employees: EmployeeDirectoryEntry[];
}) {
  const [adminTeamId, setAdminTeamId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e0eaf3] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)]">
      {/* Header — amber tint for head_manager */}
      <div className="flex items-center justify-between bg-[linear-gradient(135deg,#fffbeb,#fef3c7)] px-6 py-4">
        <div>
          <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">{sector.sectorName}</h2>
          <p className="mt-0.5 text-[0.8rem] text-[#6b7280]">
            {sector.teams.length} {sector.teams.length === 1 ? "time" : "times"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdminTeamId(sector.teams[0]?.id ?? null)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fde68a] bg-white text-[#d97706] shadow-[0_2px_8px_rgba(217,119,6,0.15)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(217,119,6,0.25)]"
          title={`Administrar ${sector.sectorName}`}
          aria-label={`Administrar ${sector.sectorName}`}
        >
          <FiSettings className="h-4 w-4" />
        </button>
      </div>

      {/* Teams grid — read-only display for head_manager */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sector.teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col items-center rounded-xl border border-[#e0eaf3] bg-[#f8fafd] p-4 text-center"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#fef3c7,#fde68a)]">
                <FiUsers className="h-5 w-5 text-[#92400e]" />
              </div>
              <span className="text-[0.88rem] font-semibold leading-tight text-[#1e1e1e]">
                {team.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {adminTeamId !== null && (
        <SectorAdminModal
          sector={sector}
          initialTeamId={adminTeamId}
          user={fakeUser}
          employees={employees}
          onClose={() => setAdminTeamId(null)}
        />
      )}
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function NoTeamsState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f5f9]">
        <FiUsers className="h-8 w-8 text-[#cbd5e1]" />
      </div>
      <h2 className="text-[1.1rem] font-bold text-[#1e1e1e]">
        Você não está em nenhum time
      </h2>
      <p className="mt-2 max-w-xs text-[0.88rem] text-[#6b7280]">
        Entre em contato com um administrador para ser adicionado a um time.
      </p>
    </div>
  );
}
