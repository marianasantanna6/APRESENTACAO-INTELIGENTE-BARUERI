import { FiTrendingUp } from "react-icons/fi";
import type { ProjectIndicator } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  TextInput,
} from "../EditorShared";

type Props = {
  indicators: ProjectIndicator[];
  onAdd: () => void;
  onUpdate: (id: string, changes: Partial<ProjectIndicator>) => void;
  onRemove: (id: string) => void;
};

export function IndicatorsSection({ indicators, onAdd, onUpdate, onRemove }: Props) {
  return (
    <SectionCard
      id="section-indicators"
      icon={<FiTrendingUp className="h-4 w-4" />}
      title="Indicadores"
      subtitle="Resultados e métricas quantificáveis do projeto"
      badge={<CompletionBadge count={indicators.length} />}
      defaultOpen={indicators.length > 0}
    >
      <div className="space-y-4">
        {indicators.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-6 text-center">
            <FiTrendingUp className="mx-auto mb-2 h-8 w-8 text-[#d1d5db]" />
            <p className="text-[0.84rem] text-[#9ca3af]">
              Nenhum indicador cadastrado. Adicione métricas que demonstrem o impacto do projeto.
            </p>
          </div>
        )}

        {indicators.map((ind, idx) => (
          <div
            key={ind.id}
            className="rounded-xl border border-[#e8e9f0] bg-[#f8f9fc] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.78rem] font-bold uppercase tracking-wide text-[#9ca3af]">
                Indicador {idx + 1}
              </span>
              <RemoveButton onClick={() => onRemove(ind.id)} label={`Remover indicador ${idx + 1}`} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor={`ind-label-${ind.id}`} required>Rótulo</FieldLabel>
                <TextInput
                  id={`ind-label-${ind.id}`}
                  value={ind.label}
                  onChange={(v) => onUpdate(ind.id, { label: v })}
                  placeholder="Ex.: Unidades integradas"
                />
              </div>

              <div>
                <FieldLabel htmlFor={`ind-value-${ind.id}`} required>Valor</FieldLabel>
                <TextInput
                  id={`ind-value-${ind.id}`}
                  value={ind.value}
                  onChange={(v) => onUpdate(ind.id, { value: v })}
                  placeholder="Ex.: 43 ou 78%"
                />
              </div>

              <div>
                <FieldLabel htmlFor={`ind-unit-${ind.id}`} hint="Opcional">Unidade</FieldLabel>
                <TextInput
                  id={`ind-unit-${ind.id}`}
                  value={ind.unit ?? ""}
                  onChange={(v) => onUpdate(ind.id, { unit: v })}
                  placeholder="Ex.: UBS/UPA, %, registros"
                />
              </div>

              <div>
                <FieldLabel htmlFor={`ind-source-${ind.id}`}>Fonte</FieldLabel>
                <TextInput
                  id={`ind-source-${ind.id}`}
                  value={ind.source}
                  onChange={(v) => onUpdate(ind.id, { source: v })}
                  placeholder="Ex.: Secretaria de Saúde"
                />
              </div>

              <div>
                <FieldLabel htmlFor={`ind-year-${ind.id}`}>Ano</FieldLabel>
                <TextInput
                  id={`ind-year-${ind.id}`}
                  value={ind.year}
                  onChange={(v) => onUpdate(ind.id, { year: v })}
                  placeholder="2026"
                />
              </div>
            </div>
          </div>
        ))}

        <AddButton onClick={onAdd}>Adicionar indicador</AddButton>
      </div>
    </SectionCard>
  );
}
