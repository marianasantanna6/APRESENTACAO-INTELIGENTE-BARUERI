import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { FiBriefcase, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import {
  AdminAvatar,
  AdminPanel,
  AdminStatusChip,
} from "../../components/AdminConsole";
import { useAdminConsole, useAuth } from "../../context";
import { useModalAccessibility } from "../../hooks";
import { formatDateTime } from "../../lib/formatters";
import type {
  ActivityLogCategory,
  ActivityLogEntry,
  ActivityLogStatus,
  EmployeeDirectoryEntry,
  NewEmployeePayload,
  NewSecretariaPayload,
  NewTimePayload,
  SecretariaEntry,
  TimeEntry,
} from "../../types/admin";
import type { AccountStatus } from "../../types/auth";

// ── Configuração visual do Log de Atividades ──────────────────────────────────

const ALL_LOG_CATEGORIES: ActivityLogCategory[] = [
  "Apresentações", "Projetos", "Templates",
  "Usuários", "Integrações", "Aprovações", "Compartilhamentos",
];

const CATEGORY_CHIP: Record<ActivityLogCategory, string> = {
  "Apresentações":     "bg-[#dcebfa] text-[#3d83bc]",
  "Projetos":          "bg-[#d9f0e4] text-[#2a8a5c]",
  "Templates":         "bg-[#ece8f9] text-[#6b54c7]",
  "Usuários":          "bg-[#fef3dc] text-[#a07018]",
  "Integrações":       "bg-[#e8ecf0] text-[#4f6475]",
  "Aprovações":        "bg-[#d8f0ed] text-[#2a7a72]",
  "Compartilhamentos": "bg-[#fce8f2] text-[#c24b7a]",
};

const STATUS_DOT: Record<ActivityLogStatus, string> = {
  success: "bg-[#3ab879]",
  warning: "bg-[#e8a330]",
  error:   "bg-[#d65d5d]",
};

const STATUS_LABEL: Record<ActivityLogStatus, string> = {
  success: "Concluído",
  warning: "Atenção",
  error:   "Erro",
};

type LogPeriodFilter = "today" | "7d" | "30d" | "all";

function isPeriodMatch(timestamp: string, period: LogPeriodFilter): boolean {
  if (period === "all") return true;
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (period === "today") return diffDays < 1;
  if (period === "7d")    return diffDays <= 7;
  return diffDays <= 30;
}

// ─────────────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | AccountStatus;

type EmployeeFormState = {
  name: string;
  email: string;
  department: string;
  team: string;
};

type DeleteConfirmationFormState = {
  email: string;
  password: string;
};

const initialDeleteConfirmationForm: DeleteConfirmationFormState = {
  email: "",
  password: "",
};

function isInstitutionalEmail(value: string) {
  return value.trim().toLowerCase().endsWith("@barueri.sp.gov.br");
}

function getDefaultFormValues(
  organization: { department: string; teams: string[] }[],
): EmployeeFormState {
  const firstDepartment = organization[0];

  return {
    name: "",
    email: "",
    department: firstDepartment?.department ?? "",
    team: firstDepartment?.teams[0] ?? "",
  };
}

function MobileInfoField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#9aa7b2]">
        {label}
      </p>
      <div className="text-[0.92rem] font-medium text-[#5f6974]">{children}</div>
    </div>
  );
}

