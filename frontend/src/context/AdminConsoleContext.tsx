import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { canManageEmployees, canViewCrossTeamData, mapAccessLevel } from "../lib/accessControl";
import {
  mockApiIntegrations,
  mockPresentations,
} from "../mocks/adminMockData";
import { authFetch } from "../lib/apiClient";
import type { ActivityLogEntry, EmployeeDirectoryEntry, NewEmployeePayload, NewSetorPayload, NewTimePayload, SetorEntry, TimeEntry } from "../types/admin";
import { useAuth } from "./AuthContext";

type MutationResult =
  | { ok: true }
  | { ok: false; message: string };

type EmployeeMutationResult = MutationResult;

type AdminConsoleContextValue = {
  activityLog: ActivityLogEntry[];
  apiIntegrations: typeof mockApiIntegrations;
  employees: EmployeeDirectoryEntry[];
  presentations: typeof mockPresentations;
  setores: SetorEntry[];
  times: TimeEntry[];
  canManageEmployees: boolean;
  isHeadManager: boolean;
  addEmployee: (payload: NewEmployeePayload) => Promise<MutationResult>;
  removeEmployee: (employeeId: string, adminEmail: string, adminPassword: string) => Promise<MutationResult>;
  permanentDeleteEmployee: (employeeId: string, adminEmail: string, adminPassword: string) => Promise<MutationResult>;
  addSetor: (payload: NewSetorPayload) => Promise<MutationResult>;
  removeSetor: (id: string) => Promise<MutationResult>;
  addTime: (payload: NewTimePayload) => Promise<MutationResult>;
  removeTime: (id: string) => Promise<MutationResult>;
};

export const AdminConsoleContext = createContext<AdminConsoleContextValue | undefined>(
  undefined,
);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function isInstitutionalEmail(value: string) {
  return value.trim().toLowerCase().endsWith("@barueri.sp.gov.br");
}

