import { FiAward } from "react-icons/fi";
import type { ProjectAward } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  TextInput,
} from "../EditorShared";

type Props = {
  awards: ProjectAward[];
  onAdd: () => void;
  onUpdate: (id: string, c: Partial<ProjectAward>) => void;
  onRemove: (id: string) => void;
};

export function AwardsSection({ awards, onAdd, onUpdate, onRemove }: Props) {
  return (
    <SectionCard
      id="section-awards"
      icon={<FiAward className="h-4 w-4" />}
      title="Prêmios e Reconhecimentos"
      subtitle="Premiações recebidas pelo projeto"
      badge={<CompletionBadge count={awards.length} />}
      defaultOpen={false}
    >
      <div className="space-y-4">
        {awards.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#fde68a] bg-[#fffbeb] px-4 py-6 text-center">
            <FiAward className="mx-auto mb-2 h-8 w-8 text-[#fbbf24]" />
            <p className="text-[0.84rem] text-[#92400e]">
              Nenhum prêmio cadastrado ainda.
            </p>
          </div>
        )}

        {awards.map((aw, idx) => (
          <div key={aw.id} className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-[#92400e]">
                🏆 Prêmio {idx + 1}
              </span>
              <RemoveButton onClick={() => onRemove(aw.id)} label={`Remover prêmio ${idx + 1}`} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor={`aw-name-${aw.id}`} required>Nome do Prêmio</FieldLabel>
                <TextInput
                  id={`aw-name-${aw.id}`}
                  value={aw.name}
                  onChange={(v) => onUpdate(aw.id, { name: v })}
                  placeholder="Ex.: Melhor App Municipal"
                />
              </div>
              <div>
                <FieldLabel htmlFor={`aw-org-${aw.id}`}>Organização</FieldLabel>
                <TextInput
                  id={`aw-org-${aw.id}`}
                  value={aw.organization}
                  onChange={(v) => onUpdate(aw.id, { organization: v })}
                  placeholder="Ex.: ABRASF"
                />
              </div>
              <div>
                <FieldLabel htmlFor={`aw-year-${aw.id}`}>Ano</FieldLabel>
                <TextInput
                  id={`aw-year-${aw.id}`}
                  value={aw.year}
                  onChange={(v) => onUpdate(aw.id, { year: v })}
                  placeholder="2024"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor={`aw-desc-${aw.id}`} hint="Opcional">Descrição</FieldLabel>
                <TextInput
                  id={`aw-desc-${aw.id}`}
                  value={aw.description ?? ""}
                  onChange={(v) => onUpdate(aw.id, { description: v })}
                  placeholder="Contexto ou critérios da premiação"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor={`aw-link-${aw.id}`} hint="Opcional">Link</FieldLabel>
                <TextInput
                  id={`aw-link-${aw.id}`}
                  value={aw.link ?? ""}
                  onChange={(v) => onUpdate(aw.id, { link: v })}
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>
        ))}

        <AddButton onClick={onAdd}>Adicionar prêmio</AddButton>
      </div>
    </SectionCard>
  );
}
