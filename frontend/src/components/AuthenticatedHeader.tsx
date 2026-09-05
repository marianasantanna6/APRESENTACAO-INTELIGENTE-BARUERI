import { useState } from "react";
import { FiHelpCircle, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import createLogo from "../assets/images/create-logo.png";
import { ROUTE_PATHS } from "../router/paths";
import type { AuthSessionUser } from "../types/auth";
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
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-3.5 lg:text-[1.08rem]";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldShowMobileMenu = canCreate || Boolean(user) || Boolean(onLogout);

  function handleCloseMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      data-surface="header"
      className="sticky top-0 z-20 border-b backdrop-blur"
    >
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center">
          <Link
            to={logoTo}
            aria-label="Ir para a área logada"
            className={getLogoVisibilityClass(showDesktopLogo, showMobileLogo)}
            onClick={handleCloseMobileMenu}
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
                data-header-link="pill"
                className={`${navPillClass} w-[112px] lg:w-[118px] ${activeItem === "create" ? activeNavPillClass : ""}`}
              >
                Criar
              </Link>
              <div
                aria-hidden="true"
                data-header-divider
                className="h-6 w-0.5 bg-white/30"
              />
            </>
          ) : null}

          <Link
            to={presentationsTo}
            aria-current={activeItem === "presentations" ? "page" : undefined}
            data-header-link="pill"
            className={`${navPillClass} ${activeItem === "presentations" ? activeNavPillClass : ""}`}
          >
            Minhas apresentações
          </Link>
        </nav>

        <div className="flex min-w-0 items-center justify-self-end gap-2 sm:gap-3">
          {showMobilePresentationsShortcut ? (
            <Link
              to={presentationsTo}
              data-header-action="button"
              onClick={handleCloseMobileMenu}
              className="inline-flex h-10.5 max-w-[11rem] items-center justify-center rounded-[8px] px-2.5 text-[0.82rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 md:hidden"
            >
              Apresentações
            </Link>
          ) : null}

          {user ? (
            <Link
              to={ROUTE_PATHS.myAccount}
              aria-label="Abrir Minha Conta"
              data-header-account="button"
              onClick={handleCloseMobileMenu}
              className={`${accountPillClass} hidden md:inline-flex`}
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

          <button
            type="button"
            aria-label="Ajuda"
            data-header-action="button"
            className={`${iconButtonClass} hidden md:inline-flex`}
          >
            <FiHelpCircle className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Ajuda</span>
          </button>

          {onLogout ? (
            <button
              type="button"
              aria-label="Encerrar sessão"
              onClick={onLogout}
              data-header-action="button"
              className={`${iconButtonClass} hidden md:inline-flex`}
            >
              <FiLogOut className="h-5.5 w-5.5 text-white" />
              <span className="hidden text-white sm:inline">Sair</span>
            </button>
          ) : null}

          {shouldShowMobileMenu ? (
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              data-header-action="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 md:hidden"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-5 w-5 text-white" />
              ) : (
                <FiMenu className="h-5 w-5 text-white" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {shouldShowMobileMenu && isMobileMenuOpen ? (
        <div
          data-header-mobile-panel
          className="border-t px-4 pb-4 pt-3 md:hidden"
        >
          <nav aria-label="Menu logado mobile" className="grid gap-2">
            {canCreate ? (
              <Link
                to={ROUTE_PATHS.createPresentation}
                aria-current={activeItem === "create" ? "page" : undefined}
                onClick={handleCloseMobileMenu}
                data-header-link="pill"
                className={`inline-flex h-11 items-center rounded-[8px] px-3 text-[0.94rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 ${activeItem === "create" ? activeNavPillClass : ""}`}
              >
                Criar
              </Link>
            ) : null}

            <Link
              to={presentationsTo}
              aria-current={activeItem === "presentations" ? "page" : undefined}
              onClick={handleCloseMobileMenu}
              data-header-link="pill"
              className={`inline-flex h-11 items-center rounded-[8px] px-3 text-[0.94rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 ${activeItem === "presentations" ? activeNavPillClass : ""}`}
            >
              Minhas apresentações
            </Link>

            {user ? (
              <Link
                to={ROUTE_PATHS.myAccount}
                onClick={handleCloseMobileMenu}
                data-header-account="button"
                className="inline-flex h-11 items-center rounded-[8px] px-3 text-[0.94rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25"
              >
                Minha conta
              </Link>
            ) : null}

            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  handleCloseMobileMenu();
                  onLogout();
                }}
                data-header-action="button"
                className="inline-flex h-11 items-center rounded-[8px] px-3 text-left text-[0.94rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25"
              >
                Sair
              </button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
