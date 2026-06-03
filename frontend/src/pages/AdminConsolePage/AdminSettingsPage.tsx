import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiLoader,
  FiLock,
  FiMail,
  FiMoon,
  FiShield,
  FiSun,
  FiType,
  FiX,
} from "react-icons/fi";
import { AdminPanel } from "../../components/AdminConsole";
import { useSystemPreferences } from "../../context";
import { useModalAccessibility, useTheme } from "../../hooks";

type DocumentKey = "terms" | "privacy" | null;

type ToastState = {
  kind: "success" | "error";
  message: string;
};

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] px-5 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/35 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0";
const secondaryButtonClass =
  "theme-secondary-button inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d7dde4] bg-white/88 px-5 text-[0.92rem] font-semibold text-[#5f6f7d] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25 disabled:cursor-not-allowed disabled:opacity-65";
const subtlePanelClass =
  "theme-subtle-panel border border-[#edf1f5] bg-[#f9fbfd] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]";

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

function FeedbackToast({ kind, message }: ToastState) {
  const isSuccess = kind === "success";

  return (
    <div
      data-toast-surface={isSuccess ? "success" : "error"}
      className={`fixed right-4 top-4 z-50 flex max-w-[320px] items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_40px_rgba(20,33,51,0.18)] backdrop-blur-[6px] sm:right-6 sm:top-6 ${
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

function SettingsCard({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon: IconType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AdminPanel className={`space-y-5 px-5 py-5 sm:px-7 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#6eadde_0%,#1574b8_100%)] text-white shadow-[0_12px_24px_rgba(22,117,184,0.18)]">
          <Icon className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[1.35rem] font-bold tracking-[-0.03em] text-[#262626]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[0.92rem] font-medium text-[#8f98a1]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </AdminPanel>
  );
}

function ToggleSwitch({
  checked,
  onToggle,
  label,
  description,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <div
      data-settings-toggle="surface"
      className="flex items-start justify-between gap-4 rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4"
    >
      <div className="max-w-[420px]">
        <p className="text-[0.98rem] font-semibold text-[#26313b]">{label}</p>
        <p className="mt-1 text-[0.86rem] font-medium leading-6 text-[#8a949d]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        data-settings-toggle="track"
        data-checked={checked ? "true" : "false"}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-13 shrink-0 rounded-full border transition focus:outline-none focus:ring-4 focus:ring-[#7fb4db]/30 ${
          checked
            ? "border-[#1675b8] bg-[linear-gradient(90deg,#7fb4db_0%,#1675b8_100%)]"
            : "border-[#d7dde4] bg-[#e9eef3]"
        }`}
      >
        <span
          data-settings-toggle="thumb"
          data-checked={checked ? "true" : "false"}
          className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_4px_10px_rgba(20,33,51,0.16)] transition-transform ${
            checked ? "translate-x-[1.55rem]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function DocumentModal({
  documentKey,
  onClose,
}: {
  documentKey: DocumentKey;
  onClose: () => void;
}) {
  const modalRef = useModalAccessibility({
    isOpen: documentKey !== null,
    onClose,
    initialFocusSelector: "[data-modal-initial-focus]",
  });

  if (!documentKey) {
    return null;
  }

  const isTerms = documentKey === "terms";
  const title = isTerms ? "Termos de uso" : "Política de privacidade";
  const intro = isTerms
    ? "Conteúdo preliminar para os termos de uso do sistema."
    : "Conteúdo preliminar para a política de privacidade do sistema.";
  const titleId = isTerms
    ? "settings-terms-dialog-title"
    : "settings-privacy-dialog-title";
  const descriptionId = isTerms
    ? "settings-terms-dialog-description"
    : "settings-privacy-dialog-description";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#142133]/40 px-4 py-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-modal-surface="dialog"
        className="w-full max-w-[560px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(20,33,51,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3
              id={titleId}
              className="text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#1f1f1f]"
            >
              {title}
            </h3>
            <p
              id={descriptionId}
              className="mt-1 text-[0.92rem] font-medium text-[#8a8a8a]"
            >
              Conteúdo provisório pronto para receber o material oficial da equipe.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-modal-initial-focus
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
            aria-label={`Fechar modal de ${title.toLowerCase()}`}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className={`space-y-4 rounded-[20px] px-5 py-5 ${subtlePanelClass}`}>
          <p className="text-[0.96rem] font-semibold text-[#2b3640]">{intro}</p>
          <p className="text-[0.9rem] font-medium leading-7 text-[#6f7f8c]">
            Este espaço pode receber a redação oficial, versões, data de
            vigência e informações legais do projeto Apresentação Inteligente
            Barueri sem alterar a estrutura da interface.
          </p>
          <p className="text-[0.9rem] font-medium leading-7 text-[#6f7f8c]">
            Enquanto isso, a tela permanece preparada para uma integração futura
            com conteúdo dinâmico vindo de API ou CMS institucional.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const {
    highContrast,
    setHighContrast,
    setTheme,
    theme,
  } = useTheme();
  const {
    hasPendingChanges,
    preferences,
    savePreferences,
    updatePreference,
  } = useSystemPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [openDocument, setOpenDocument] = useState<DocumentKey>(null);
  const isFirstRenderRef = useRef(true);

  function showToast(kind: ToastState["kind"], message: string) {
    setToast({ kind, message });
  }

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

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    if (preferences.keyboardNavigation) {
      showToast(
        "success",
        "Navegação por teclado reforçada. Use Tab, Esc e os atalhos Alt+1 a Alt+5.",
      );
      return;
    }

    showToast(
      "success",
      "Navegação por teclado reforçada desativada. O site continua navegável por Tab.",
    );
  }, [preferences.keyboardNavigation]);

  function handleThemeSelection(nextTheme: "light" | "dark") {
    if (theme === nextTheme) {
      return;
    }

    setTheme(nextTheme);
    showToast(
      "success",
      highContrast
        ? `Tema ${nextTheme === "dark" ? "escuro" : "claro"} definido como base. O alto contraste continua ativo.`
        : `Tema ${nextTheme === "dark" ? "escuro" : "claro"} aplicado. Clique em salvar para manter essa preferência.`,
    );
  }

  function handleHighContrastToggle() {
    const nextValue = !highContrast;

    setHighContrast(nextValue);
    showToast(
      "success",
      nextValue
        ? "Alto contraste ativado. Clique em salvar para manter essa preferência."
        : `Alto contraste desativado. O tema ${theme === "dark" ? "escuro" : "claro"} voltou a ser exibido.`,
    );
  }

  function handleKeyboardNavigationToggle() {
    updatePreference(
      "keyboardNavigation",
      !preferences.keyboardNavigation,
    );
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    await waitForMockRequest();

    const result = savePreferences();

    setIsSaving(false);

    if (!result.ok) {
      showToast(
        "error",
        "message" in result
          ? result.message
          : "Não foi possível salvar as configurações localmente.",
      );
      return;
    }

    showToast("success", "Configurações aplicadas e salvas com sucesso.");
  }

  async function handleCopyEmail() {
    const email = "apresentacoesinteligentes@barueri.sp.gov.br";

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const temporaryField = document.createElement("textarea");
        temporaryField.value = email;
        temporaryField.setAttribute("readonly", "");
        temporaryField.style.position = "absolute";
        temporaryField.style.left = "-9999px";
        document.body.appendChild(temporaryField);
        temporaryField.select();
        document.execCommand("copy");
        document.body.removeChild(temporaryField);
      }

      showToast("success", "E-mail copiado com sucesso.");
    } catch {
      showToast("error", "Não foi possível copiar o e-mail.");
    }
  }

  return (
    <>
      <section className="space-y-7">
        <div>
          <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            Configurações
          </h1>
          <p className="page-subtitle mt-1 text-[1rem] font-medium text-[#878787]">
            Gerencie suas preferências do sistema
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SettingsCard
            title="Aparência"
            description="Escolha o tema preferido para sua experiência no sistema."
            icon={highContrast ? FiShield : theme === "light" ? FiSun : FiMoon}
          >
            <div className={`rounded-[20px] p-4 ${subtlePanelClass}`}>
              <div
                className="inline-flex w-full flex-col gap-2 rounded-[18px] bg-white/88 p-2 sm:flex-row"
                role="group"
                aria-label="Seleção de tema"
              >
                <button
                  type="button"
                  aria-pressed={theme === "light"}
                  data-theme-option="light"
                  data-selected={theme === "light" ? "true" : "false"}
                  onClick={() => handleThemeSelection("light")}
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-4 text-[0.95rem] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25 ${
                    theme === "light"
                      ? "bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)]"
                      : "text-[#587185] hover:bg-[#edf5fb]"
                  }`}
                >
                  <FiSun className="h-4.5 w-4.5" />
                  Tema claro
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  data-theme-option="dark"
                  data-selected={theme === "dark" ? "true" : "false"}
                  onClick={() => handleThemeSelection("dark")}
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-4 text-[0.95rem] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25 ${
                    theme === "dark"
                      ? "bg-[linear-gradient(90deg,#335a78_0%,#142133_100%)] text-white shadow-[0_10px_24px_rgba(20,33,51,0.24)]"
                      : "text-[#587185] hover:bg-[#edf5fb]"
                  }`}
                >
                  <FiMoon className="h-4.5 w-4.5" />
                  Tema escuro
                </button>
              </div>

              <p className="mt-3 text-[0.85rem] font-medium text-[#8794a0]">
                O tema é aplicado em tempo real. Use o botão de salvar para
                persistir a preferência no navegador.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Idioma"
            description="Idioma ativo e recursos planejados para tradução automática."
            icon={FiGlobe}
          >
            <div className={`space-y-4 rounded-[20px] p-4 ${subtlePanelClass}`}>
              <div className="flex flex-col gap-3 rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.98rem] font-semibold text-[#26313b]">
                    Português
                  </p>
                  <p className="mt-1 text-[0.86rem] font-medium text-[#8a949d]">
                    Idioma principal da interface atual.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  aria-label="Traduzir com Google em breve"
                  aria-disabled="true"
                  className={secondaryButtonClass}
                >
                  <FiExternalLink className="h-4.5 w-4.5" />
                  Traduzir com Google
                </button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7ea] px-3 py-1.5 text-[0.78rem] font-semibold text-[#b47c17]">
                <FiClock className="h-4 w-4" />
                Em breve
              </div>

              <p className="text-[0.84rem] font-medium leading-6 text-[#8c98a3]">
                Recurso previsto para integração futura com o Google Tradutor.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Acessibilidade"
            description="Ajuste recursos de apoio para melhorar sua navegação."
            icon={FiType}
          >
            <div className="space-y-3">
              <ToggleSwitch
                checked={highContrast}
                onToggle={handleHighContrastToggle}
                label="Alto contraste"
                description="Aumenta o contraste entre textos, botões e fundos para melhorar a leitura."
              />
              <ToggleSwitch
                checked={preferences.keyboardNavigation}
                onToggle={handleKeyboardNavigationToggle}
                label="Navegação pelo teclado"
                description="Facilita o uso do sistema sem mouse, com foco visual reforçado e atalhos de navegação."
              />
            </div>

            <p className="text-[0.84rem] font-medium leading-6 text-[#8c98a3]">
              Quando ativa, a navegação pelo teclado reforça o foco visível e
              libera atalhos Alt+1, Alt+2, Alt+3, Alt+4 e Alt+5 para navegar
              pelo sistema.
            </p>

            {preferences.keyboardNavigation ? (
              <div className={`rounded-[18px] px-4 py-4 ${subtlePanelClass}`}>
                <p className="text-[0.86rem] font-semibold text-[#26313b]">
                  Atalhos ativos
                </p>
                <p className="mt-2 text-[0.82rem] leading-6 text-[#8a949d]">
                  Alt+1 Projetos, Alt+2 Minha conta, Alt+3 Configurações,
                  Alt+4 Criar apresentação, Alt+5 Dados (quando disponível).
                </p>
              </div>
            ) : null}
          </SettingsCard>

          <SettingsCard
            title="Termos e privacidade"
            description="Acesse documentos importantes do sistema e da equipe do projeto."
            icon={FiShield}
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setOpenDocument("terms")}
                className="flex w-full items-center justify-between rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4 text-left transition hover:bg-[#f6f9fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#edf5fb] text-[#3d83bc]">
                    <FiFileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[0.96rem] font-semibold text-[#26313b]">
                      Ver termos de uso
                    </p>
                    <p className="text-[0.82rem] font-medium text-[#8a949d]">
                      Conteúdo provisório preparado para o texto oficial.
                    </p>
                  </div>
                </div>
                <FiExternalLink className="h-4.5 w-4.5 text-[#8fa0ad]" />
              </button>

              <button
                type="button"
                onClick={() => setOpenDocument("privacy")}
                className="flex w-full items-center justify-between rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4 text-left transition hover:bg-[#f6f9fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#edf5fb] text-[#3d83bc]">
                    <FiLock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[0.96rem] font-semibold text-[#26313b]">
                      Ver política de privacidade
                    </p>
                    <p className="text-[0.82rem] font-medium text-[#8a949d]">
                      Estrutura pronta para receber o conteúdo definitivo.
                    </p>
                  </div>
                </div>
                <FiExternalLink className="h-4.5 w-4.5 text-[#8fa0ad]" />
              </button>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Contato"
            description="Canal direto da equipe responsável pelo projeto."
            icon={FiMail}
            className="xl:col-span-2"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className={`rounded-[20px] px-5 py-5 ${subtlePanelClass}`}>
                <p className="text-[0.98rem] font-semibold text-[#26313b]">
                  Entre em contato com a equipe do projeto
                </p>
                <a
                  href="mailto:apresentacoesinteligentes@barueri.sp.gov.br"
                  className="mt-3 inline-flex items-center gap-2 text-[0.94rem] font-semibold text-[#3d83bc] transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
                >
                  <FiMail className="h-4.5 w-4.5" />
                  apresentacoesinteligentes@barueri.sp.gov.br
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className={secondaryButtonClass}
              >
                <FiCopy className="h-4.5 w-4.5" />
                Copiar e-mail
              </button>
            </div>
          </SettingsCard>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving || !hasPendingChanges}
            className={`${primaryButtonClass} min-w-[220px]`}
          >
            {isSaving ? (
              <LoadingLabel>Salvando...</LoadingLabel>
            ) : (
              hasPendingChanges ? "Salvar configurações" : "Configurações salvas"
            )}
          </button>
        </div>
      </section>

      <DocumentModal
        documentKey={openDocument}
        onClose={() => setOpenDocument(null)}
      />

      {toast ? <FeedbackToast kind={toast.kind} message={toast.message} /> : null}
    </>
  );
}
