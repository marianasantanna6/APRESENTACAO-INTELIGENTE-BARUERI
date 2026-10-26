import { useState } from "react";
import { FiTag, FiX } from "react-icons/fi";
import type { GovernmentArea, ProjectCategory } from "../../../types/project";
import {
  CompletionBadge,
  FieldLabel,
  SectionCard,
  SelectInput,
  TagInput,
} from "../EditorShared";

const ALL_CATEGORIES: ProjectCategory[] = [
  "Saúde", "Educação", "Inovação", "Transformação Digital", "Cidades Inteligentes",
  "Governo Digital", "Inteligência Artificial", "Mobilidade Urbana", "Meio Ambiente",
  "Segurança Pública", "Infraestrutura", "Social", "Economia",
  "Cultura e Lazer", "Habitação", "Saneamento", "Esporte e Lazer", "Trabalho e Emprego",
];

const CATEGORY_COLORS: Partial<Record<ProjectCategory, string>> = {
  "Saúde":                   "bg-[#ecfeff] text-[#0e7490] border-[#a5f3fc]",
  "Educação":                "bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]",
  "Inovação":                "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  "Transformação Digital":   "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
  "Cidades Inteligentes":    "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
  "Governo Digital":         "bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]",
  "Inteligência Artificial": "bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]",
  "Mobilidade Urbana":       "bg-[#fef3c7] text-[#b45309] border-[#fde68a]",
  "Meio Ambiente":           "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  "Segurança Pública":       "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
  "Infraestrutura":          "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
  "Social":                  "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
  "Economia":                "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  "Cultura e Lazer":         "bg-[#fdf4ff] text-[#a21caf] border-[#f0abfc]",
  "Habitação":               "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]",
  "Saneamento":              "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
  "Esporte e Lazer":         "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]",
  "Trabalho e Emprego":      "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
};

const GOVERNMENT_AREAS: GovernmentArea[] = [
  "Saúde", "Educação", "Habitação e Urbanismo", "Meio Ambiente",
  "Segurança Pública", "Infraestrutura", "Desenvolvimento Econômico",
  "Social", "Tecnologia e Inovação", "Administração", "Cultura e Lazer", "Mobilidade Urbana",
];

const TECH_SUGGESTIONS = [
  "React", "React Native", "Node.js", "Python", "TypeScript", "PostgreSQL",
  "SQL Server", "Power BI", "Tableau", "AWS", "Azure", "Docker", "Kubernetes",
  "Firebase", "MongoDB", "Elasticsearch", "ETL", "Machine Learning", "TensorFlow",
  "WebGL", "Blockchain", "Cisco", "Fortinet",
];

type Props = {
  categories: ProjectCategory[];
  governmentArea: GovernmentArea;
  mainDepartment: string;
  relatedDepartments: string[];
  technologies: string[];
  keywords: string[];
  errors: Partial<Record<string, string>>;
  onToggleCategory: (c: ProjectCategory) => void;
  onAreaChange: (a: GovernmentArea) => void;
  onFieldChange: (f: string, v: string) => void;
  onAddTag: (f: "technologies" | "keywords" | "relatedDepartments", v: string) => void;
  onRemoveTag: (f: "technologies" | "keywords" | "relatedDepartments", v: string) => void;
  /** Quando fornecido, Setor Principal e Setores Relacionados usam select ao invés de texto livre */
  sectorOptions?: { value: string; label: string }[];
  /** Oculta o bloco de categorias temáticas (quando já existe seletor no topo do wizard) */
  hideCategories?: boolean;
};

export function ClassificationSection({
  categories,
  governmentArea,
  mainDepartment,
  relatedDepartments,
  technologies,
  keywords,
  errors,
  onToggleCategory,
  onAreaChange,
  onFieldChange,
  onAddTag,
  onRemoveTag,
  sectorOptions,
  hideCategories = false,
}: Props) {
  return (
    <SectionCard
      id="section-classification"
      icon={<FiTag className="h-4 w-4" />}
      title="Classificação"
      subtitle="Categorias, área governamental, tecnologias e público"
      badge={<CompletionBadge count={categories.length} required={categories.length === 0} />}
    >
      <div className="space-y-6">
        {/* Categorias — toggle visual */}
        {!hideCategories && (
        <div>
          <FieldLabel required>Categorias Temáticas</FieldLabel>
          <p className="mb-3 text-[0.76rem] text-[#9ca3af]">
            Selecione todas que se aplicam
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const selected = categories.includes(cat);
              const color = CATEGORY_COLORS[cat] ?? "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onToggleCategory(cat)}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
                    selected
                      ? `${color} shadow-sm scale-[1.02]`
                      : "border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#d1d5db] hover:text-[#6b7280]"
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {cat}
                </button>
              );
            })}
          </div>
          {errors.categories && (
            <p className="mt-2 text-[0.76rem] font-medium text-[#b91c1c]">{errors.categories}</p>
          )}
        </div>
        )}

        {/* Área governamental */}
        <div>
          <FieldLabel required>Área Governamental</FieldLabel>
          <SelectInput
            value={governmentArea}
            onChange={onAreaChange}
            options={GOVERNMENT_AREAS.map((a) => ({ value: a, label: a }))}
          />
        </div>

        {/* Setor principal */}
        <div>
          <FieldLabel htmlFor="proj-dept" required hint="Setor ou departamento responsável pelo projeto">
            Setor Principal
          </FieldLabel>
          {sectorOptions ? (
            <select
              id="proj-dept"
              value={mainDepartment}
              onChange={(e) => onFieldChange("mainDepartment", e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
            >
              <option value="">Selecione o setor…</option>
              {sectorOptions.map((opt) => (
                <option key={opt.value} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              id="proj-dept"
              type="text"
              value={mainDepartment}
              onChange={(e) => onFieldChange("mainDepartment", e.target.value)}
              placeholder="Ex.: Gabinete de Dados"
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
            />
          )}
        </div>

        {/* Setores relacionados */}
        <div>
          <FieldLabel hint="Setores parceiros ou envolvidos indiretamente">
            Setores Relacionados
          </FieldLabel>
          {sectorOptions ? (
            <SectorMultiSelect
              selected={relatedDepartments}
              options={sectorOptions}
              onAdd={(v) => onAddTag("relatedDepartments", v)}
              onRemove={(v) => onRemoveTag("relatedDepartments", v)}
            />
          ) : (
            <TagInput
              tags={relatedDepartments}
              onAdd={(v) => onAddTag("relatedDepartments", v)}
              onRemove={(v) => onRemoveTag("relatedDepartments", v)}
              placeholder="Adicionar setor parceiro…"
              tagColor="bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]"
            />
          )}
        </div>

        {/* Tecnologias */}
        <div>
          <FieldLabel hint="Linguagens, frameworks, plataformas utilizadas">
            Tecnologias
          </FieldLabel>
          <TagInput
            tags={technologies}
            onAdd={(v) => onAddTag("technologies", v)}
            onRemove={(v) => onRemoveTag("technologies", v)}
            placeholder="Ex.: React, Python, Power BI…"
            suggestions={TECH_SUGGESTIONS}
            tagColor="bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
          />
        </div>

        {/* Palavras-chave */}
        <div>
          <FieldLabel hint="Termos usados na busca e indexação">
            Palavras-chave
          </FieldLabel>
          <TagInput
            tags={keywords}
            onAdd={(v) => onAddTag("keywords", v)}
            onRemove={(v) => onRemoveTag("keywords", v)}
            placeholder="Ex.: saúde, indicadores, BI…"
            tagColor="bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]"
          />
        </div>

      </div>
    </SectionCard>
  );
}

// ─── SectorMultiSelect ────────────────────────────────────────────────────────

function SectorMultiSelect({
  selected,
  options,
  onAdd,
  onRemove,
}: {
  selected: string[];
  options: { value: string; label: string }[];
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
}) {
  const [pick, setPick] = useState("");
  const available = options.filter((o) => !selected.includes(o.label));

  function handleAdd() {
    if (!pick) return;
    onAdd(pick);
    setPick("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className="flex-1 rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
        >
          <option value="">Selecione um setor…</option>
          {available.map((opt) => (
            <option key={opt.value} value={opt.label}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!pick}
          className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-[0.88rem] font-semibold text-[#1675b8] transition hover:bg-[#eff6ff] disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1 text-[0.8rem] font-semibold text-[#065f46]"
            >
              {label}
              <button
                type="button"
                onClick={() => onRemove(label)}
                aria-label={`Remover ${label}`}
                className="text-[#065f46] opacity-60 hover:opacity-100"
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
