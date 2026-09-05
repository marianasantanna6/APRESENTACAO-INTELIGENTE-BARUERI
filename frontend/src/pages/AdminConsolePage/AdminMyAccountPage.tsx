import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useId, useState } from "react";
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiLoader,
  FiLock,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AdminAvatar, AdminPanel } from "../../components/AdminConsole";
import { useModalAccessibility } from "../../hooks";
import { useAuth } from "../../context";
import { formatCpf } from "../../lib/formatters";
import { ROUTE_PATHS } from "../../router/paths";

type ToastState = {
  kind: "success" | "error";
  message: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const readOnlyInputClass =
  "h-12 w-full rounded-[16px] border border-[#dde2e8] bg-[#f9fbfc] px-4 text-[0.95rem] font-medium text-[#1f1f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none";
const fieldLabelClass =
  "flex flex-col gap-2 text-[0.86rem] font-semibold text-[#656565]";
const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0";
const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d7dde4] px-5 text-[0.92rem] font-semibold text-[#6a6a6a] transition hover:bg-[#f5f7f9]";
const passwordButtonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#edf5fb] px-4 text-[0.9rem] font-semibold text-[#3d83bc] transition hover:bg-[#e1eef8]";
const destructiveButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#f2d8d8] bg-[#fff5f5] px-5 text-[0.92rem] font-semibold text-[#bd5d5d] transition hover:bg-[#ffeded]";
const acceptedImageTypes = ["image/png", "image/jpeg"];
const initialPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function waitForMockRequest(duration = 850) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function LoadingLabel({ children }: { children: string }) {
  return (
    <>
      <FiLoader className="h-4.5 w-4.5 animate-spin" />
      {children}
    </>
  );
}

function AccountField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className={fieldLabelClass}>
      {label}
      <input type="text" value={value} readOnly className={readOnlyInputClass} />
    </label>
  );
}

