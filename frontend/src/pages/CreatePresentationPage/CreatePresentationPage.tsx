import type { ChangeEvent, CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { FaChevronDown, FaFilter, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PRESENTATION_FILTERS } from "../../api/presentation";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import { useAuth } from "../../context";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { ROUTE_PATHS } from "../../router/paths";
import { buildPresentationSearchParams } from "../../router/presentationSearchParams";

type Category = {
  label: string;
  color: string;
  width: string;
};

type ExtraCategory = {
  label: string;
};

const primaryCategories: Category[] = [
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

const extraCategories: ExtraCategory[] = [
  { label: "Assistência Social" },
  { label: "Cultura e Turismo" },
  { label: "Esporte e Lazer" },
  { label: "Habitação" },
  { label: "Infraestrutura Urbana" },
  { label: "Mobilidade Urbana" },
  { label: "Segurança Pública" },
  { label: "Saneamento" },
  { label: "Tecnologia e Inovação" },
  { label: "Trabalho e Emprego" },
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
  const [showExtraModules, setShowExtraModules] = useState(false);

  const selectedExtraCategory = extraCategories.find(
    (category) => category.label === selectedCategory,
  );

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

  function handlePrimaryCategorySelect(categoryLabel: string) {
    setSelectedCategory(categoryLabel);
  }

  function handleExtraCategorySelect(categoryLabel: string) {
    setSelectedCategory(categoryLabel);
    setShowExtraModules(false);
  }

  return (
    <div
      data-page-theme="create"
      className="min-h-screen bg-[#f8fafc] text-[#1e1e1e]"
    >
      <AuthenticatedHeader
        activeItem="create"
        canCreate={canCreate}
        logoTo={ROUTE_PATHS.createPresentation}
        onLogout={handleLogout}
        presentationsTo={getPresentationsRouteForUser(user)}
        showMobilePresentationsShortcut
        user={user}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1240px] px-5 pb-20 pt-24 sm:px-6 lg:px-8"
      >
        <section className="mx-auto flex max-w-[1210px] flex-col items-center">
          <h1 className="page-title reveal-on-scroll max-w-[21ch] text-center text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.05em] text-[#1e1e1e] [text-wrap:balance] sm:max-w-[22ch] sm:text-[2.9rem] lg:max-w-[24ch] lg:text-[3.45rem] xl:text-[3.75rem]">
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
            className="reveal-on-scroll mt-8 w-full space-y-4"
            style={{ "--reveal-delay": "120ms" } as CSSProperties}
            onSubmit={handleSubmit}
          >
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearch(event.target.value)
                }
                data-create-surface="search-input"
                placeholder="Pesquise tema, indicador ou categoria"
                className="h-[80px] w-full rounded-[40px] bg-white pl-[74px] pr-[150px] text-[1rem] font-medium text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15 sm:pr-[198px] sm:text-[1.08rem]"
              />
              <div className="pointer-events-none absolute left-[28px] top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#706e6e]">
                <FaSearch className="h-4.5 w-4.5" />
              </div>

              <div className="absolute right-[18px] top-1/2 flex -translate-y-1/2 items-center gap-2">
                <button
                  type="button"
                  aria-label="Abrir filtros de módulos"
                  aria-expanded={showExtraModules}
                  data-create-surface="filter-toggle"
                  onClick={() => setShowExtraModules((value) => !value)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border bg-white text-[#706e6e] shadow-sm transition ${
                    showExtraModules
                      ? "border-[#1675b8] text-[#1675b8] shadow-[0_12px_24px_-16px_rgba(22,117,184,0.7)]"
                      : "border-slate-200 hover:text-[#1675b8]"
                  }`}
                >
                  <FaFilter className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  data-create-surface="submit-action"
                  aria-label="Gerar dashboard e apresentação"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1675b8] px-4 text-[0.95rem] font-semibold text-white shadow-[0_12px_24px_-16px_rgba(22,117,184,0.8)] transition hover:-translate-y-0.5 hover:bg-[#0d5e96]"
                >
                  <span className="hidden sm:inline">Gerar</span>
                  <FaSearch className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {showExtraModules ? (
              <div
                data-create-surface="advanced-category-panel"
                className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.32)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[0.98rem] font-semibold text-slate-900">
                      Outros módulos disponíveis
                    </p>
                    <p className="mt-1 max-w-[60ch] text-[0.86rem] leading-6 text-slate-500">
                      Os módulos abaixo complementam os principais exibidos logo
                      abaixo da barra de pesquisa.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center rounded-full bg-[#eff6ff] px-3 py-1 text-[0.78rem] font-semibold text-[#1d4ed8]">
                    {selectedExtraCategory
                      ? `Selecionado: ${selectedExtraCategory.label}`
                      : "Selecione um módulo extra quando precisar"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {extraCategories.map((category) => {
                    const isSelected = category.label === selectedCategory;

                    return (
                      <button
                        key={category.label}
                        type="button"
                        onClick={() => handleExtraCategorySelect(category.label)}
                        data-create-surface="extra-category-chip"
                        className={`rounded-full border px-4 py-2 text-[0.95rem] font-semibold transition ${
                          isSelected
                            ? "border-[#1675b8] bg-[#1675b8] text-white shadow-[0_12px_24px_-18px_rgba(22,117,184,0.7)]"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1675b8]/45 hover:bg-[#eff6ff]"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </form>

          <div
            className="reveal-on-scroll mt-8 flex w-full flex-col gap-5"
            style={{ "--reveal-delay": "220ms" } as CSSProperties}
          >
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-4 xl:justify-between">
                {primaryCategories.map((category) => {
                  const isSelected = category.label === selectedCategory;

                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => handlePrimaryCategorySelect(category.label)}
                      data-create-surface="category-chip"
                      className={`${category.width} ${category.color} h-[54px] rounded-[40px] px-5 text-center text-[1.08rem] font-bold text-[#f8fafc] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 sm:text-[1.15rem] ${
                        isSelected ? "ring-4 ring-white/70" : ""
                      }`}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-[0.92rem] text-[#706e6e]">
                  Esses são os módulos principais. Use o ícone de filtro para ver
                  outras opções.
                </p>

                {selectedExtraCategory ? (
                  <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-3.5 py-1.5 text-[0.82rem] font-semibold text-[#1d4ed8]">
                    Módulo extra selecionado: {selectedExtraCategory.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-center justify-end gap-3 sm:flex-row sm:self-end">
              <span className="text-[1.12rem] font-medium text-[#706e6e] sm:text-[1.3rem]">
                Ano selecionado:
              </span>

              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedYear(event.target.value)
                  }
                  data-create-surface="year-select"
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
