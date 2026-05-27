import { Link } from "react-router-dom";
import { FiHelpCircle, FiLogOut } from "react-icons/fi";
import createLogo from "../assets/images/create-logo.png";
import type { AuthSessionUser } from "../types/auth";
import { ROUTE_PATHS } from "../router/paths";
import { AdminAvatar } from "./AdminConsole";

type HeaderActiveItem = "create" | "presentations";

type AuthenticatedHeaderProps = {
  activeItem?: HeaderActiveItem;
  canCreate: boolean;
  logoTo: string;
  onLogout?: () => void;
  presentationsTo: string;
  showDesktopLogo?: boolean;
  showMobileLogo?: boolean;
  showMobilePresentationsShortcut?: boolean;
  user: AuthSessionUser | null;
};

const navPillClass =
  "flex h-10 items-center justify-center rounded-[50px] border border-transparent px-3 text-[1rem] font-semibold whitespace-nowrap !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-3.5 lg:text-[1.05rem]";
const activeNavPillClass =
  "border-[#1675b8] bg-[rgba(22,117,184,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]";
const iconButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-3.5 lg:text-[1.08rem]";
const accountPillClass =
  "inline-flex items-center gap-2 rounded-full bg-white/12 px-2.5 py-2 !text-white transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-3";

function getLogoVisibilityClass(
  showDesktopLogo: boolean,
  showMobileLogo: boolean,
) {
  if (showDesktopLogo && showMobileLogo) {
    return "inline-flex";
  }

  if (showDesktopLogo) {
    return "hidden md:inline-flex";
  }

  return "md:hidden";
}

export default function AuthenticatedHeader({
  activeItem,
  canCreate,
  logoTo,
  onLogout,
  presentationsTo,
  showDesktopLogo = true,
  showMobileLogo = true,
  showMobilePresentationsShortcut = false,
  user,
}: AuthenticatedHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)] backdrop-blur">
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center">
          <Link
            to={logoTo}
            aria-label="Ir para a área logada"
            className={getLogoVisibilityClass(showDesktopLogo, showMobileLogo)}
          >
            <img
              src={createLogo}
              alt="Logo Barueri"
              className="h-auto w-[108px] sm:w-[150px]"
            />
          </Link>
        </div>

        <nav
          aria-label="Área logada"
          className="hidden items-center justify-center gap-2.5 justify-self-center text-[15px] font-semibold text-white md:flex lg:gap-3 lg:text-[16px]"
        >
          {canCreate ? (
            <>
              <Link
                to={ROUTE_PATHS.createPresentation}
                aria-current={activeItem === "create" ? "page" : undefined}
                className={`${navPillClass} w-[112px] lg:w-[118px] ${activeItem === "create" ? activeNavPillClass : ""}`}
              >
                Criar
              </Link>
              <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
            </>
          ) : null}

          <Link
            to={presentationsTo}
            aria-current={activeItem === "presentations" ? "page" : undefined}
            className={`${navPillClass} ${activeItem === "presentations" ? activeNavPillClass : ""}`}
          >
            Minhas apresentações
          </Link>
        </nav>

        <div className="flex min-w-0 items-center justify-self-end gap-2 sm:gap-3">
          {showMobilePresentationsShortcut ? (
            <Link
              to={presentationsTo}
              className="inline-flex h-11 items-center justify-center rounded-[8px] px-3 text-[0.94rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 md:hidden"
            >
              Minhas apresentações
            </Link>
          ) : null}

          {user ? (
            <Link
              to={ROUTE_PATHS.myAccount}
              aria-label="Abrir Minha Conta"
              className={accountPillClass}
            >
              <AdminAvatar
                name={user.name}
                imageSrc={user.avatarDataUrl}
                sizeClassName="h-10 w-10"
                textClassName="text-[0.82rem]"
                className="ring-2 ring-white/60"
              />
              <div className="hidden max-w-[136px] leading-tight sm:block xl:max-w-[160px]">
                <p className="truncate text-sm font-semibold !text-white">{user.name}</p>
              </div>
            </Link>
          ) : null}

          <button type="button" aria-label="Ajuda" className={iconButtonClass}>
            <FiHelpCircle className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Ajuda</span>
          </button>

          {onLogout ? (
            <button
              type="button"
              aria-label="Encerrar sessão"
              onClick={onLogout}
              className={iconButtonClass}
            >
              <FiLogOut className="h-5.5 w-5.5 text-white" />
              <span className="hidden text-white sm:inline">Sair</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
