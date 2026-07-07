import { FiFileText } from "react-icons/fi";
import type { ProjectStatus } from "../../../types/project";
import {
  CompletionBadge,
  FieldLabel,
  SectionCard,
  TextArea,
  TextInput,
} from "../EditorShared";

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string; bg: string }[] = [
  { value: "draft",    label: "Rascunho",  color: "text-[#92400e]", bg: "bg-[#fffbeb] border-[#fde68a]" },
  { value: "active",   label: "Ativo",     color: "text-[#166534]", bg: "bg-[#f0fdf4] border-[#a7f3d0]" },
  { value: "archived", label: "Arquivado", color: "text-[#475569]", bg: "bg-[#f1f5f9] border-[#cbd5e1]" },
];

type Props = {
  name: string;
  shortDescription: string;
  fullDescription: string;
  status: ProjectStatus;
  implementationDate: string;
  errors: Partial<Record<string, string>>;
  onChange: (field: string, value: string) => void;
  onStatusChange: (s: ProjectStatus) => void;
};

export function IdentitySection({
  name,
  shortDescription,
  fullDescription,
  status,
  implementationDate,
  errors,
  onChange,
  onStatusChange,
}: Props) {
  const filled = [name, shortDescription, fullDescription].filter(Boolean).length;

  return (
    <SectionCard
      id="section-identity"
      icon={<FiFileText className="h-4 w-4" />}
      title="Identidade do Projeto"
      subtitle="Título, descrição e status"
      badge={<CompletionBadge count={filled} required={filled < 2} />}
      defaultOpen
    >
      <div className="space-y-5">
        {/* Status — selector visual em topo */}
        <div>
          <FieldLabel required>Status do projeto</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[0.84rem] font-semibold transition ${
                  status === opt.value
                    ? `${opt.bg} ${opt.color} shadow-sm`
                    : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    opt.value === "active" ? "bg-[#22c55e]"
                    : opt.value === "draft" ? "bg-[#f59e0b]"
                    : "bg-[#94a3b8]"
                  }`}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <FieldLabel htmlFor="proj-name" required hint="Máximo 80 caracteres">
            Título do Projeto
          </FieldLabel>
          <TextInput
            id="proj-name"
            value={name}
            onChange={(v) => onChange("name", v)}
            placeholder="Ex.: BI Saúde — Painel de Indicadores Municipais"
            error={errors.name}
            maxLength={80}
          />
        </div>

        {/* Descrição curta */}
        <div>
          <FieldLabel htmlFor="proj-short" required hint="Aparece nos cards de listagem. Máximo 200 caracteres.">
            Descrição Curta
          </FieldLabel>
          <TextArea
            id="proj-short"
            value={shortDescription}
            onChange={(v) => onChange("shortDescription", v)}
            placeholder="Resumo em uma ou duas frases do que é o projeto e seu impacto…"
            rows={2}
            error={errors.shortDescription}
            maxLength={200}
          />
        </div>

        {/* Descrição completa */}
        <div>
          <FieldLabel htmlFor="proj-full" hint="Exibida no modal de detalhes e nas apresentações">
            Descrição Completa
          </FieldLabel>
          <TextArea
            id="proj-full"
            value={fullDescription}
            onChange={(v) => onChange("fullDescription", v)}
            placeholder="Descreva o contexto, funcionamento, tecnologias e resultados do projeto em detalhe…"
            rows={6}
          />
        </div>

        {/* Data de implementação */}
        <div>
          <FieldLabel htmlFor="proj-date" hint="Data em que o projeto foi ao ar ou implementado">
            Data de Implementação
          </FieldLabel>
          <input
            id="proj-date"
            type="date"
            value={implementationDate}
            onChange={(e) => onChange("implementationDate", e.target.value)}
            className="rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
          />
        </div>
      </div>
    </SectionCard>
  );
}
