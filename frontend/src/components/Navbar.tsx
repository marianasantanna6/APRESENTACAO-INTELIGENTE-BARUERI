import { Link } from "react-router-dom";
import { FiHelpCircle, FiUser } from "react-icons/fi";
import navbarLogo from "../assets/images/create-logo.png";

const iconButtonClass =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-[8px] px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-4 lg:text-[1.08rem]";

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)] backdrop-blur">
      <div className="mx-auto flex max-w-310 items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <a href="#inicio" aria-label="Ir para o início" className="shrink-0">
          <img
            src={navbarLogo}
            alt="Logo Barueri"
            className="h-auto w-29 sm:w-37.5"
          />
        </a>

        <nav
          aria-label="Principal"
          className="hidden items-center gap-3 text-[15px] font-semibold text-white md:flex lg:text-[16px]"
        >
          <a className="transition-opacity hover:opacity-80" href="#sobre">
            Sobre
          </a>
          <div className="h-6 w-0.5 bg-white/30" />
          <a
            className="transition-opacity hover:opacity-80"
            href="#funcionalidades"
          >
            Funcionalidades
          </a>
          <div className="h-6 w-0.5 bg-white/30" />
          <a
            className="transition-opacity hover:opacity-80"
            href="#como-funciona"
          >
            Como Funciona
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            aria-label="Abrir login"
            className={iconButtonClass}
          >
            <FiUser className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Login</span>
          </Link>

          <button type="button" aria-label="Ajuda" className={iconButtonClass}>
            <FiHelpCircle className="h-5.5 w-5.5 text-white" />
            <span className="hidden text-white sm:inline">Ajuda</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
