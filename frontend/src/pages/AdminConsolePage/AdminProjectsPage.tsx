import { useEffect, useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiGrid,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminConsole } from "../../context/AdminConsoleContext";
import { authFetch } from "../../lib/apiClient";
import type { AuthSessionUser } from "../../types/auth";
import type { EmployeeDirectoryEntry, SetorEntry, TimeEntry } from "../../types/admin";
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const { setores, times, employees } = useAdminConsole();

  if (!user) return null;

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
      // Can create → wizard with this team pre-selected
      navigate(`${ROUTE_PATHS.createPresentation}?teamId=${team.id}`);
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
