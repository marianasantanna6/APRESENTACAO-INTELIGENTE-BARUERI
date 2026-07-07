import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertCircle,
  FiCheckCircle,
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
import { useTranslation } from "react-i18next";
import { AdminPanel } from "../../components/AdminConsole";
import { useSystemPreferences } from "../../context";
import { useModalAccessibility, useTheme } from "../../hooks";
import type { UILanguage } from "../../types/i18n";
import { UI_LANGUAGE_LABELS } from "../../types/i18n";

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
      <FiLoader className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
      {children}
    </>
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
        <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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
          <Icon className="h-5.5 w-5.5" aria-hidden="true" />
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
      className="flex flex-col gap-4 rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="max-w-full sm:max-w-[420px]">
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
  const { t } = useTranslation();
  const modalRef = useModalAccessibility({
    isOpen: documentKey !== null,
    onClose,
    initialFocusSelector: "[data-modal-initial-focus]",
  });

  if (!documentKey) {
    return null;
  }

  const isTerms = documentKey === "terms";
  const title = isTerms ? t("settings.termosTitle") : t("settings.privacidadeTitle");
  const intro = isTerms ? t("settings.termosIntro") : t("settings.privacidadeIntro");
  const titleId = isTerms
    ? "settings-terms-dialog-title"
    : "settings-privacy-dialog-title";
  const descriptionId = isTerms
    ? "settings-terms-dialog-description"
    : "settings-privacy-dialog-description";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-[#142133]/40 px-4 py-4 backdrop-blur-[3px] sm:items-center sm:py-6"
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
              {t("settings.documentoProvisorio")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-modal-initial-focus
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f7] text-[#7a7a7a] transition hover:bg-[#e6ecf3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
            aria-label={t("settings.fecharModal", { titulo: title.toLowerCase() })}
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className={`space-y-4 rounded-[20px] px-5 py-5 ${subtlePanelClass}`}>
          <p className="text-[0.96rem] font-semibold text-[#2b3640]">{intro}</p>
          <p className="text-[0.9rem] font-medium leading-7 text-[#6f7f8c]">
            {t("settings.documentoInfo")}
          </p>
          <p className="text-[0.9rem] font-medium leading-7 text-[#6f7f8c]">
            {t("settings.documentoFuturo")}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            {t("common.fechar")}
          </button>
        </div>
      </div>
    </div>
  );
}

const UI_LANGUAGES: UILanguage[] = ["pt-BR", "en-US", "es"];

