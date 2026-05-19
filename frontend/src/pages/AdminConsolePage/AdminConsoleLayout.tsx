import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiDatabase,
  FiFolder,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiShield,
  FiUser,
} from "react-icons/fi";
import createLogo from "../../assets/images/create-logo.png";
import { AdminConsoleProvider, useAuth } from "../../context";
import {
  canAccessAdminModules,
  canCreatePresentations,
  getAccessLevelLabel,
} from "../../lib/accessControl";
import { ROUTE_PATHS } from "../../router/paths";

const navPillClass =
  "flex h-10 items-center justify-center rounded-[50px] px-4 text-[1rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-5 lg:text-[1.05rem]";
const activeNavPillClass =
  "border border-[#1675b8] bg-[rgba(22,117,184,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]";
const iconButtonClass =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-[8px] px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-4 lg:text-[1.08rem]";

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
      <div className="border-b border-[#d7d7d7] px-5 py-5">
        <img src={createLogo} alt="Logo Barueri" className="h-auto w-[118px]" />
      </div>

      <nav className="flex-1 px-4 py-8" aria-label="Módulos da área logada">
        <div className="space-y-3">
          {visibleSidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-full px-4 py-3 text-[0.95rem] font-medium transition-all ${
                    isActive
                      ? "bg-[linear-gradient(90deg,#7fb4db_0%,#6fa8d6_100%)] text-white shadow-[0_8px_20px_rgba(97,159,208,0.28)]"
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
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canSeeAdminModules = canAccessAdminModules(user);
  const canSeeCreateFlow = canCreatePresentations(user);
  const visibleSidebarItems = sidebarItems.filter(
    (item) => !item.requiresAdmin || canSeeAdminModules,
  );

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92)_0%,rgba(239,240,250,0.96)_46%,rgba(226,227,247,0.96)_100%)] text-[#1e1e1e] md:flex">
      <aside className="hidden w-[228px] shrink-0 flex-col border-r border-[#d7d7d7] bg-[#f4f5f7] md:flex">
        <SidebarContent canSeeAdminModules={canSeeAdminModules} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/20 bg-[linear-gradient(90deg,#c5dcef_0%,#1b7abd_100%)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                to={ROUTE_PATHS.presentations}
                aria-label="Ir para a área logada"
                className="md:hidden"
              >
                <img
                  src={createLogo}
                  alt="Logo Barueri"
                  className="h-auto w-[108px]"
                />
              </Link>

              <nav
                aria-label="Ações principais da área logada"
                className="flex items-center gap-3 text-[15px] font-semibold text-white lg:text-[16px]"
              >
                {canSeeCreateFlow ? (
                  <>
                    <Link
                      to={ROUTE_PATHS.createPresentation}
                      className={`${navPillClass} border border-transparent w-[112px] lg:w-[128px]`}
                    >
                      Criar
                    </Link>

                    <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
                  </>
                ) : null}

                <Link
                  to={ROUTE_PATHS.presentations}
                  className={`${navPillClass} ${activeNavPillClass}`}
                >
                  Minhas apresentações
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="hidden items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-white xl:flex">
                  <FiUser className="h-4.5 w-4.5" />
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-[0.73rem] text-white/78">
                      {getAccessLevelLabel(user.accessLevel)}
                    </p>
                  </div>
                </div>
              ) : null}

              <button type="button" aria-label="Ajuda" className={iconButtonClass}>
                <FiHelpCircle className="h-5.5 w-5.5 text-white" />
                <span className="hidden text-white sm:inline">Ajuda</span>
              </button>

              <button
                type="button"
                aria-label="Encerrar sessão"
                onClick={handleLogout}
                className={iconButtonClass}
              >
                <FiLogOut className="h-5.5 w-5.5 text-white" />
                <span className="hidden text-white sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">
            {visibleSidebarItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? "bg-[#7fb4db] text-white shadow-[0_8px_20px_rgba(97,159,208,0.28)]"
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
