import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import {
  AdminAvatar,
  AdminPanel,
  AdminStatusChip,
} from "../../components/AdminConsole";
import { useAdminConsole, useAuth } from "../../context";
import { useModalAccessibility } from "../../hooks";
import { formatDateTime } from "../../lib/formatters";
import type {
  EmployeeDirectoryEntry,
  NewEmployeePayload,
} from "../../types/admin";
import type { AccountStatus } from "../../types/auth";

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

export default function AdminAdministrationPage() {
  const {
    activityLog,
    addEmployee,
    canManageEmployees,
    employees,
    organization,
    removeEmployee,
  } = useAdminConsole();
  const { user, verifyCurrentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeePendingRemoval, setEmployeePendingRemoval] =
    useState<EmployeeDirectoryEntry | null>(null);
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
        "Preencha nome, email, setor e equipe para cadastrar o funcionário.",
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
        "Confirme email institucional e senha antes de excluir o funcionário.",
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-4 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5"
              >
                <FiPlus className="h-4.5 w-4.5" />
                Novo funcionário
              </button>
            ) : null}

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 appearance-none rounded-full bg-[#f1f1f4] px-4 pr-10 text-[0.9rem] font-medium text-[#818181] outline-none"
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

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                <th className="pb-1">Nome</th>
                <th className="pb-1">Equipe</th>
                <th className="pb-1">Setor</th>
                <th className="pb-1">Estado</th>
                {canManageEmployees ? <th className="pb-1">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="text-[0.95rem] font-medium text-[#7a7a7a]">
                  <td className="rounded-l-[18px] bg-white/72 px-0 py-1.5">
                    <div className="flex items-center gap-3 px-4">
                      <AdminAvatar
                        name={employee.name}
                        sizeClassName="h-8.5 w-8.5"
                        textClassName="text-[0.78rem]"
                        className="shadow-none"
                      />
                      <div>
                        <p className="text-[0.96rem] text-[#747474]">{employee.name}</p>
                        <p className="text-[0.76rem] text-[#b1b1b1]">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="bg-white/72 px-4 py-1.5 text-[0.92rem] text-[#9b9b9b]">
                    {employee.team}
                  </td>
                  <td className="bg-white/72 px-4 py-1.5 text-[0.92rem] text-[#9b9b9b]">
                    {employee.department}
                  </td>
                  <td className={`${canManageEmployees ? "" : "rounded-r-[18px]"} bg-white/72 px-4 py-1.5`}>
                    <AdminStatusChip
                      tone={employee.status}
                      label={employee.status === "active" ? "Ativo" : "Inativo"}
                    />
                  </td>
                  {canManageEmployees ? (
                    <td className="rounded-r-[18px] bg-white/72 px-4 py-1.5">
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
      </AdminPanel>

      <AdminPanel className="space-y-5 px-5 py-5 sm:px-7">
        <div>
          <h2 className="text-[1.6rem] font-bold tracking-[-0.03em] text-[#262626]">
            Log de Atividades
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <thead>
              <tr className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
                <th className="pb-1">Data</th>
                <th className="pb-1">Equipe</th>
                <th className="pb-1">Fonte</th>
                <th className="pb-1">Tipo</th>
                <th className="pb-1">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {activityLog.map((entry) => (
                <tr key={entry.id} className="text-[0.9rem] font-medium text-[#7a7a7a]">
                  <td className="rounded-l-[18px] bg-white/72 px-4 py-3 text-[#9b9b9b]">
                    {formatDateTime(entry.timestamp)}
                  </td>
                  <td className="bg-white/72 px-4 py-3 text-[#9b9b9b]">
                    <p>{entry.team}</p>
                    <p className="text-[0.76rem] text-[#b1b1b1]">{entry.department}</p>
                  </td>
                  <td className="bg-white/72 px-4 py-3 font-bold text-[#353535]">
                    {entry.source}
                  </td>
                  <td className="bg-white/72 px-4 py-3">
                    <span className="rounded-full bg-[#dcebfa] px-3 py-1 text-[0.78rem] font-semibold text-[#3d83bc]">
                      {entry.type}
                    </span>
                  </td>
                  <td className="rounded-r-[18px] bg-white/72 px-4 py-3 text-[#7a7a7a]">
                    {entry.userName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#142133]/40 px-4 py-6 backdrop-blur-[3px]"
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
                  Email
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
                  className="h-11 rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5"
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
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#142133]/40 px-4 py-6 backdrop-blur-[3px]"
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
                  Confirme seu email e sua senha para evitar remoções por engano.
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
                Email institucional do administrador
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
                  className="h-11 rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-full bg-[#d86b6b] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(216,107,107,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ca5a5a]"
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