function FeedbackToast({ kind, message }: ToastState) {
  const isSuccess = kind === "success";

  return (
    <div
      data-toast-surface={isSuccess ? "success" : "error"}
      className={`fixed left-4 right-4 top-4 z-50 flex max-w-[320px] items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_40px_rgba(20,33,51,0.18)] backdrop-blur-[6px] sm:left-auto sm:right-6 sm:top-6 ${
        isSuccess
          ? "border-[#d8ece1] bg-white/92 text-[#2f6f4b]"
          : "border-[#f2d7d7] bg-white/92 text-[#a44a4a]"
      }`}
      role="status"
      aria-live="polite"
    >
      {isSuccess ? (
        <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <p className="text-[0.9rem] font-semibold leading-6">{message}</p>
    </div>
  );
}

export default function AdminMyAccountPage() {
  const navigate = useNavigate();
  const { changePassword, logout, updateAccount, user } = useAuth();
  const avatarInputId = useId();
  const [draftAvatarDataUrl, setDraftAvatarDataUrl] = useState<string | null>(
    user?.avatarDataUrl ?? null,
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(
    initialPasswordForm,
  );
  const [passwordError, setPasswordError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setDraftAvatarDataUrl(user?.avatarDataUrl ?? null);
  }, [user?.avatarDataUrl]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  if (!user) {
    return null;
  }

  const hasPendingProfileChanges =
    (draftAvatarDataUrl ?? null) !== (user.avatarDataUrl ?? null);

  function showToast(kind: ToastState["kind"], message: string) {
    setToast({ kind, message });
  }

  function resetPasswordForm() {
    setPasswordForm(initialPasswordForm);
    setPasswordError("");
  }

  function closePasswordModal() {
    resetPasswordForm();
    setIsPasswordModalOpen(false);
  }

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      showToast("error", "Envie uma imagem PNG ou JPG para a foto de perfil.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftAvatarDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function handleSaveProfile() {
    if (!hasPendingProfileChanges) {
      return;
    }

    setIsSavingProfile(true);
    await waitForMockRequest();

    const result = updateAccount({ avatarDataUrl: draftAvatarDataUrl });

    setIsSavingProfile(false);

    if ("message" in result) {
      showToast("error", result.message);
      return;
    }

    showToast("success", "Alterações salvas com sucesso.");
  }

  function updatePasswordField(
    field: keyof PasswordFormState,
    value: string,
  ) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordError("");
  }

  function validatePasswordForm() {
    if (
      !passwordForm.currentPassword.trim()
      || !passwordForm.newPassword.trim()
      || !passwordForm.confirmPassword.trim()
    ) {
      return "Preencha a senha atual, a nova senha e a confirmação.";
    }

    if (passwordForm.newPassword.trim().length < 6) {
      return "A nova senha precisa ter pelo menos 6 caracteres.";
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      return "A nova senha precisa ser diferente da senha atual.";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return "A confirmação da nova senha não confere.";
    }

    return "";
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validatePasswordForm();

    if (validationMessage) {
      setPasswordError(validationMessage);
      return;
    }

    setIsSavingPassword(true);
    await waitForMockRequest();

    const result = changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    setIsSavingPassword(false);

    if ("message" in result) {
      setPasswordError(result.message);
      return;
    }

    closePasswordModal();
    showToast("success", "Senha alterada com sucesso.");
  }

  const passwordModalRef = useModalAccessibility({
    isOpen: isPasswordModalOpen,
    onClose: closePasswordModal,
    initialFocusSelector: "[data-modal-initial-focus]",
  });

  return (
    <>
      <section className="space-y-7">
        <div>
          <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            Minha Conta
          </h1>
          <p className="page-subtitle mt-1 text-[1rem] font-medium text-[#878787]">
            Visualize seus dados de acesso e gerencie sua foto e senha.
          </p>
        </div>

        <AdminPanel className="mx-auto max-w-[860px] overflow-hidden px-0 py-0">
          <div className="h-30 bg-[linear-gradient(135deg,rgba(127,180,219,0.34)_0%,rgba(22,117,184,0.18)_52%,rgba(20,33,51,0.16)_100%)]" />

          <div className="px-5 pb-6 sm:px-7 sm:pb-7">
            <div className="-mt-14 flex flex-col items-center text-center">
              <div className="relative">
                <AdminAvatar
                  name={user.name}
                  imageSrc={draftAvatarDataUrl}
                  sizeClassName="h-28 w-28 sm:h-32 sm:w-32"
                  textClassName="text-[1.45rem] sm:text-[1.8rem]"
                  className="ring-6 ring-white"
                />

                <label
                  htmlFor={avatarInputId}
                  className="absolute bottom-1 right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5"
                  aria-label="Editar foto de perfil"
                >
                  <FiCamera className="h-4.5 w-4.5" />
                </label>
                <input
                  id={avatarInputId}
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="mt-4 space-y-1">
                <h2 className="text-[1.55rem] font-bold tracking-[-0.04em] text-[#262626] sm:text-[1.8rem]">
                  {user.name}
                </h2>
                <p className="text-[0.9rem] font-medium text-[#a0a8b0]">
                  {user.department} • {user.team}
                </p>
                <p className="pt-1 text-[0.84rem] font-medium text-[#8aa1b3]">
                  PNG e JPG aceitos.
                </p>
              </div>

              {hasPendingProfileChanges ? (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#edf7ff] px-4 py-2 text-[0.82rem] font-semibold text-[#3d83bc]">
                  <FiCamera className="h-4 w-4" />
                  Nova foto pronta para salvar
                </span>
              ) : null}
            </div>

            <div className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <AccountField label="CPF" value={formatCpf(user.cpf)} />
                <AccountField
                  label="E-mail institucional"
                  value={user.email}
                />
              </div>

              <AccountField label="Senha" value="********" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {hasPendingProfileChanges || isSavingProfile ? (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className={`${primaryButtonClass} w-full sm:col-span-2`}
                >
                  {isSavingProfile ? (
                    <LoadingLabel>Salvando...</LoadingLabel>
                  ) : (
                    "Salvar alterações"
                  )}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className={passwordButtonClass}
              >
                <FiLock className="h-4.5 w-4.5" />
                Alterar senha
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className={`${destructiveButtonClass} w-full`}
              >
                <FiLogOut className="h-4.5 w-4.5" />
                Sair da conta
              </button>
            </div>
          </div>
        </AdminPanel>
      </section>

      {isPasswordModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
          onClick={closePasswordModal}
        >
          <div
            ref={passwordModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-dialog-title"
            aria-describedby="change-password-dialog-description"
            tabIndex={-1}
            data-modal-surface="dialog"
            className="w-full max-w-[540px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3
                  id="change-password-dialog-title"
                  className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]"
                >
                  Alterar senha
                </h3>
                <p
                  id="change-password-dialog-description"
                  className="mt-1 text-[0.92rem] font-medium text-[#8a8a8a]"
                >
                  Atualize sua senha com validação básica antes de salvar.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3]"
                aria-label="Fechar modal de alteração de senha"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <label className={fieldLabelClass}>
                Senha atual
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    updatePasswordField("currentPassword", event.target.value)
                  }
                  data-modal-initial-focus
                  className={`${readOnlyInputClass} shadow-none focus:border-[#72a8d4]`}
                />
              </label>

              <label className={fieldLabelClass}>
                Nova senha
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    updatePasswordField("newPassword", event.target.value)
                  }
                  className={`${readOnlyInputClass} shadow-none focus:border-[#72a8d4]`}
                />
              </label>

              <label className={fieldLabelClass}>
                Confirmar nova senha
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    updatePasswordField("confirmPassword", event.target.value)
                  }
                  className={`${readOnlyInputClass} shadow-none focus:border-[#72a8d4]`}
                />
              </label>

              {passwordError ? (
                <p className="rounded-[16px] bg-[#fff5f5] px-4 py-3 text-[0.9rem] font-medium text-[#be3232]">
                  {passwordError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                  disabled={isSavingPassword}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`${primaryButtonClass} w-full sm:w-auto`}
                  disabled={isSavingPassword}
                >
                  {isSavingPassword ? (
                    <LoadingLabel>Salvando...</LoadingLabel>
                  ) : (
                    "Salvar nova senha"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <FeedbackToast kind={toast.kind} message={toast.message} /> : null}
    </>
  );
}
