import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiDatabase,
  FiFolder,
  FiHelpCircle,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { AdminConsoleProvider, useAuth } from "../../context";
import {
  canAccessAdminModules,
  canCreatePresentations,
} from "../../lib/accessControl";
import { ROUTE_PATHS } from "../../router/paths";

const sidebarItems = [
  {
    label: "Projetos",
    path: ROUTE_PATHS.presentations,
    icon: FiFolder,
    requiresAdmin: false,
  },
  {
    label: "Dados (API)",
    path: ROUTE_PATHS.adminData,
    icon: FiDatabase,
    requiresAdmin: true,
  },
  {
    label: "Administração",
    path: ROUTE_PATHS.adminAdministration,
    icon: FiShield,
    requiresAdmin: true,
  },
];

function SidebarContent({ canSeeAdminModules }: { canSeeAdminModules: boolean }) {
  const visibleSidebarItems = sidebarItems.filter(
    (item) => !item.requiresAdmin || canSeeAdminModules,
  );

  return (
    <>
      <nav className="flex-1 px-4 py-6" aria-label="Módulos da área logada">
        <div className="space-y-3">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-full px-4 py-3 text-[0.95rem] font-medium transition-all ${
                    isActive
                      ? "bg-[linear-gradient(90deg,#7fb4db_0%,#6fa8d6_100%)] !text-white shadow-[0_8px_20px_rgba(97,159,208,0.28)] [&_*]:!text-white"
                      : "text-[#7a7a7a] hover:bg-white/70 hover:text-[#1e1e1e]"
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        className="flex items-center gap-3 border-t border-[#d7d7d7] px-5 py-5 text-[0.95rem] font-medium text-[#7a7a7a]"
      >
        <FiSettings className="h-4.5 w-4.5" />
        Configurações
      </button>
    </>
  );
}

function AdminConsoleLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canSeeAdminModules = canAccessAdminModules(user);
  const canSeeCreateFlow = canCreatePresentations(user);
  const visibleSidebarItems = sidebarItems.filter(
    (item) => !item.requiresAdmin || canSeeAdminModules,
  );

  const activeHeaderItem =
    location.pathname === ROUTE_PATHS.myAccount ? undefined : "presentations";

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92)_0%,rgba(239,240,250,0.96)_46%,rgba(226,227,247,0.96)_100%)] text-[#1e1e1e]">
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

      <div className="md:flex">
        <aside className="hidden h-[calc(100vh-89px)] w-[228px] shrink-0 self-start overflow-y-auto border-r border-[#d7d7d7] bg-[#f4f5f7] md:sticky md:top-[89px] md:flex md:flex-col">
          <SidebarContent canSeeAdminModules={canSeeAdminModules} />
        </aside>

        <main className="min-h-[calc(100vh-89px)] flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-[#7fb4db] !text-white shadow-[0_8px_20px_rgba(97,159,208,0.28)] [&_*]:!text-white"
                        : "bg-white/70 text-[#696969]"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <Outlet />

          <div className="mt-8 flex justify-end text-[0.92rem] font-medium text-[#8a8a8a]">
            <span className="inline-flex items-center gap-2">
              <FiHelpCircle className="h-4 w-4" />
              Ajuda
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