export function AdminConsoleProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [presentationsState] = useState(mockPresentations);
  const [apiIntegrations] = useState(mockApiIntegrations);
  const [employeesState, setEmployeesState] = useState<EmployeeDirectoryEntry[]>([]);
  const [activityLogState, setActivityLogState] = useState<ActivityLogEntry[]>([]);
  const [setoresState, setSetoresState] = useState<SetorEntry[]>([]);
  const [timesState, setTimesState] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    type RawSector = { id: string; name: string };
    type RawTeam = { id: string; name: string; sectorId: string; sectorName: string; level_acess: number };
    type RawUser = { id: string; name: string; email: string; cpf: string; photo: string | null; status: boolean; head_manager: boolean };
    type RawUserTeam = { id: string; user: string; sector: string; team: string | null };
    type RawLog = { id: string; user: string; action: string; project: string; moment: string };

    const ACTION_LABEL: Record<string, string> = {
      criou:    "Projeto criado",
      editou:   "Projeto editado",
      aprovou:  "Projeto aprovado",
      inativou: "Projeto arquivado",
    };

    Promise.all([
      authFetch("/api/sectors").then((r) => r.ok ? r.json() as Promise<RawSector[]> : Promise.resolve([])),
      authFetch("/api/teams").then((r) => r.ok ? r.json() as Promise<RawTeam[]> : Promise.resolve([])),
      authFetch("/api/management").then((r) => r.ok ? r.json() as Promise<RawUser[]> : Promise.resolve([])),
      authFetch("/api/users-role").then((r) => r.ok ? r.json() as Promise<RawUserTeam[]> : Promise.resolve([])),
      authFetch("/api/projects-logs").then((r) => r.ok ? r.json() as Promise<RawLog[]> : Promise.resolve([])),
    ])
      .then(([sectors, teams, users, userTeams, logs]) => {
        setSetoresState(sectors.map((s) => ({ id: s.id, nome: s.name })));
        setTimesState(teams.map((t) => ({
          id: t.id,
          nome: t.name,
          secretariaId: t.sectorId,
          secretariaNome: t.sectorName,
          levelAcess: t.level_acess,
        })));
        setEmployeesState(users.map((u) => {
          const userTeam = userTeams.find((ut) => ut.user === u.id);
          const team = userTeam?.team ? teams.find((t) => t.id === userTeam.team) : null;
          const sectorFallback = userTeam && !team ? sectors.find((s) => s.id === userTeam.sector) : null;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            department: team?.sectorName ?? sectorFallback?.name ?? "",
            team: team?.name ?? "",
            accessLevel: mapAccessLevel(team?.level_acess ?? 0),
            status: (u.status ? "active" : "inactive") as "active" | "inactive",
          };
        }));

        const userMap = new Map(users.map((u) => [u.id, u.name]));
        const mapped: ActivityLogEntry[] = logs.map((log) => ({
          id: log.id,
          timestamp: log.moment,
          type: ACTION_LABEL[log.action] ?? log.action,
          action: ACTION_LABEL[log.action] ?? log.action,
          source: "Sistema",
          userName: userMap.get(log.user) ?? `Usuário #${log.user}`,
          department: "",
          team: "",
          entityName: `#${log.project}`,
          entityType: "projeto",
          entityId: log.project,
        }));

        const demoUserNames = users.length > 0
          ? [users[0]?.name, users[1]?.name, users[0]?.name, users[1]?.name ?? users[0]?.name, users[0]?.name]
          : ["Usuário 1", "Usuário 2", "Usuário 1", "Usuário 2", "Usuário 1"];
        const demoLogs: ActivityLogEntry[] = [
          { id: "demo-1", timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),  type: "Projeto aprovado",  action: "Projeto aprovado",  source: "Sistema", userName: demoUserNames[0] ?? "", department: "", team: "", entityName: "demo", entityType: "projeto" },
          { id: "demo-2", timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),  type: "Projeto editado",   action: "Projeto editado",   source: "Sistema", userName: demoUserNames[1] ?? "", department: "", team: "", entityName: "demo", entityType: "projeto" },
          { id: "demo-3", timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),  type: "Projeto criado",    action: "Projeto criado",    source: "Sistema", userName: demoUserNames[2] ?? "", department: "", team: "", entityName: "demo", entityType: "projeto" },
          { id: "demo-4", timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), type: "Projeto arquivado", action: "Projeto arquivado", source: "Sistema", userName: demoUserNames[3] ?? "", department: "", team: "", entityName: "demo", entityType: "projeto" },
          { id: "demo-5", timestamp: new Date(Date.now() - 48 * 3600000).toISOString(), type: "Projeto criado",    action: "Projeto criado",    source: "Sistema", userName: demoUserNames[4] ?? "", department: "", team: "", entityName: "demo", entityType: "projeto" },
        ];
        setActivityLogState(mapped.length > 0 ? mapped : demoLogs);
      })
      .catch(() => {});
  }, [user]);
  const allowCrossTeamData = canViewCrossTeamData(user);
  const allowEmployeeManagement = canManageEmployees(user);
  const allowHardDelete = !!(user?.head_manager || user?.master_admin);

  const presentations = useMemo(
    () =>
      user
        ? presentationsState.filter(
            (presentation) => presentation.ownerUserId === user.id,
          )
        : [],
    [presentationsState, user],
  );

  const employees = useMemo(() => {
    if (!user) return [];
    // head_manager / master_admin → vê todos
    if (user.master_admin || user.head_manager) return employeesState;
    // sector manager (admin_level_2) → vê todos do próprio setor
    if (user.accessLevel === "admin_level_2" || user.sectorManager) {
      return employeesState.filter((emp) => emp.department === user.department);
    }
    // team manager / employee → vê só o próprio time
    return employeesState.filter((emp) => emp.team === user.team);
  }, [employeesState, user]);

  const activityLog = activityLogState;

  async function addEmployee(payload: NewEmployeePayload): Promise<EmployeeMutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar funcionários." };
    }

    if (!isInstitutionalEmail(payload.email)) {
      return { ok: false, message: "Cadastre apenas emails institucionais com o domínio @barueri.sp.gov.br." };
    }

    const registerRes = await authFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        cpf: payload.cpf.trim(),
      }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao cadastrar funcionário." };
    }

    const newUser = await registerRes.json() as { id: string; name: string; email: string };

    const team = timesState.find((t) => t.id === payload.teamId);

    await authFetch("/api/users-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: newUser.id,
        sector: team?.secretariaId,
        team: payload.teamId,
      }),
    });

    const newEmployee: EmployeeDirectoryEntry = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      department: team?.secretariaNome ?? "",
      team: team?.nome ?? "",
      accessLevel: mapAccessLevel(team?.levelAcess ?? 0),
      status: "active",
    };

    setEmployeesState((current) => [newEmployee, ...current]);

    return { ok: true };
  }

  async function removeEmployee(employeeId: string, adminEmail: string, adminPassword: string): Promise<EmployeeMutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Sem permissão para inativar funcionários." };
    }

    const res = await authFetch(`/api/management/${employeeId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, adminPassword }),
    }).catch(() => null);

    if (!res || !res.ok) {
      const err = res ? await res.json().catch(() => ({})) as { message?: string } : {};
      return { ok: false, message: err.message ?? "Erro ao inativar funcionário." };
    }

    setEmployeesState((current) =>
      current.map((employee) =>
        employee.id === employeeId
          ? { ...employee, status: "inactive" as const }
          : employee,
      ),
    );

    return { ok: true };
  }

  async function permanentDeleteEmployee(employeeId: string, adminEmail: string, adminPassword: string): Promise<MutationResult> {
    if (!user || !allowHardDelete) {
      return { ok: false, message: "Apenas head-manager pode excluir funcionários permanentemente." };
    }

    const res = await authFetch(`/api/management/${employeeId}/permanent`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail, adminPassword }),
    }).catch(() => null);

    if (res && !res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao excluir funcionário." };
    }

    setEmployeesState((current) => current.filter((emp) => emp.id !== employeeId));
    return { ok: true };
  }

  async function addSetor(payload: NewSetorPayload): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar setores." };
    }
    if (!payload.nome.trim()) {
      return { ok: false, message: "Preencha o nome do setor." };
    }
    const res = await authFetch("/api/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.nome.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao cadastrar setor." };
    }
    const data = await res.json() as { id: string; name: string };
    setSetoresState((cur) => [...cur, { id: data.id, nome: data.name }]);
    return { ok: true };
  }

  async function removeSetor(id: string): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem remover setores." };
    }
    const res = await authFetch(`/api/sectors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao remover setor." };
    }
    setSetoresState((cur) => cur.filter((s) => s.id !== id));
    setTimesState((cur) => cur.filter((t) => t.secretariaId !== id));
    return { ok: true };
  }

  async function addTime(payload: NewTimePayload): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar times." };
    }
    if (!payload.nome.trim() || !payload.secretariaId) {
      return { ok: false, message: "Preencha nome e secretaria responsável." };
    }
    const secretaria = setoresState.find((s) => s.id === payload.secretariaId);
    if (!secretaria) return { ok: false, message: "Secretaria selecionada não encontrada." };
    const res = await authFetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.nome.trim(),
        sector: parseInt(payload.secretariaId),
        level_acess: payload.levelAcess,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao cadastrar time." };
    }
    const data = await res.json() as { id: string; name: string };
    setTimesState((cur) => [
      ...cur,
      { id: data.id, nome: data.name, secretariaId: payload.secretariaId, secretariaNome: secretaria.nome, levelAcess: payload.levelAcess },
    ]);
    return { ok: true };
  }

  async function removeTime(id: string): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem remover times." };
    }
    const res = await authFetch(`/api/teams/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao remover time." };
    }
    setTimesState((cur) => cur.filter((t) => t.id !== id));
    return { ok: true };
  }

  return (
    <AdminConsoleContext.Provider
      value={{
        activityLog,
        apiIntegrations,
        employees,
        presentations,
        setores: setoresState,
        times: timesState,
        canManageEmployees: allowEmployeeManagement,
        isHeadManager: allowHardDelete,
        addEmployee,
        removeEmployee,
        permanentDeleteEmployee,
        addSetor,
        removeSetor,
        addTime,
        removeTime,
      }}
    >
      {children}
    </AdminConsoleContext.Provider>
  );
}

export function useAdminConsole() {
  const context = useContext(AdminConsoleContext);

  if (!context) {
    throw new Error(
      "useAdminConsole must be used within AdminConsoleProvider",
    );
  }

  return context;
}
