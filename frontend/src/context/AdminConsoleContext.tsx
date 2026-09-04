import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { canManageEmployees, canViewCrossTeamData } from "../lib/accessControl";
import {
  mockActivityLog,
  mockApiIntegrations,
  mockEmployeeDirectory,
  mockPresentations,
  organizationDirectory,
  secretariasMock,
  timesMock,
} from "../mocks/adminMockData";
import type { NewEmployeePayload, NewSecretariaPayload, NewTimePayload } from "../types/admin";
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
  secretarias: typeof secretariasMock;
  times: typeof timesMock;
  canManageEmployees: boolean;
  addEmployee: (payload: NewEmployeePayload) => MutationResult;
  removeEmployee: (employeeId: string) => MutationResult;
  addSecretaria: (payload: NewSecretariaPayload) => MutationResult;
  removeSecretaria: (id: string) => MutationResult;
  addTime: (payload: NewTimePayload) => MutationResult;
  removeTime: (id: string) => MutationResult;
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
  const [secretariasState, setSecretariasState] = useState(secretariasMock);
  const [timesState, setTimesState] = useState(timesMock);
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

  function addSecretaria(payload: NewSecretariaPayload): MutationResult {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar secretarias." };
    }
    if (!payload.nome.trim() || !payload.setor.trim()) {
      return { ok: false, message: "Preencha nome e setor da secretaria." };
    }
    const next = { id: createId("sec"), nome: payload.nome.trim(), setor: payload.setor.trim() };
    setSecretariasState((cur) => [...cur, next]);
    setActivityLogState((cur) => [
      {
        id: createId("log"), timestamp: new Date().toISOString(),
        source: "Administração", type: "Secretaria cadastrada",
        category: "Usuários" as const, action: "Nova secretaria cadastrada",
        entityName: payload.nome.trim(), entityType: "secretaria",
        userName: user.name, userRole: "Administrador Geral",
        department: payload.setor.trim(), team: "", status: "success" as const,
        updateType: "manual" as const,
      },
      ...cur,
    ]);
    return { ok: true };
  }

  function removeSecretaria(id: string): MutationResult {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem remover secretarias." };
    }
    const target = secretariasState.find((s) => s.id === id);
    if (!target) return { ok: false, message: "Secretaria não encontrada." };
    setSecretariasState((cur) => cur.filter((s) => s.id !== id));
    setTimesState((cur) => cur.filter((t) => t.secretariaId !== id));
    return { ok: true };
  }

  function addTime(payload: NewTimePayload): MutationResult {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem cadastrar times." };
    }
    if (!payload.nome.trim() || !payload.setor.trim() || !payload.secretariaId) {
      return { ok: false, message: "Preencha nome, setor e secretaria responsável." };
    }
    const secretaria = secretariasState.find((s) => s.id === payload.secretariaId);
    if (!secretaria) return { ok: false, message: "Secretaria selecionada não encontrada." };
    const next = {
      id: createId("time"), nome: payload.nome.trim(), setor: payload.setor.trim(),
      secretariaId: payload.secretariaId, secretariaNome: secretaria.nome,
    };
    setTimesState((cur) => [...cur, next]);
    setActivityLogState((cur) => [
      {
        id: createId("log"), timestamp: new Date().toISOString(),
        source: "Administração", type: "Time cadastrado",
        category: "Usuários" as const, action: "Novo time cadastrado",
        entityName: payload.nome.trim(), entityType: "time",
        userName: user.name, userRole: "Administrador Geral",
        department: payload.setor.trim(), team: payload.nome.trim(),
        status: "success" as const, updateType: "manual" as const,
      },
      ...cur,
    ]);
    return { ok: true };
  }

  function removeTime(id: string): MutationResult {
    if (!user || !allowEmployeeManagement) {
      return { ok: false, message: "Somente administradores de nível 2 podem remover times." };
    }
    const target = timesState.find((t) => t.id === id);
    if (!target) return { ok: false, message: "Time não encontrado." };
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