export default function AdminSettingsPage() {
  const { t } = useTranslation();
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
      showToast("success", t("settings.navTecladoAtivado"));
      return;
    }

    showToast("success", t("settings.navTecladoDesativado"));
  }, [preferences.keyboardNavigation, t]);

  function handleThemeSelection(nextTheme: "light" | "dark") {
    if (theme === nextTheme) {
      return;
    }

    setTheme(nextTheme);
    const temaLabel = nextTheme === "dark"
      ? t("settings.temaEscuroLabel")
      : t("settings.temaClaroLabel");

    showToast(
      "success",
      highContrast
        ? t("settings.temaBaseAltoContraste", { tema: temaLabel })
        : t("settings.temaAplicado", { tema: temaLabel }),
    );
  }

  function handleHighContrastToggle() {
    const nextValue = !highContrast;
    const temaLabel = theme === "dark"
      ? t("settings.temaEscuroLabel")
      : t("settings.temaClaroLabel");

    setHighContrast(nextValue);
    showToast(
      "success",
      nextValue
        ? t("settings.altoContrasteAtivado")
        : t("settings.altoContrasteDesativado", { tema: temaLabel }),
    );
  }

  function handleKeyboardNavigationToggle() {
    updatePreference(
      "keyboardNavigation",
      !preferences.keyboardNavigation,
    );
  }

  function handleLanguageSelection(lang: UILanguage) {
    if (preferences.uiLanguage === lang) {
      return;
    }

    updatePreference("uiLanguage", lang);
    showToast(
      "success",
      t("settings.idiomaAtualizado", { idioma: UI_LANGUAGE_LABELS[lang] }),
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
        "message" in result ? result.message : t("settings.configsErro"),
      );
      return;
    }

    showToast("success", t("settings.configsAplicadas"));
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

      showToast("success", t("settings.emailCopiado"));
    } catch {
      showToast("error", t("settings.erroEmail"));
    }
  }

  return (
    <>
      <section className="space-y-7">
        <div>
          <h1 className="page-title text-[2.2rem] font-extrabold tracking-[-0.05em] text-[#1e1e1e] sm:text-[2.8rem]">
            {t("settings.title")}
          </h1>
          <p className="page-subtitle mt-1 text-[1rem] font-medium text-[#878787]">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* ─── Aparência ────────────────────────────────────────────── */}
          <SettingsCard
            title={t("settings.aparencia")}
            description={t("settings.aparenciaDesc")}
            icon={highContrast ? FiShield : theme === "light" ? FiSun : FiMoon}
          >
            <div className={`rounded-[20px] p-4 ${subtlePanelClass}`}>
              <div
                className="inline-flex w-full flex-col gap-2 rounded-[18px] bg-white/88 p-2 sm:flex-row"
                role="group"
                aria-label={t("settings.selecionarTema")}
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
                  <FiSun className="h-4.5 w-4.5" aria-hidden="true" />
                  {t("settings.temaClaro")}
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
                  <FiMoon className="h-4.5 w-4.5" aria-hidden="true" />
                  {t("settings.temaEscuro")}
                </button>
              </div>

              <p className="mt-3 text-[0.85rem] font-medium text-[#8794a0]">
                {t("settings.temaInfo")}
              </p>
            </div>
          </SettingsCard>

          {/* ─── Idioma ───────────────────────────────────────────────── */}
          <SettingsCard
            title={t("settings.idioma")}
            description={t("settings.idiomaDesc")}
            icon={FiGlobe}
          >
            <div className={`space-y-3 rounded-[20px] p-4 ${subtlePanelClass}`}>
              <div
                className="inline-flex w-full flex-col gap-2 rounded-[18px] bg-white/88 p-2 sm:flex-row"
                role="group"
                aria-label={t("settings.idioma")}
              >
                {UI_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    aria-pressed={preferences.uiLanguage === lang}
                    onClick={() => handleLanguageSelection(lang)}
                    className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 text-[0.88rem] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25 ${
                      preferences.uiLanguage === lang
                        ? "bg-[linear-gradient(90deg,#7fb4db_0%,#6ea7d4_100%)] text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)]"
                        : "text-[#587185] hover:bg-[#edf5fb]"
                    }`}
                  >
                    <FiGlobe className="h-4 w-4" aria-hidden="true" />
                    {UI_LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>

              <p className="text-[0.84rem] font-medium leading-6 text-[#8c98a3]">
                {t("settings.idiomaDesc")}
              </p>
            </div>
          </SettingsCard>

          {/* ─── Acessibilidade ───────────────────────────────────────── */}
          <SettingsCard
            title={t("settings.acessibilidade")}
            description={t("settings.acessibilidadeDesc")}
            icon={FiType}
          >
            <div className="space-y-3">
              <ToggleSwitch
                checked={highContrast}
                onToggle={handleHighContrastToggle}
                label={t("settings.altoContraste")}
                description={t("settings.altoContrasteDesc")}
              />
              <ToggleSwitch
                checked={preferences.keyboardNavigation}
                onToggle={handleKeyboardNavigationToggle}
                label={t("settings.navegacaoTeclado")}
                description={t("settings.navegacaoTecladoDesc")}
              />
            </div>

            <p className="text-[0.84rem] font-medium leading-6 text-[#8c98a3]">
              {t("settings.acessibilidadeInfo")}
            </p>

            {preferences.keyboardNavigation ? (
              <div className={`rounded-[18px] px-4 py-4 ${subtlePanelClass}`}>
                <p className="text-[0.86rem] font-semibold text-[#26313b]">
                  {t("settings.atalhosTitulo")}
                </p>
                <p className="mt-2 text-[0.82rem] leading-6 text-[#8a949d]">
                  {t("settings.atalhosTeclas")}
                </p>
              </div>
            ) : null}
          </SettingsCard>

          {/* ─── Termos e privacidade ─────────────────────────────────── */}
          <SettingsCard
            title={t("settings.termos")}
            description={t("settings.termosDesc")}
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
                    <FiFileText className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[0.96rem] font-semibold text-[#26313b]">
                      {t("settings.verTermos")}
                    </p>
                    <p className="text-[0.82rem] font-medium text-[#8a949d]">
                      {t("settings.verTermosDesc")}
                    </p>
                  </div>
                </div>
                <FiExternalLink className="h-4.5 w-4.5 text-[#8fa0ad]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setOpenDocument("privacy")}
                className="flex w-full items-center justify-between rounded-[18px] border border-[#ebf0f4] bg-white/82 px-4 py-4 text-left transition hover:bg-[#f6f9fc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
              >
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#edf5fb] text-[#3d83bc]">
                    <FiLock className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[0.96rem] font-semibold text-[#26313b]">
                      {t("settings.verPrivacidade")}
                    </p>
                    <p className="text-[0.82rem] font-medium text-[#8a949d]">
                      {t("settings.verPrivacidadeDesc")}
                    </p>
                  </div>
                </div>
                <FiExternalLink className="h-4.5 w-4.5 text-[#8fa0ad]" aria-hidden="true" />
              </button>
            </div>
          </SettingsCard>

          {/* ─── Contato ──────────────────────────────────────────────── */}
          <SettingsCard
            title={t("settings.contato")}
            description={t("settings.contatoDesc")}
            icon={FiMail}
            className="xl:col-span-2"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className={`rounded-[20px] px-5 py-5 ${subtlePanelClass}`}>
                <p className="text-[0.98rem] font-semibold text-[#26313b]">
                  {t("settings.contatoMensagem")}
                </p>
                <a
                  href="mailto:apresentacoesinteligentes@barueri.sp.gov.br"
                  className="mt-3 inline-flex items-center gap-2 text-[0.94rem] font-semibold text-[#3d83bc] transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7fb4db]/25"
                >
                  <FiMail className="h-4.5 w-4.5" aria-hidden="true" />
                  apresentacoesinteligentes@barueri.sp.gov.br
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className={`${secondaryButtonClass} w-full lg:w-auto`}
              >
                <FiCopy className="h-4.5 w-4.5" aria-hidden="true" />
                {t("settings.copiarEmail")}
              </button>
            </div>
          </SettingsCard>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving || !hasPendingChanges}
            className={`${primaryButtonClass} w-full sm:min-w-[220px] sm:w-auto`}
          >
            {isSaving ? (
              <LoadingLabel>{t("settings.salvando")}</LoadingLabel>
            ) : (
              hasPendingChanges ? t("settings.salvarConfigs") : t("settings.configsSalvas")
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
