import { Link } from "react-router-dom";
import { FaUser, FaQuestion } from "react-icons/fa";
import navbarLogo from "../assets/images/create-logo.png";

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
            aria-label="Abrir login">
            <button
              type="button"
              aria-label="Conta"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-13 sm:w-13"
            >
              <FaUser className="h-5 w-5 text-[#1675b8]" />
            </button>
          </Link>
            
            <button
              type="button"
              aria-label="Ajuda"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-13 sm:w-13"
            >
              <FaQuestion className="h-5 w-5 text-[#1675b8]" />
            </button>
          </div>
      </div>
    </header>
  );
}
export default Navbar;
