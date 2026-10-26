import { FiSearch, FiSliders, FiX } from "react-icons/fi";
import type { ProjectCategory, ProjectStatus } from "../../types/project";

export type ProjectFiltersState = {
  query: string;
  category: ProjectCategory | "";
  status: ProjectStatus | "";
  department: string;
  ods: string;
};

export const EMPTY_FILTERS: ProjectFiltersState = {
  query: "",
  category: "",
  status: "",
  department: "",
  ods: "",
};

const CATEGORIES: ProjectCategory[] = [
  "Saúde", "Educação", "Inovação", "Transformação Digital", "Cidades Inteligentes",
  "Governo Digital", "Inteligência Artificial", "Mobilidade", "Meio Ambiente",
  "Segurança", "Infraestrutura", "Social",
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "active",   label: "Ativo" },
  { value: "draft",    label: "Rascunho" },
  { value: "archived", label: "Arquivado" },
];

const ODS_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 1);

type Props = {
  filters: ProjectFiltersState;
  departments: string[];
  onChange: (filters: ProjectFiltersState) => void;
  resultCount: number;
};

export function ProjectFiltersBar({ filters, departments, onChange, resultCount }: Props) {
  const hasActive =
    filters.query !== "" ||
    filters.category !== "" ||
    filters.status !== "" ||
    filters.department !== "" ||
    filters.ods !== "";

  function set<K extends keyof ProjectFiltersState>(key: K, value: ProjectFiltersState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onChange(EMPTY_FILTERS);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Linha 1: busca + limpar ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="search"
            placeholder="Pesquisar por nome, tecnologia, palavra-chave…"
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            className="w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 pl-10 pr-4 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20"
          />
        </div>

        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[0.84rem] font-medium text-[#b91c1c] transition hover:bg-[#fee2e2]"
          >
            <FiX className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* ── Linha 2: filtros dropdown ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#6b7280]">
          <FiSliders className="h-3.5 w-3.5" />
          Filtrar por:
        </span>

        {/* Categoria */}
        <FilterSelect
          label="Categoria"
          value={filters.category}
          onChange={(v) => set("category", v as ProjectCategory | "")}
        >
          <option value="">Todas</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FilterSelect>

        {/* Status */}
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => set("status", v as ProjectStatus | "")}
        >
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </FilterSelect>

        {/* Secretaria */}
        {departments.length > 0 && (
          <FilterSelect
            label="Secretaria"
            value={filters.department}
            onChange={(v) => set("department", v)}
          >
            <option value="">Todas</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </FilterSelect>
        )}

        {/* ODS */}
        <FilterSelect
          label="ODS"
          value={filters.ods}
          onChange={(v) => set("ods", v)}
        >
          <option value="">Todos</option>
          {ODS_OPTIONS.map((n) => (
            <option key={n} value={String(n)}>ODS {n}</option>
          ))}
        </FilterSelect>

        {/* Contagem */}
        <span className="ml-auto text-[0.8rem] text-[#9ca3af]">
          {resultCount} {resultCount === 1 ? "projeto" : "projetos"}
        </span>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const active = value !== "";
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border px-3 py-1.5 text-[0.82rem] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 ${
        active
          ? "border-[#6fa8d6] bg-[#eff6ff] text-[#1d4ed8]"
          : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#d1d5db]"
      }`}
    >
      {children}
    </select>
  );
}
