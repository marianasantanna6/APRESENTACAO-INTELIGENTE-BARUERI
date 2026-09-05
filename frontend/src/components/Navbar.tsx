import { useState } from "react";
import { FiHelpCircle, FiMenu, FiUser, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import navbarLogo from "../assets/images/create-logo.png";
import { ROUTE_PATHS } from "../router";

const iconButtonClass =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-full px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-4 lg:text-[1.08rem]";

const navItems = [
  { href: "#sobre", label: "Sobre" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como Funciona" },
];

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleCloseMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      data-surface="header"
      className="sticky top-0 z-20 border-b backdrop-blur"
    >
      <div className="mx-auto flex max-w-310 items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8 md:relative">
        <a href="#inicio" aria-label="Ir para o início" className="shrink-0">
          <img
            src={navbarLogo}
            alt="Logo Barueri"
            className="h-auto w-29 sm:w-37.5"
          />
        </a>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-3 text-[15px] font-semibold text-white md:absolute md:left-1/2 md:top-1/2 md:flex md:-translate-x-1/2 md:-translate-y-1/2 lg:text-[16px]"
        >
          {navItems.map((item, index) => (
            <div key={item.href} className="flex items-center gap-3">
              <a
                data-header-link="nav"
                className="transition-opacity hover:opacity-80"
                href={item.href}
              >
                {item.label}
              </a>
              {index < navItems.length - 1 ? (
                <div data-header-divider className="h-6 w-0.5 bg-white/30" />
              ) : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to={ROUTE_PATHS.login}
            aria-label="Abrir login"
            data-header-action="button"
            className={iconButtonClass}
          >
            <FiUser className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Login</span>
          </Link>

          <button
            type="button"
            aria-label="Ajuda"
            data-header-action="button"
            className={`${iconButtonClass} hidden md:inline-flex`}
          >
            <FiHelpCircle className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Ajuda</span>
          </button>

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
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div
          data-header-mobile-panel
          className="border-t px-4 pb-4 pt-3 md:hidden"
        >
          <nav aria-label="Menu principal mobile" className="grid gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleCloseMenu}
                data-header-link="nav"
                className="inline-flex h-11 items-center rounded-[8px] px-3 text-[0.94rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
