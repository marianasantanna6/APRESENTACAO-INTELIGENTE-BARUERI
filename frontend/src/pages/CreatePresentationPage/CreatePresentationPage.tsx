import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaFilter, FaSearch } from "react-icons/fa";
import { DEFAULT_PRESENTATION_FILTERS } from "../../api/presentation";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";
import { ROUTE_PATHS } from "../../router/paths";

type Category = {
  label: string;
  color: string;
  width: string;
};

const createCategories: Category[] = [
  {
    label: "Meio Ambiente",
    color: "bg-[rgba(76,175,80,0.5)]",
    width: "w-[236px]",
  },
  {
    label: "Educação",
    color: "bg-[rgba(22,117,184,0.5)]",
    width: "w-[236px]",
  },
  {
    label: "Economia",
    color: "bg-[rgba(255,143,0,0.5)]",
    width: "w-[220px]",
  },
  { label: "Saúde", color: "bg-[#ef91c2]", width: "w-[220px]" },
];

const availableYears = [
  "Todos",
  ...Array.from({ length: 2026 - 1950 + 1 }, (_, index) =>
    String(2026 - index),
  ),
];

function CreatePresentationPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canCreate = canCreatePresentations(user);
  const [selectedCategory, setSelectedCategory] = useState(
    DEFAULT_PRESENTATION_FILTERS.category,
  );
  const [selectedYear, setSelectedYear] = useState(
    DEFAULT_PRESENTATION_FILTERS.year,
  );
  const [search, setSearch] = useState(DEFAULT_PRESENTATION_FILTERS.query);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = buildPresentationSearchParams({
      query: search.trim() || DEFAULT_PRESENTATION_FILTERS.query,
      category: selectedCategory,
      year: selectedYear,
    });

    navigate(`${ROUTE_PATHS.generatedPresentation}?${params.toString()}`);
  }

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]">
      <AuthenticatedHeader
        activeItem="create"
        canCreate={canCreate}
        logoTo={ROUTE_PATHS.createPresentation}
        onLogout={handleLogout}
        presentationsTo={getPresentationsRouteForUser(user)}
        showMobilePresentationsShortcut
        user={user}
      />

      <main className="mx-auto max-w-[1240px] px-5 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-[1210px] flex-col items-center">
          <h1 className="reveal-on-scroll max-w-[21ch] text-center text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#1e1e1e] [text-wrap:balance] sm:max-w-[22ch] sm:text-[2.9rem] lg:max-w-[24ch] lg:text-[3.45rem] xl:text-[3.75rem]">
            Crie uma Apresentação{" "}
            <span className="relative inline-block text-left align-bottom">
              <span aria-hidden="true" className="invisible">
                Inteligente
              </span>
              <span
                className="typewriter-word absolute left-0 top-0 bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_25.962%)] bg-clip-text text-transparent"
                style={
                  {
                    "--typewriter-width": "11ch",
                    "--typewriter-steps": 11,
                  } as CSSProperties
                }
              >
                Inteligente
              </span>
            </span>
          </h1>

          <form
            className="reveal-on-scroll relative mt-8 w-full"
            style={{ "--reveal-delay": "120ms" } as CSSProperties}
            onSubmit={handleSubmit}
          >
            <input
              type="search"
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquise tema, indicador ou categoria"
              className="h-[80px] w-full rounded-[40px] bg-white pl-[74px] pr-[82px] text-[1rem] font-medium text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15 sm:text-[1.08rem]"
            />
            <div className="pointer-events-none absolute left-[28px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#706e6e]">
              <FaSearch className="h-4.5 w-4.5" />
            </div>
            <button
              type="submit"
              aria-label="Gerar dashboard e apresentação"
              className="absolute right-[28px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#706e6e] shadow-sm transition hover:text-[#1675b8]"
            >
              <FaFilter className="h-4 w-4" />
            </button>
          </form>

          <div
            className="reveal-on-scroll mt-8 flex w-full flex-col gap-5"
            style={{ "--reveal-delay": "220ms" } as CSSProperties}
          >
            <div className="flex flex-wrap justify-center gap-4 xl:justify-between">
              {createCategories.map((category) => {
                const isSelected = category.label === selectedCategory;

                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => setSelectedCategory(category.label)}
                    className={`${category.width} ${category.color} h-[54px] rounded-[40px] px-5 text-center text-[1.08rem] font-bold text-[#f8fafc] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 sm:text-[1.15rem] ${isSelected ? "ring-4 ring-white/70" : ""}`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-end gap-3 sm:flex-row sm:self-end">
              <span className="text-[1.12rem] font-medium text-[#706e6e] sm:text-[1.3rem]">
                Ano Selecionado:
              </span>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedYear(event.target.value)
                  }
                  className="h-[48px] w-[190px] appearance-none rounded-[40px] bg-[#d9d9d9] px-6 pr-12 text-[1.08rem] font-medium text-[#706e6e] shadow-[0_4px_11px_rgba(0,0,0,0.25)] outline-none"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="pointer-events-none absolute right-5 top-1/2 h-3 w-4 -translate-y-1/2 text-[#706e6e]" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CreatePresentationPage;
