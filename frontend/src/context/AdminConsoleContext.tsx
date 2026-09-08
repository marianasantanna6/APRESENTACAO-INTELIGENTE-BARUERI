import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { canManageEmployees, canViewCrossTeamData, mapAccessLevel } from "../lib/accessControl";
import {
  mockActivityLog,
  mockApiIntegrations,
  mockPresentations,
} from "../mocks/adminMockData";
import type { EmployeeDirectoryEntry, NewEmployeePayload, NewSecretariaPayload, NewTimePayload, SecretariaEntry, TimeEntry } from "../types/admin";
import { useAuth } from "./AuthContext";

type MutationResult =
  | { ok: true }
  | { ok: false; message: string };

type EmployeeMutationResult = MutationResult;

type AdminConsoleContextValue = {
  activityLog: typeof mockActivityLog;
  apiIntegrations: typeof mockApiIntegrations;
  employees: EmployeeDirectoryEntry[];
  presentations: typeof mockPresentations;
  secretarias: SecretariaEntry[];
  times: TimeEntry[];
  canManageEmployees: boolean;
  addEmployee: (payload: NewEmployeePayload) => Promise<MutationResult>;
  removeEmployee: (employeeId: string) => MutationResult;
  addSecretaria: (payload: NewSecretariaPayload) => Promise<MutationResult>;
  removeSecretaria: (id: string) => Promise<MutationResult>;
  addTime: (payload: NewTimePayload) => Promise<MutationResult>;
  removeTime: (id: string) => Promise<MutationResult>;
};

const AdminConsoleContext = createContext<AdminConsoleContextValue | undefined>(
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
  const [activityLogState, setActivityLogState] = useState(mockActivityLog);
  const [secretariasState, setSecretariasState] = useState<SecretariaEntry[]>([]);
  const [timesState, setTimesState] = useState<TimeEntry[]>([]);

  useEffect(() => {
    type RawSector = { id: string; name: string };
    type RawTeam = { id: string; name: string; sectorId: string; sectorName: string; level_acess: number };
    type RawUser = { id: string; name: string; email: string; cpf: string; photo: string | null };
    type RawUserTeam = { id: string; user: string; team: string };

    Promise.all([
      fetch("/api/sectors").then((r) => r.json() as Promise<RawSector[]>),
      fetch("/api/teams").then((r) => r.json() as Promise<RawTeam[]>),
      fetch("/api/management").then((r) => r.json() as Promise<RawUser[]>),
      fetch("/api/users-teams").then((r) => r.json() as Promise<RawUserTeam[]>),
    ])
      .then(([sectors, teams, users, userTeams]) => {
        setSecretariasState(sectors.map((s) => ({ id: s.id, nome: s.name })));
        setTimesState(teams.map((t) => ({
          id: t.id,
          nome: t.name,
          secretariaId: t.sectorId,
          secretariaNome: t.sectorName,
          levelAcess: t.level_acess,
        })));
        setEmployeesState(users.map((u) => {
          const userTeam = userTeams.find((ut) => ut.user === u.id);
          const team = userTeam ? teams.find((t) => t.id === userTeam.team) : null;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            department: team?.sectorName ?? "",
            team: team?.name ?? "",
            accessLevel: mapAccessLevel(team?.level_acess ?? 0),
            status: "active" as const,
          };
        }));
      })
      .catch(() => {});
  }, []);
  const allowCrossTeamData = canViewCrossTeamData(user);
  const allowEmployeeManagement = canManageEmployees(user);

  const presentations = useMemo(
    () =>
      user
        ? presentationsState.filter(
            (presentation) => presentation.ownerUserId === user.id,
          )
        : [],
    [presentationsState, user],
  );

  const employees = useMemo(
    () =>
      user
        ? employeesState.filter(
            (employee) => allowCrossTeamData || employee.team === user.team,
          )
        : [],
    [allowCrossTeamData, employeesState, user],
  );

  const activityLog = useMemo(
    () =>
      user
        ? activityLogState.filter(
            (entry) => allowCrossTeamData || entry.team === user.team,
          )
        : [],
    [activityLogState, allowCrossTeamData, user],
  );

  async function addEmployee(payload: NewEmployeePayload): Promise<EmployeeMutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar funcionários." };
    }

    if (!isInstitutionalEmail(payload.email)) {
      return { ok: false, message: "Cadastre apenas emails institucionais com o domínio @barueri.sp.gov.br." };
    }

    const registerRes = await fetch("/api/register", {
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

    await fetch("/api/users-teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: parseInt(newUser.id), team: parseInt(payload.teamId) }),
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

  function removeEmployee(employeeId: string): EmployeeMutationResult {
    if (!user || !allowEmployeeManagement) {
      return {
        ok: false,
        message:
          "Somente administradores de nível 2 podem remover funcionários.",
      };
    }

    const targetEmployee = employeesState.find(
      (employee) => employee.id === employeeId,
    );

    if (!targetEmployee) {
      return {
        ok: false,
        message: "Funcionário não encontrado para remoção.",
      };
    }

    setEmployeesState((current) =>
      current.filter((employee) => employee.id !== employeeId),
    );
    setActivityLogState((current) => [
      {
        id: createId("log"),
        timestamp: new Date().toISOString(),
        source: "Administração",
        type: "Funcionário removido",
        category: "Usuários" as const,
        action: "Usuário removido da plataforma",
        entityName: targetEmployee.name,
        entityType: "usuário",
        userName: user.name,
        userRole: "Administrador Geral",
        department: targetEmployee.department,
        team: targetEmployee.team,
        status: "warning" as const,
        updateType: "manual" as const,
      },
      ...current,
    ]);

    return { ok: true };
  }

  async function addSecretaria(payload: NewSecretariaPayload): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar secretarias." };
    }
    if (!payload.nome.trim()) {
      return { ok: false, message: "Preencha o nome da secretaria." };
    }
    const res = await fetch("/api/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.nome.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao cadastrar secretaria." };
    }
    const data = await res.json() as { id: string; name: string };
    setSecretariasState((cur) => [...cur, { id: data.id, nome: data.name }]);
    return { ok: true };
  }

  async function removeSecretaria(id: string): Promise<MutationResult> {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem remover secretarias." };
    }
    const res = await fetch(`/api/sectors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return { ok: false, message: err.message ?? "Erro ao remover secretaria." };
    }
    setSecretariasState((cur) => cur.filter((s) => s.id !== id));
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
    const secretaria = secretariasState.find((s) => s.id === payload.secretariaId);
    if (!secretaria) return { ok: false, message: "Secretaria selecionada não encontrada." };
    const res = await fetch("/api/teams", {
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
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
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
        secretarias: secretariasState,
        times: timesState,
        canManageEmployees: allowEmployeeManagement,
        addEmployee,
        removeEmployee,
        addSecretaria,
        removeSecretaria,
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
