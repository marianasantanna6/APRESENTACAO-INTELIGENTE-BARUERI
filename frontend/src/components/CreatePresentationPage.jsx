import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaQuestion,
  FaSearch,
  FaFilter,
  FaChevronDown,
} from "react-icons/fa";
import createLogo from "../assets/images/create-logo.png";

const createCategories = [
  {
    label: "Meio Ambiente",
    color: "bg-[rgba(76,175,80,0.5)]",
    width: "w-[280px]",
  },
  { label: "Educação", color: "bg-[rgba(22,117,184,0.5)]", width: "w-[280px]" },
  { label: "Economia", color: "bg-[rgba(255,143,0,0.5)]", width: "w-[260px]" },
  { label: "Saúde", color: "bg-[#ef91c2]", width: "w-[260px]" },
];

const availableYears = ["Todos", "2025", "2024", "2023", "2022"];

function CreatePresentationPage() {
  const [selectedCategory, setSelectedCategory] = useState("Educação");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      <header className="border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)]">
        <div className="mx-auto flex max-w-310 items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/criar"
            aria-label="Ir para a área logada"
            className="shrink-0"
          >
            <img
              src={createLogo}
              alt="Logo Barueri"
              className="h-auto w-29.5 sm:w-42.5"
            />
          </Link>

          <div className="hidden items-center gap-4 text-white md:flex">
            <Link
              to="/criar"
              className="flex h-14 w-44 items-center justify-center rounded-[50px] border border-[#1675b8] bg-[rgba(22,117,184,0.5)] text-[1.35rem] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
            >
              Criar
            </Link>

            <div
              aria-hidden="true"
              className="h-8.25 w-0.5 rounded-sm bg-white/30"
            />

            <button
              type="button"
              className="text-[1.2rem] font-semibold tracking-[0.01em] text-white transition-opacity hover:opacity-80"
            >
              Minhas apresentações
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Conta"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-13 sm:w-13"
            >
              <FaUser className="h-5 w-5 text-[#1675b8]" />
            </button>
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

      <main className="mx-auto max-w-310 px-5 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-302.5 flex-col items-center">
          <h1 className="text-center text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.05em] text-[#1e1e1e] sm:text-[3.6rem] lg:text-[5rem]">
            Crie uma Apresentação{" "}
            <span className="bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_25.962%)] bg-clip-text text-transparent">
              Inteligente
            </span>
          </h1>

          <div className="relative mt-10 w-full">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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

          <div className="mt-10 flex w-full flex-col gap-6">
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
                  onChange={(event) => setSelectedYear(event.target.value)}
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