function EmployeeMobileCard({
  canManageEmployees,
  employee,
  onRemove,
}: {
  canManageEmployees: boolean;
  employee: EmployeeDirectoryEntry;
  onRemove: (employee: EmployeeDirectoryEntry) => void;
}) {
  return (
    <article className="rounded-[22px] border border-[#e4ebf2] bg-white/88 p-4 shadow-[0_16px_40px_-28px_rgba(20,33,51,0.28)] md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AdminAvatar
            name={employee.name}
            sizeClassName="h-10 w-10"
            textClassName="text-[0.82rem]"
            className="shadow-none"
          />
          <div className="min-w-0">
            <p className="truncate text-[1rem] font-semibold text-[#3a4651]">
              {employee.name}
            </p>
            <p className="truncate text-[0.78rem] text-[#8f9aa6]">
              {employee.email}
            </p>
          </div>
        </div>

        {canManageEmployees ? (
          <button
            type="button"
            onClick={() => onRemove(employee)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
            aria-label={`Remover ${employee.name}`}
          >
            <FiTrash2 className="h-4.5 w-4.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MobileInfoField label="Equipe">{employee.team}</MobileInfoField>
        <MobileInfoField label="Setor">{employee.department}</MobileInfoField>
        <MobileInfoField label="Estado">
          <AdminStatusChip
            tone={employee.status}
            label={employee.status === "active" ? "Ativo" : "Inativo"}
          />
        </MobileInfoField>
      </div>
    </article>
  );
}

function ActivityLogMobileCard({ entry }: { entry: ActivityLogEntry }) {
  const categoryStyle = entry.category ? CATEGORY_CHIP[entry.category] : "bg-[#dcebfa] text-[#3d83bc]";
  const statusKey = (entry.status ?? "success") as ActivityLogStatus;
  const displayAction = entry.action ?? entry.type;
  const displayEntity = entry.entityName ?? entry.source;

  return (
    <article className="rounded-[22px] border border-[#e4ebf2] bg-white/88 p-4 shadow-[0_16px_40px_-28px_rgba(20,33,51,0.28)] md:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.78rem] font-semibold text-[#8f9aa6]">
            {formatDateTime(entry.timestamp)}
          </p>
          <p className="mt-1 text-[0.97rem] font-bold text-[#3a4651] leading-snug">
            {displayAction}
          </p>
          {displayEntity && displayEntity !== displayAction && (
            <p className="mt-0.5 text-[0.82rem] text-[#8a96a2]">{displayEntity}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {entry.category && (
            <span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${categoryStyle}`}>
              {entry.category}
            </span>
          )}
          {entry.status && (
            <span className="flex items-center gap-1.5 text-[0.72rem] font-medium text-[#7a8694]">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[statusKey]}`} />
              {STATUS_LABEL[statusKey]}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <MobileInfoField label="Responsável">
          <span>{entry.userName}</span>
          {entry.userRole && (
            <span className="ml-1 text-[0.74rem] text-[#ababab]">({entry.userRole})</span>
          )}
        </MobileInfoField>
        <MobileInfoField label="Setor">{entry.department}</MobileInfoField>
      </div>

      {(entry.previousValue || entry.newValue) && (
        <div className="mt-3 rounded-[14px] bg-[#f6f8fa] px-3 py-2.5 text-[0.78rem]">
          {entry.previousValue && (
            <p className="text-[#9aa5b0]">
              <span className="font-semibold">Antes:</span> {entry.previousValue}
            </p>
          )}
          {entry.newValue && (
            <p className={`${entry.previousValue ? "mt-1" : ""} text-[#4f6475]`}>
              <span className="font-semibold">Depois:</span> {entry.newValue}
            </p>
          )}
        </div>
      )}

      {entry.notes && (
        <p className="mt-2 text-[0.76rem] text-[#9aa5b0] italic">{entry.notes}</p>
      )}
    </article>
  );
}

function EmptyMobileState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#d6dee7] bg-white/80 px-4 py-6 text-center md:hidden">
      <p className="text-[1rem] font-semibold text-[#3a4651]">{title}</p>
      <p className="mt-2 text-[0.88rem] leading-6 text-[#7a8694]">{description}</p>
    </div>
  );
}

export default function AdminAdministrationPage() {
  const {
    activityLog,
    addEmployee,
    addSecretaria,
    addTime,
    canManageEmployees,
    employees,
    organization,
    removeEmployee,
    removeSecretaria,
    removeTime,
    secretarias,
    times,
  } = useAdminConsole();
  const { user, verifyCurrentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Filtros do Log de Atividades ───────────────────────────────────────────
  const [logCategory, setLogCategory] = useState<ActivityLogCategory | "all">("all");
  const [logPeriod, setLogPeriod] = useState<LogPeriodFilter>("all");
  const [logDepartment, setLogDepartment] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [employeePendingRemoval, setEmployeePendingRemoval] =
    useState<EmployeeDirectoryEntry | null>(null);
  // ── Estado: Secretarias ────────────────────────────────────────────────────
  const [isSecretariaModalOpen, setIsSecretariaModalOpen] = useState(false);
  const [secretariaForm, setSecretariaForm] = useState<NewSecretariaPayload>({ nome: "", setor: "" });
  const [secretariaFormError, setSecretariaFormError] = useState("");
  const [secretariaPendingRemoval, setSecretariaPendingRemoval] = useState<SecretariaEntry | null>(null);

  // ── Estado: Times ──────────────────────────────────────────────────────────
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [timeForm, setTimeForm] = useState<NewTimePayload>({ nome: "", setor: "", secretariaId: secretarias[0]?.id ?? "" });
  const [timeFormError, setTimeFormError] = useState("");
  const [timePendingRemoval, setTimePendingRemoval] = useState<TimeEntry | null>(null);

  // ── Ordenação alfabética ───────────────────────────────────────────────────
  const secretariasSorted = useMemo(
    () => [...secretarias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [secretarias],
  );
  const timesSorted = useMemo(
    () => [...times].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [times],
  );

  const [formValues, setFormValues] = useState<EmployeeFormState>(
    getDefaultFormValues(organization),
  );
  const [formError, setFormError] = useState("");
  const [deleteConfirmationForm, setDeleteConfirmationForm] = useState(
    initialDeleteConfirmationForm,
  );
  const [deleteConfirmationError, setDeleteConfirmationError] = useState("");

  const filteredEmployees = statusFilter === "all"
    ? employees
    : employees.filter((employee) => employee.status === statusFilter);

  const filteredActivityLog = useMemo(() => {
    const query = logSearch.trim().toLowerCase();
    return activityLog.filter((entry) => {
      if (logCategory !== "all" && entry.category !== logCategory) return false;
      if (!isPeriodMatch(entry.timestamp, logPeriod)) return false;
      if (logDepartment !== "all" && entry.department !== logDepartment) return false;
      if (query) {
        const haystack = [
          entry.action, entry.type, entry.entityName,
          entry.userName, entry.userRole, entry.notes, entry.source,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [activityLog, logCategory, logPeriod, logDepartment, logSearch]);
  const selectedDepartment = organization.find(
    (entry) => entry.department === formValues.department,
  );
  const teamOptions = selectedDepartment?.teams ?? [];
  const scopeDescription = user?.accessLevel === "admin_level_2"
    ? "Você está visualizando funcionários e logs de todas as equipes."
    : `Você está visualizando somente a equipe ${user?.team ?? ""}.`;

  function resetForm() {
    setFormValues(getDefaultFormValues(organization));
    setFormError("");
  }

  function closeModal() {
    resetForm();
    setIsModalOpen(false);
  }

  function resetDeleteConfirmation() {
    setDeleteConfirmationForm(initialDeleteConfirmationForm);
    setDeleteConfirmationError("");
  }

  function closeDeleteConfirmationModal() {
    resetDeleteConfirmation();
    setEmployeePendingRemoval(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !formValues.name.trim()
      || !formValues.email.trim()
      || !formValues.department.trim()
      || !formValues.team.trim()
    ) {
      setFormError(
        "Preencha nome, e-mail, setor e equipe para cadastrar o funcionário.",
      );
      return;
    }

    if (!isInstitutionalEmail(formValues.email)) {
      setFormError(
        "Cadastre apenas emails institucionais com o domínio @barueri.sp.gov.br.",
      );
      return;
    }

    const payload: NewEmployeePayload = {
      name: formValues.name.trim(),
      email: formValues.email.trim().toLowerCase(),
      department: formValues.department,
      team: formValues.team,
    };
    const result = addEmployee(payload);

    if ("message" in result) {
      setFormError(result.message);
      return;
    }

    closeModal();
  }

  function handleDepartmentChange(nextDepartment: string) {
    const nextTeams = organization.find(
      (entry) => entry.department === nextDepartment,
    )?.teams;

    setFormValues((current) => ({
      ...current,
      department: nextDepartment,
      team: nextTeams?.[0] ?? "",
    }));
  }

  function handleDeleteConfirmationFieldChange(
    field: keyof DeleteConfirmationFormState,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setDeleteConfirmationForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setDeleteConfirmationError("");
  }

  function handleOpenDeleteConfirmation(employee: EmployeeDirectoryEntry) {
    resetDeleteConfirmation();
    setEmployeePendingRemoval(employee);
  }

  function handleRemoveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeePendingRemoval) {
      return;
    }

    if (
      !deleteConfirmationForm.email.trim()
      || !deleteConfirmationForm.password.trim()
    ) {
      setDeleteConfirmationError(
        "Confirme e-mail institucional e senha antes de excluir o funcionário.",
      );
      return;
    }

    const verificationResult = verifyCurrentUser({
      email: deleteConfirmationForm.email,
      password: deleteConfirmationForm.password,
    });

    if ("message" in verificationResult) {
      setDeleteConfirmationError(verificationResult.message);
      return;
    }

    const result = removeEmployee(employeePendingRemoval.id);

    if ("message" in result) {
      setDeleteConfirmationError(result.message);
      return;
    }

    closeDeleteConfirmationModal();
  }

  // ── Handlers: Secretarias ─────────────────────────────────────────────────
  function handleSubmitSecretaria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecretariaFormError("");
    const result = addSecretaria(secretariaForm);
    if ("message" in result) { setSecretariaFormError(result.message); return; }
    setIsSecretariaModalOpen(false);
    setSecretariaForm({ nome: "", setor: "" });
  }

  function handleConfirmRemoveSecretaria() {
    if (!secretariaPendingRemoval) return;
    removeSecretaria(secretariaPendingRemoval.id);
    setSecretariaPendingRemoval(null);
  }

  // ── Handlers: Times ───────────────────────────────────────────────────────
  function handleSubmitTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTimeFormError("");
    const result = addTime(timeForm);
    if ("message" in result) { setTimeFormError(result.message); return; }
    setIsTimeModalOpen(false);
    setTimeForm({ nome: "", setor: "", secretariaId: secretarias[0]?.id ?? "" });
  }

  function handleConfirmRemoveTime() {
    if (!timePendingRemoval) return;
    removeTime(timePendingRemoval.id);
    setTimePendingRemoval(null);
  }

  const createEmployeeModalRef = useModalAccessibility({
    isOpen: isModalOpen,
    onClose: closeModal,
    initialFocusSelector: "[data-modal-initial-focus]",
  });
  const deleteEmployeeModalRef = useModalAccessibility({
    isOpen: employeePendingRemoval !== null,
    onClose: closeDeleteConfirmationModal,
    initialFocusSelector: "[data-modal-initial-focus]",
  });
  const secretariaModalRef = useModalAccessibility({
    isOpen: isSecretariaModalOpen,
    onClose: () => { setIsSecretariaModalOpen(false); setSecretariaFormError(""); },
    initialFocusSelector: "[data-modal-initial-focus]",
  });
  const deleteSecretariaModalRef = useModalAccessibility({
    isOpen: secretariaPendingRemoval !== null,
    onClose: () => setSecretariaPendingRemoval(null),
    initialFocusSelector: "[data-delete-confirm-focus]",
  });
  const timeModalRef = useModalAccessibility({
    isOpen: isTimeModalOpen,
    onClose: () => { setIsTimeModalOpen(false); setTimeFormError(""); },
    initialFocusSelector: "[data-modal-initial-focus]",
  });
  const deleteTimeModalRef = useModalAccessibility({
    isOpen: timePendingRemoval !== null,
    onClose: () => setTimePendingRemoval(null),
    initialFocusSelector: "[data-delete-confirm-focus]",
  });

  return (
    <section className="space-y-7">
      <div>
        <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
          Administração
        </h1>
      </div>

      <AdminPanel className="space-y-5 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[#262626]">
              Funcionários
            </h2>
            <p className="mt-1 text-[0.9rem] font-medium text-[#8f8f8f]">
              {scopeDescription}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManageEmployees ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-4 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                <FiPlus className="h-4.5 w-4.5" />
                Novo funcionário
              </button>
            ) : null}

            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full appearance-none rounded-full bg-[#f1f1f4] px-4 pr-10 text-[0.9rem] font-medium text-[#818181] outline-none sm:w-auto"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9a9a9a]">
                v
              </span>
            </div>
          </div>
        </div>

        {filteredEmployees.length ? (
          <>
            <div className="space-y-3 md:hidden">
              {filteredEmployees.map((employee) => (
                <EmployeeMobileCard
                  key={employee.id}
                  canManageEmployees={canManageEmployees}
                  employee={employee}
                  onRemove={handleOpenDeleteConfirmation}
                />
              ))}
            </div>

            <div className="hidden md:block">
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <table className="min-w-[760px] w-full border-separate border-spacing-y-4 text-left">
                  <thead>
                    <tr className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                      <th className="w-[38%] pb-2 pr-4">Nome</th>
                      <th className="w-[22%] pb-2 px-4">Equipe</th>
                      <th className="w-[20%] pb-2 px-4">Setor</th>
                      <th className="w-[14%] pb-2 px-4">Estado</th>
                      {canManageEmployees ? <th className="pb-1">Ações</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="text-[0.95rem] font-medium text-[#7a7a7a]">
                        <td className="rounded-l-[18px] bg-white/72 px-0 py-2.5">
                          <div className="flex items-center gap-3.5 px-5">
                            <AdminAvatar
                              name={employee.name}
                              sizeClassName="h-8.5 w-8.5"
                              textClassName="text-[0.78rem]"
                              className="shadow-none"
                            />
                            <div className="min-w-0">
                              <p className="text-[0.96rem] text-[#747474]">{employee.name}</p>
                              <p className="text-[0.76rem] text-[#b1b1b1]">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="bg-white/72 px-5 py-2.5 text-[0.92rem] text-[#9b9b9b]">
                          {employee.team}
                        </td>
                        <td className="bg-white/72 px-5 py-2.5 text-[0.92rem] text-[#9b9b9b]">
                          {employee.department}
                        </td>
                        <td className={`${canManageEmployees ? "" : "rounded-r-[18px]"} bg-white/72 px-5 py-2.5`}>
                          <AdminStatusChip
                            tone={employee.status}
                            label={employee.status === "active" ? "Ativo" : "Inativo"}
                          />
                        </td>
                        {canManageEmployees ? (
                          <td className="rounded-r-[18px] bg-white/72 px-5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirmation(employee)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
                              aria-label={`Remover ${employee.name}`}
                            >
                              <FiTrash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyMobileState
            title="Nenhum funcionário encontrado"
            description="Ajuste o filtro atual para visualizar os funcionários disponíveis."
          />
        )}
      </AdminPanel>

      {/* ── Painel Secretarias (somente admin_level_2) ─────────────────────── */}
      {canManageEmployees ? (
        <AdminPanel className="space-y-5 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[#262626]">
                Secretarias
              </h2>
              <p className="mt-1 text-[0.9rem] font-medium text-[#8f8f8f]">
                Registro das secretarias e setores da organização.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSecretariaFormError(""); setIsSecretariaModalOpen(true); }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-4 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 self-start"
            >
              <FiPlus className="h-4.5 w-4.5" />
              Nova secretaria
            </button>
          </div>

          {secretariasSorted.length ? (
            <>
              {/* Mobile */}
              <div className="space-y-3 md:hidden">
                {secretariasSorted.map((sec) => (
                  <article key={sec.id} className="rounded-[22px] border border-[#e4ebf2] bg-white/88 p-4 shadow-[0_16px_40px_-28px_rgba(20,33,51,0.28)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-[#3d83bc]">
                          <FiBriefcase className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[1rem] font-semibold text-[#3a4651]">{sec.nome}</p>
                          <p className="truncate text-[0.78rem] text-[#8f9aa6]">{sec.setor}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSecretariaPendingRemoval(sec)}
                        aria-label={`Remover ${sec.nome}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
                      >
                        <FiTrash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                  <table className="min-w-[560px] w-full border-separate border-spacing-y-4 text-left">
                    <thead>
                      <tr className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                        <th className="w-[55%] pb-2 pr-4">Nome</th>
                        <th className="w-[35%] pb-2 px-4">Setor</th>
                        <th className="pb-1">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secretariasSorted.map((sec) => (
                        <tr key={sec.id} className="text-[0.95rem] font-medium text-[#7a7a7a]">
                          <td className="rounded-l-[18px] bg-white/72 px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f0f8] text-[#3d83bc]">
                                <FiBriefcase className="h-4 w-4" />
                              </span>
                              <span className="text-[0.96rem] text-[#3a4651] font-semibold">{sec.nome}</span>
                            </div>
                          </td>
                          <td className="bg-white/72 px-5 py-2.5 text-[0.92rem] text-[#9b9b9b]">{sec.setor}</td>
                          <td className="rounded-r-[18px] bg-white/72 px-5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSecretariaPendingRemoval(sec)}
                              aria-label={`Remover ${sec.nome}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
                            >
                              <FiTrash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <EmptyMobileState
              title="Nenhuma secretaria cadastrada"
              description="Clique em Nova secretaria para começar o registro."
            />
          )}
        </AdminPanel>
      ) : null}

      {/* ── Painel Times (somente admin_level_2) ───────────────────────────── */}
      {canManageEmployees ? (
        <AdminPanel className="space-y-5 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[#262626]">
                Times
              </h2>
              <p className="mt-1 text-[0.9rem] font-medium text-[#8f8f8f]">
                Equipes de trabalho vinculadas às secretarias.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setTimeFormError(""); setIsTimeModalOpen(true); }}
              disabled={secretarias.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-4 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 self-start disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus className="h-4.5 w-4.5" />
              Novo time
            </button>
          </div>

          {timesSorted.length ? (
            <>
              {/* Mobile */}
              <div className="space-y-3 md:hidden">
                {timesSorted.map((time) => (
                  <article key={time.id} className="rounded-[22px] border border-[#e4ebf2] bg-white/88 p-4 shadow-[0_16px_40px_-28px_rgba(20,33,51,0.28)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[1rem] font-semibold text-[#3a4651]">{time.nome}</p>
                        <p className="truncate text-[0.78rem] text-[#8f9aa6]">{time.setor}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTimePendingRemoval(time)}
                        aria-label={`Remover ${time.nome}`}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
                      >
                        <FiTrash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    <div className="mt-3">
                      <MobileInfoField label="Secretaria responsável">{time.secretariaNome}</MobileInfoField>
                    </div>
                  </article>
                ))}
              </div>
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                  <table className="min-w-[680px] w-full border-separate border-spacing-y-4 text-left">
                    <thead>
                      <tr className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                        <th className="w-[28%] pb-2 pr-4">Nome do Time</th>
                        <th className="w-[22%] pb-2 px-4">Setor</th>
                        <th className="w-[40%] pb-2 px-4">Secretaria Responsável</th>
                        <th className="pb-1">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timesSorted.map((time) => (
                        <tr key={time.id} className="text-[0.95rem] font-medium text-[#7a7a7a]">
                          <td className="rounded-l-[18px] bg-white/72 px-5 py-2.5 font-semibold text-[#3a4651]">{time.nome}</td>
                          <td className="bg-white/72 px-5 py-2.5 text-[0.92rem] text-[#9b9b9b]">{time.setor}</td>
                          <td className="bg-white/72 px-5 py-2.5 text-[0.88rem] text-[#7a8694]">{time.secretariaNome}</td>
                          <td className="rounded-r-[18px] bg-white/72 px-5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setTimePendingRemoval(time)}
                              aria-label={`Remover ${time.nome}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3f3] text-[#c45b5b] transition hover:bg-[#ffe9e9]"
                            >
                              <FiTrash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <EmptyMobileState
              title="Nenhum time cadastrado"
              description={secretarias.length === 0 ? "Cadastre uma secretaria antes de criar times." : "Clique em Novo time para começar."}
            />
          )}
        </AdminPanel>
      ) : null}

      <AdminPanel className="space-y-5 px-5 py-5 sm:px-7">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[#262626]">
            Log de Atividades
          </h2>
          <p className="text-[0.88rem] font-medium text-[#8f8f8f]">
            Auditoria completa de todas as ações realizadas na plataforma.
          </p>
        </div>

        {/* Filtros — categorias */}
        <div className="-mx-1 flex flex-wrap gap-2 px-1">
          <button
            type="button"
            onClick={() => setLogCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition ${
              logCategory === "all"
                ? "bg-[#1e3a52] text-white"
                : "bg-[#f0f2f4] text-[#6a7a88] hover:bg-[#e4e8ec]"
            }`}
          >
            Todos
          </button>
          {ALL_LOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setLogCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition ${
                logCategory === cat
                  ? "bg-[#1e3a52] text-white"
                  : "bg-[#f0f2f4] text-[#6a7a88] hover:bg-[#e4e8ec]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtros — busca + período + secretaria */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa5b0]" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Buscar ação, entidade, usuário…"
              className="h-10 w-full rounded-full bg-[#f1f1f4] pl-10 pr-4 text-[0.88rem] font-medium text-[#1e1e1e] outline-none placeholder:text-[#ababab]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={logPeriod}
              onChange={(e) => setLogPeriod(e.target.value as LogPeriodFilter)}
              className="h-10 appearance-none rounded-full bg-[#f1f1f4] px-4 pr-8 text-[0.85rem] font-medium text-[#6a7a88] outline-none"
            >
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="all">Todo o período</option>
            </select>

            <select
              value={logDepartment}
              onChange={(e) => setLogDepartment(e.target.value)}
              className="h-10 appearance-none rounded-full bg-[#f1f1f4] px-4 pr-8 text-[0.85rem] font-medium text-[#6a7a88] outline-none"
            >
              <option value="all">Todas as secretarias</option>
              {organization.map((org) => (
                <option key={org.department} value={org.department}>
                  {org.department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contagem de resultados */}
        <p className="text-[0.82rem] font-medium text-[#9aa5b0]">
          {filteredActivityLog.length === activityLog.length
            ? `${activityLog.length} registro${activityLog.length !== 1 ? "s" : ""}`
            : `${filteredActivityLog.length} de ${activityLog.length} registro${activityLog.length !== 1 ? "s" : ""}`}
        </p>

        {filteredActivityLog.length ? (
          <>
            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {filteredActivityLog.map((entry) => (
                <ActivityLogMobileCard key={entry.id} entry={entry} />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                <table className="min-w-[900px] w-full border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                      <th className="w-[14%] pb-2 pr-4">Data / Hora</th>
                      <th className="w-[14%] pb-2 px-4">Categoria</th>
                      <th className="w-[28%] pb-2 px-4">Ação / Entidade</th>
                      <th className="w-[18%] pb-2 px-4">Responsável</th>
                      <th className="w-[16%] pb-2 px-4">Secretaria</th>
                      <th className="pb-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivityLog.map((entry) => {
                      const catStyle = entry.category
                        ? CATEGORY_CHIP[entry.category]
                        : "bg-[#dcebfa] text-[#3d83bc]";
                      const statusKey = (entry.status ?? "success") as ActivityLogStatus;
                      const displayAction = entry.action ?? entry.type;
                      const displayEntity = entry.entityName ?? entry.source;

                      return (
                        <tr key={entry.id} className="text-[0.88rem] font-medium text-[#7a7a7a]">
                          {/* Data */}
                          <td className="rounded-l-[18px] bg-white/72 px-5 py-3 text-[0.8rem] text-[#9b9b9b] leading-snug">
                            {formatDateTime(entry.timestamp)}
                          </td>

                          {/* Categoria */}
                          <td className="bg-white/72 px-4 py-3">
                            {entry.category ? (
                              <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.73rem] font-semibold ${catStyle}`}>
                                {entry.category}
                              </span>
                            ) : (
                              <span className="text-[0.8rem] text-[#b1b1b1]">{entry.type}</span>
                            )}
                          </td>

                          {/* Ação / Entidade */}
                          <td className="bg-white/72 px-4 py-3">
                            <p className="font-semibold text-[#353535] leading-snug">{displayAction}</p>
                            {displayEntity && (
                              <p className="mt-0.5 text-[0.78rem] text-[#9aa5b0] leading-snug">{displayEntity}</p>
                            )}
                            {(entry.previousValue || entry.newValue) && (
                              <div className="mt-1.5 rounded-[10px] bg-[#f6f8fa] px-2.5 py-1.5 text-[0.72rem] leading-snug">
                                {entry.previousValue && (
                                  <p className="text-[#9aa5b0]">
                                    <span className="font-semibold">Antes:</span> {entry.previousValue}
                                  </p>
                                )}
                                {entry.newValue && (
                                  <p className="text-[#4f6475]">
                                    <span className="font-semibold">Depois:</span> {entry.newValue}
                                  </p>
                                )}
                              </div>
                            )}
                            {entry.notes && (
                              <p className="mt-1 text-[0.72rem] text-[#ababab] italic">{entry.notes}</p>
                            )}
                          </td>

                          {/* Responsável */}
                          <td className="bg-white/72 px-4 py-3">
                            <p className="text-[#5d6c78]">{entry.userName}</p>
                            {entry.userRole && (
                              <p className="mt-0.5 text-[0.75rem] text-[#ababab]">{entry.userRole}</p>
                            )}
                          </td>

                          {/* Secretaria */}
                          <td className="bg-white/72 px-4 py-3">
                            <p className="text-[#9b9b9b]">{entry.department}</p>
                            <p className="mt-0.5 text-[0.75rem] text-[#c1c1c1]">{entry.team}</p>
                          </td>

                          {/* Status */}
                          <td className="rounded-r-[18px] bg-white/72 px-4 py-3">
                            <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-[#7a8694]">
                              <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[statusKey]}`} />
                              {STATUS_LABEL[statusKey]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#d6dee7] bg-white/80 px-4 py-8 text-center">
            <p className="text-[1rem] font-semibold text-[#3a4651]">
              {logSearch || logCategory !== "all" || logPeriod !== "all" || logDepartment !== "all"
                ? "Nenhum registro encontrado com esses filtros"
                : "Nenhum log disponível"}
            </p>
            <p className="mt-2 text-[0.88rem] leading-6 text-[#7a8694]">
              {logSearch || logCategory !== "all" || logPeriod !== "all" || logDepartment !== "all"
                ? "Ajuste os filtros para visualizar outros registros."
                : "Os registros de atividade aparecerão aqui conforme novas ações forem executadas."}
            </p>
          </div>
        )}
      </AdminPanel>

      {/* ── Modal Confirmação Exclusão Secretaria ────────────────────────── */}
      {secretariaPendingRemoval ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={() => setSecretariaPendingRemoval(null)}
        >
          <div
            ref={deleteSecretariaModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-sec-title"
            tabIndex={-1}
            className="w-full max-w-[440px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 id="del-sec-title" className="text-[1.5rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]">
                Remover secretaria?
              </h3>
              <button
                type="button"
                onClick={() => setSecretariaPendingRemoval(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-[18px] border border-[#f0dcdc] bg-[#fff7f7] px-4 py-3">
              <p className="text-[1rem] font-semibold text-[#5d3a3a]">{secretariaPendingRemoval.nome}</p>
              <p className="mt-0.5 text-[0.82rem] text-[#b16c6c]">{secretariaPendingRemoval.setor}</p>
              <p className="mt-2 text-[0.8rem] text-[#c45b5b]">
                Todos os times vinculados a esta secretaria também serão removidos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSecretariaPendingRemoval(null)}
                className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-delete-confirm-focus
                onClick={handleConfirmRemoveSecretaria}
                className="h-11 w-full rounded-full bg-[#d86b6b] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(216,107,107,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ca5a5a] sm:w-auto"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Modal Confirmação Exclusão Time ──────────────────────────────── */}
      {timePendingRemoval ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={() => setTimePendingRemoval(null)}
        >
          <div
            ref={deleteTimeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-time-title"
            tabIndex={-1}
            className="w-full max-w-[440px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 id="del-time-title" className="text-[1.5rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]">
                Remover time?
              </h3>
              <button
                type="button"
                onClick={() => setTimePendingRemoval(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-[18px] border border-[#f0dcdc] bg-[#fff7f7] px-4 py-3">
              <p className="text-[1rem] font-semibold text-[#5d3a3a]">{timePendingRemoval.nome}</p>
              <p className="mt-0.5 text-[0.82rem] text-[#b16c6c]">
                {timePendingRemoval.setor} · {timePendingRemoval.secretariaNome}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTimePendingRemoval(null)}
                className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-delete-confirm-focus
                onClick={handleConfirmRemoveTime}
                className="h-11 w-full rounded-full bg-[#d86b6b] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(216,107,107,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ca5a5a] sm:w-auto"
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Modal Nova Secretaria ─────────────────────────────────────────── */}
      {isSecretariaModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={() => { setIsSecretariaModalOpen(false); setSecretariaFormError(""); }}
        >
          <div
            ref={secretariaModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="secretaria-dialog-title"
            tabIndex={-1}
            className="w-full max-w-[480px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 id="secretaria-dialog-title" className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]">
                Nova secretaria
              </h3>
              <button
                type="button"
                onClick={() => { setIsSecretariaModalOpen(false); setSecretariaFormError(""); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmitSecretaria}>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Nome da secretaria
                <input
                  type="text"
                  value={secretariaForm.nome}
                  onChange={(e) => setSecretariaForm((c) => ({ ...c, nome: e.target.value }))}
                  data-modal-initial-focus
                  placeholder="Ex.: Secretaria de Educação"
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Setor
                <input
                  type="text"
                  value={secretariaForm.setor}
                  onChange={(e) => setSecretariaForm((c) => ({ ...c, setor: e.target.value }))}
                  placeholder="Ex.: Educação"
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>
              {secretariaFormError ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-[0.9rem] font-medium text-[#be3232]">{secretariaFormError}</p>
              ) : null}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setIsSecretariaModalOpen(false); setSecretariaFormError(""); }}
                  className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Salvar secretaria
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── Modal Novo Time ───────────────────────────────────────────────── */}
      {isTimeModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={() => { setIsTimeModalOpen(false); setTimeFormError(""); }}
        >
          <div
            ref={timeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-dialog-title"
            tabIndex={-1}
            className="w-full max-w-[480px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 id="time-dialog-title" className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]">
                Novo time
              </h3>
              <button
                type="button"
                onClick={() => { setIsTimeModalOpen(false); setTimeFormError(""); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmitTime}>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Nome do time
                <input
                  type="text"
                  value={timeForm.nome}
                  onChange={(e) => setTimeForm((c) => ({ ...c, nome: e.target.value }))}
                  data-modal-initial-focus
                  placeholder="Ex.: Planejamento Estratégico"
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Setor
                <input
                  type="text"
                  value={timeForm.setor}
                  onChange={(e) => setTimeForm((c) => ({ ...c, setor: e.target.value }))}
                  placeholder="Ex.: Planejamento"
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Secretaria responsável
                <select
                  value={timeForm.secretariaId}
                  onChange={(e) => setTimeForm((c) => ({ ...c, secretariaId: e.target.value }))}
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                >
                  {secretarias.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.nome}</option>
                  ))}
                </select>
              </label>
              {timeFormError ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-[0.9rem] font-medium text-[#be3232]">{timeFormError}</p>
              ) : null}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setIsTimeModalOpen(false); setTimeFormError(""); }}
                  className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Salvar time
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={closeModal}
        >
          <div
            ref={createEmployeeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-employee-dialog-title"
            tabIndex={-1}
            data-modal-surface="dialog"
            className="w-full max-w-[540px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3
                  id="create-employee-dialog-title"
                  className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]"
                >
                  Cadastrar funcionário
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                  Nome
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    data-modal-initial-focus
                    className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                  />
                </label>

                <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                  E-mail
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="nome.sobrenome@barueri.sp.gov.br"
                    className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                  />
                  <span className="text-[0.76rem] font-medium text-[#9aa7b2]">
                    Apenas emails institucionais @barueri.sp.gov.br
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                  Setor
                  <select
                    value={formValues.department}
                    onChange={(event) => handleDepartmentChange(event.target.value)}
                    className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                  >
                    {organization.map((entry) => (
                      <option key={entry.department} value={entry.department}>
                        {entry.department}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                  Equipe
                  <select
                    value={formValues.team}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        team: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                  >
                    {teamOptions.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {formError ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-[0.9rem] font-medium text-[#be3232]">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Salvar funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {employeePendingRemoval ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={closeDeleteConfirmationModal}
        >
          <div
            ref={deleteEmployeeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-employee-dialog-title"
            aria-describedby="delete-employee-dialog-description"
            tabIndex={-1}
            data-modal-surface="dialog"
            className="w-full max-w-[540px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3
                  id="delete-employee-dialog-title"
                  className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]"
                >
                  Confirmar exclusão
                </h3>
                <p
                  id="delete-employee-dialog-description"
                  className="mt-1 text-[0.92rem] font-medium text-[#8a8a8a]"
                >
                  Confirme seu e-mail e sua senha para evitar remoções por engano.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDeleteConfirmationModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar confirmação de exclusão"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-[20px] border border-[#f0dcdc] bg-[#fff7f7] px-4 py-4">
              <div className="flex items-center gap-3">
                <AdminAvatar
                  name={employeePendingRemoval.name}
                  sizeClassName="h-11 w-11"
                  textClassName="text-[0.9rem]"
                  className="shadow-none"
                />
                <div>
                  <p className="text-[1rem] font-semibold text-[#5d3a3a]">
                    {employeePendingRemoval.name}
                  </p>
                  <p className="text-[0.82rem] font-medium text-[#b16c6c]">
                    {employeePendingRemoval.email}
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleRemoveEmployee}>
              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                E-mail institucional do administrador
                <input
                  type="email"
                  value={deleteConfirmationForm.email}
                  onChange={(event) =>
                    handleDeleteConfirmationFieldChange("email", event)
                  }
                  data-modal-initial-focus
                  placeholder={user?.email ?? "admin@barueri.sp.gov.br"}
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>

              <label className="flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]">
                Senha
                <input
                  type="password"
                  value={deleteConfirmationForm.password}
                  onChange={(event) =>
                    handleDeleteConfirmationFieldChange("password", event)
                  }
                  className="h-12 rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] outline-none focus:border-[#72a8d4]"
                />
              </label>

              {deleteConfirmationError ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-[0.9rem] font-medium text-[#be3232]">
                  {deleteConfirmationError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteConfirmationModal}
                  className="h-11 w-full rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9] sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-[#d86b6b] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(216,107,107,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ca5a5a] sm:w-auto"
                >
                  Excluir funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
