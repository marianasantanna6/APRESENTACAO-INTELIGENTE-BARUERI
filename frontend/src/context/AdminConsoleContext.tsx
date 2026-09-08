import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { canManageEmployees, canViewCrossTeamData } from "../lib/accessControl";
import {
  mockActivityLog,
  mockApiIntegrations,
  mockEmployeeDirectory,
  mockPresentations,
  organizationDirectory,
} from "../mocks/adminMockData";
import type { NewEmployeePayload, NewSecretariaPayload, NewTimePayload, SecretariaEntry, TimeEntry } from "../types/admin";
import { useAuth } from "./AuthContext";

type MutationResult =
  | { ok: true }
  | { ok: false; message: string };

type EmployeeMutationResult = MutationResult;

type AdminConsoleContextValue = {
  activityLog: typeof mockActivityLog;
  apiIntegrations: typeof mockApiIntegrations;
  employees: typeof mockEmployeeDirectory;
  organization: typeof organizationDirectory;
  presentations: typeof mockPresentations;
  secretarias: SecretariaEntry[];
  times: TimeEntry[];
  canManageEmployees: boolean;
  addEmployee: (payload: NewEmployeePayload) => MutationResult;
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
  const [employeesState, setEmployeesState] = useState(mockEmployeeDirectory);
  const [activityLogState, setActivityLogState] = useState(mockActivityLog);
  const [secretariasState, setSecretariasState] = useState<SecretariaEntry[]>([]);
  const [timesState, setTimesState] = useState<TimeEntry[]>([]);

  useEffect(() => {
    fetch("/api/sectors")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string }>) => {
        setSecretariasState(data.map((s) => ({ id: s.id, nome: s.name })));
      })
      .catch(() => {});

    fetch("/api/teams")
      .then((r) => r.json())
      .then((data: Array<{ id: string; name: string; sectorId: string; sectorName: string; level_acess: number }>) => {
        setTimesState(data.map((t) => ({
          id: t.id,
          nome: t.name,
          secretariaId: t.sectorId,
          secretariaNome: t.sectorName,
          levelAcess: t.level_acess,
        })));
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

  function addEmployee(payload: NewEmployeePayload): EmployeeMutationResult {
    if (!user || !allowEmployeeManagement) {
      return {
        ok: false,
        message:
          "Somente administradores de nível 2 podem cadastrar funcionários.",
      };
    }

    if (!isInstitutionalEmail(payload.email)) {
      return {
        ok: false,
        message:
          "Cadastre apenas emails institucionais com o domínio @barueri.sp.gov.br.",
      };
    }

    const nextEmployee = {
      id: createId("employee"),
      name: payload.name,
      email: payload.email.trim().toLowerCase(),
      department: payload.department,
      team: payload.team,
      accessLevel: "employee" as const,
      status: "active" as const,
    };

    setEmployeesState((current) => [nextEmployee, ...current]);
    setActivityLogState((current) => [
      {
        id: createId("log"),
        timestamp: new Date().toISOString(),
        source: "Administração",
        type: "Funcionário cadastrado",
        category: "Usuários" as const,
        action: "Novo usuário cadastrado",
        entityName: payload.name,
        entityType: "usuário",
        userName: user.name,
        userRole: "Administrador Geral",
        department: payload.department,
        team: payload.team,
        status: "success" as const,
        updateType: "manual" as const,
      },
      ...current,
    ]);

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
        organization: organizationDirectory,
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
