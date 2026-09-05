import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiBarChart2,
  FiBookOpen,
  FiDatabase,
  FiFolder,
  FiHelpCircle,
  FiLayers,
  FiMenu,
  FiSettings,
  FiShield,
  FiX,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import {
  AdminConsoleProvider,
  useAuth,
  useSystemPreferences,
} from "../../context";
import {
  canAccessAdminModules,
  canCreatePresentations,
} from "../../lib/accessControl";
import { ROUTE_PATHS } from "../../router/paths";

type SidebarItemDef = {
  labelKey: string;
  path: string;
  icon: IconType;
  requiresAdmin: boolean;
};

const primarySidebarDefs: SidebarItemDef[] = [
  {
    labelKey: "nav.projetos",
    path: ROUTE_PATHS.presentations,
    icon: FiFolder,
    requiresAdmin: false,
  },
  {
    labelKey: "nav.projetosInstitucionais",
    path: ROUTE_PATHS.institutionalProjects,
    icon: FiLayers,
    requiresAdmin: false,
  },
  {
    labelKey: "nav.templates",
    path: ROUTE_PATHS.templates,
    icon: FiBookOpen,
    requiresAdmin: false,
  },
  {
    labelKey: "nav.analytics",
    path: ROUTE_PATHS.analytics,
    icon: FiBarChart2,
    requiresAdmin: true,
  },
  {
    labelKey: "nav.dados",
    path: ROUTE_PATHS.adminData,
    icon: FiDatabase,
    requiresAdmin: true,
  },
  {
    labelKey: "nav.administracao",
    path: ROUTE_PATHS.adminAdministration,
    icon: FiShield,
    requiresAdmin: true,
  },
];

const settingsSidebarDef: SidebarItemDef = {
  labelKey: "nav.configuracoes",
  path: ROUTE_PATHS.settings,
  icon: FiSettings,
  requiresAdmin: false,
};

function getSidebarLinkClass(isActive: boolean) {
  return `flex items-center gap-3 rounded-full px-4 py-3 text-[0.95rem] font-medium transition-all ${
    isActive
      ? "bg-[linear-gradient(90deg,#7fb4db_0%,#6fa8d6_100%)] !text-white shadow-[0_8px_20px_rgba(97,159,208,0.28)] [&_*]:!text-white"
      : "text-[#7a7a7a] hover:bg-white/70 hover:text-[#1e1e1e]"
  }`;
}

