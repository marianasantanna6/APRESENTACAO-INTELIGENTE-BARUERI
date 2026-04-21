import type { CSSProperties, ChangeEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown, FaFilter, FaSearch } from "react-icons/fa";
import { FiHelpCircle, FiUser } from "react-icons/fi";
import createLogo from "../assets/images/create-logo.png";

type Category = {
  label: string;
  color: string;
  width: string;
};

const createCategories: Category[] = [
  {
    label: "Meio Ambiente",
    color: "bg-[rgba(76,175,80,0.5)]",
    width: "w-[280px]",
  },
  {
    label: "Educação",
    color: "bg-[rgba(22,117,184,0.5)]",
    width: "w-[280px]",
  },
  {
    label: "Economia",
    color: "bg-[rgba(255,143,0,0.5)]",
    width: "w-[260px]",
  },
  { label: "Saúde", color: "bg-[#ef91c2]", width: "w-[260px]" },
];

const availableYears = [
  "Todos",
  ...Array.from({ length: 2025 - 1950 + 1 }, (_, index) =>
    String(2025 - index),
  ),
];

const iconButtonClass =
  "inline-flex h-11 items-center justify-center gap-2.5 rounded-[8px] px-3 text-[1rem] font-bold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 sm:px-4 lg:text-[1.08rem]";
const navPillClass =
  "flex h-10 items-center justify-center rounded-[50px] px-4 text-[1rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-5 lg:text-[1.05rem]";
const activeNavPillClass =
  "border border-[#1675b8] bg-[rgba(22,117,184,0.5)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]";

function CreatePresentationPage() {
  const [selectedCategory, setSelectedCategory] = useState("Educação");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      <header className="sticky top-0 z-20 border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)] backdrop-blur">
        <div className="mx-auto flex max-w-310 items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/criar"
            aria-label="Ir para a área logada"
            className="shrink-0"
          >
            <img
              src={createLogo}
              alt="Logo Barueri"
              className="h-auto w-29 sm:w-37.5"
            />
          </Link>

          <nav
            aria-label="Área logada"
            className="hidden items-center gap-3 text-[15px] font-semibold text-white md:flex lg:text-[16px]"
          >
            <Link
              to="/criar"
              aria-current="page"
              className={`${navPillClass} ${activeNavPillClass} w-28 lg:w-32`}
            >
              Criar
            </Link>

            <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />

            <button
              type="button"
              className={`${navPillClass} border border-transparent`}
            >
              Minhas Apresentações
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" aria-label="Conta" className={iconButtonClass}>
              <FiUser className="h-5.5 w-5.5 text-white" />
            </button>
            <button type="button" aria-label="Ajuda" className={iconButtonClass}>
              <FiHelpCircle className="h-5.5 w-5.5 text-white" />
              <span className="hidden text-white sm:inline">Ajuda</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-310 px-5 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-302.5 flex-col items-center">
          <h1 className="reveal-on-scroll text-center text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.05em] text-[#1e1e1e] sm:text-[3.6rem] lg:text-[5rem]">
            Crie uma Apresentação{" "}
            <span
              className="typewriter-word bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_25.962%)] bg-clip-text text-transparent"
              style={
                {
                  "--typewriter-width": "10.5ch",
                  "--typewriter-steps": 10,
                } as CSSProperties
              }
            >
              Inteligente
            </span>
          </h1>

          <div
            className="reveal-on-scroll relative mt-10 w-full"
            style={{ "--reveal-delay": "120ms" } as CSSProperties}
          >
            <input
              type="search"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquise tema, indicador ou categoria"
              className="h-23.75 w-full rounded-[50px] bg-white pl-21.5 pr-23 text-[1.15rem] font-medium text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15"
            />
            <div className="pointer-events-none absolute left-8.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#706e6e]">
              <FaSearch className="h-5 w-5" />
            </div>
            <button
              type="button"
              aria-label="Abrir filtros"
              className="absolute right-8.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-[#706e6e]"
            >
              <FaFilter className="h-4 w-4" />
            </button>
          </div>

          <div
            className="reveal-on-scroll mt-10 flex w-full flex-col gap-6"
            style={{ "--reveal-delay": "220ms" } as CSSProperties}
          >
            <div className="flex flex-wrap justify-center gap-5 xl:justify-between">
              {createCategories.map((category) => {
                const isSelected = category.label === selectedCategory;

                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => setSelectedCategory(category.label)}
                    className={`${category.width} ${category.color} h-15 rounded-[50px] px-6 text-center text-[1.35rem] font-bold text-[#f8fafc] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 ${isSelected ? "ring-4 ring-white/70" : ""}`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-end gap-4 sm:flex-row sm:self-end">
              <span className="text-[1.35rem] font-medium text-[#706e6e] sm:text-[1.6rem]">
                Ano Selecionado:
              </span>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedYear(event.target.value)
                  }
                  className="h-13.25 w-54.5 appearance-none rounded-[50px] bg-[#d9d9d9] px-7 pr-14 text-[1.3rem] font-medium text-[#706e6e] shadow-[0_4px_11px_rgba(0,0,0,0.25)] outline-none"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="pointer-events-none absolute right-6 top-1/2 h-3 w-5 -translate-y-1/2 text-[#706e6e]" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CreatePresentationPage;