function SidebarLink({
  def,
  onNavigate,
}: {
  def: SidebarItemDef;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const Icon = def.icon;

  return (
    <NavLink
      to={def.path}
      end
      onClick={onNavigate}
      className={({ isActive }) => getSidebarLinkClass(isActive)}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      {t(def.labelKey)}
    </NavLink>
  );
}

function SidebarContent({
  canSeeAdminModules,
  onNavigate,
}: {
  canSeeAdminModules: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const visiblePrimaryDefs = primarySidebarDefs.filter(
    (def) => !def.requiresAdmin || canSeeAdminModules,
  );

  return (
    <>
      <nav
        className="flex-1 px-4 py-6"
        aria-label={t("accessibility.sidebarNav")}
      >
        <div className="space-y-3">
          {visiblePrimaryDefs.map((def) => (
            <SidebarLink key={def.path} def={def} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="border-t border-[#d7d7d7] px-4 py-5">
        <SidebarLink def={settingsSidebarDef} onNavigate={onNavigate} />
      </div>
    </>
  );
}

function MobileSidebar({
  canSeeAdminModules,
  isOpen,
  onClose,
}: {
  canSeeAdminModules: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 md:hidden">
      <button
        type="button"
        aria-label={t("accessibility.closeMenu")}
        onClick={onClose}
        className="absolute inset-0 bg-[#142133]/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("accessibility.sidebarNav")}
        className="absolute inset-y-0 left-0 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-[#d7d7d7] bg-[#f4f5f7] shadow-[0_20px_48px_rgba(20,33,51,0.24)]"
      >
        <div className="flex items-center justify-between border-b border-[#d7d7d7] px-4 py-4">
          <div>
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
              {t("accessibility.sidebarNav")}
            </p>
            <p className="mt-1 text-[1rem] font-bold text-[#1e1e1e]">Menu</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#4f6475] shadow-[0_10px_24px_rgba(20,33,51,0.12)] transition hover:-translate-y-0.5"
            aria-label={t("accessibility.closeMenu")}
          >
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <SidebarContent
          canSeeAdminModules={canSeeAdminModules}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}

function AdminConsoleLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { preferences } = useSystemPreferences();
  const { t } = useTranslation();
  const canSeeAdminModules = canAccessAdminModules(user);
  const canSeeCreateFlow = canCreatePresentations(user);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeHeaderItem =
    location.pathname === ROUTE_PATHS.myAccount
    || location.pathname === ROUTE_PATHS.settings
      ? undefined
      : "presentations";

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div
      data-surface="console-shell"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92)_0%,rgba(239,240,250,0.96)_46%,rgba(226,227,247,0.96)_100%)] text-[#1e1e1e]"
    >
      {/* Fase 21 — Acessibilidade: link para pular para o conteúdo principal */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[#1675b8] focus:px-4 focus:py-3 focus:text-[0.95rem] focus:font-semibold focus:text-white focus:shadow-[0_8px_24px_rgba(22,117,184,0.35)] focus:outline-none"
      >
        {t("accessibility.skipToMain")}
      </a>

      <AuthenticatedHeader
        activeItem={activeHeaderItem}
        canCreate={canSeeCreateFlow}
        logoTo={ROUTE_PATHS.presentations}
        onLogout={handleLogout}
        presentationsTo={ROUTE_PATHS.presentations}
        showDesktopLogo
        showMobileLogo
        user={user}
      />

      <MobileSidebar
        canSeeAdminModules={canSeeAdminModules}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="md:flex">
        <aside
          data-surface="sidebar"
          className="hidden h-[calc(100vh-89px)] w-[228px] shrink-0 self-start overflow-y-auto border-r border-[#d7d7d7] bg-[#f4f5f7] md:sticky md:top-[89px] md:flex md:flex-col"
        >
          <SidebarContent canSeeAdminModules={canSeeAdminModules} />
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-[calc(100vh-89px)] min-w-0 flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8"
        >
          <div className="mb-5 flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              aria-expanded={isMobileSidebarOpen}
              aria-controls="mobile-sidebar"
              aria-label={t("accessibility.openMenu")}
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/75 bg-white/88 px-4 text-[0.92rem] font-semibold text-[#4f6475] shadow-[0_12px_30px_-24px_rgba(20,33,51,0.32)] transition hover:-translate-y-0.5"
            >
              <FiMenu className="h-4.5 w-4.5" aria-hidden="true" />
              Menu
            </button>

            <span className="text-[0.82rem] font-medium uppercase tracking-[0.08em] text-[#8a8a8a]">
              {t("nav.administracao")}
            </span>
          </div>

          <Outlet />

          <div className="mt-8 flex flex-col gap-2 text-[0.92rem] font-medium text-[#8a8a8a] sm:flex-row sm:items-center sm:justify-between">
            {preferences.keyboardNavigation ? (
              <span className="inline-flex max-w-full flex-wrap items-center gap-2 text-[0.84rem]">
                {t("settings.atalhosTeclas")}
              </span>
            ) : (
              <span />
            )}

            <span className="inline-flex items-center gap-2 self-end sm:self-auto">
              <FiHelpCircle className="h-4 w-4" aria-hidden="true" />
              {t("landing.help")}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminConsoleLayout() {
  return (
    <AdminConsoleProvider>
      <AdminConsoleLayoutContent />
    </AdminConsoleProvider>
  );
}
