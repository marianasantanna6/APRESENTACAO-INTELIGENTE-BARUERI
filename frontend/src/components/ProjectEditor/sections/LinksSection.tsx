import { FiLink } from "react-icons/fi";
import type { ProjectOfficialLink } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  SelectInput,
  TagInput,
  TextInput,
} from "../EditorShared";

const LINK_TYPE_OPTIONS: { value: ProjectOfficialLink["type"]; label: string }[] = [
  { value: "portal",   label: "Portal" },
  { value: "document", label: "Documento" },
  { value: "report",   label: "Relatório" },
  { value: "video",    label: "Vídeo" },
  { value: "other",    label: "Outro" },
];

type Props = {
  links: ProjectOfficialLink[];
  sources: string[];
  onAddLink: () => void;
  onUpdateLink: (id: string, c: Partial<ProjectOfficialLink>) => void;
  onRemoveLink: (id: string) => void;
  onAddSource: (v: string) => void;
  onRemoveSource: (v: string) => void;
};

export function LinksSection({
  links, sources,
  onAddLink, onUpdateLink, onRemoveLink,
  onAddSource, onRemoveSource,
}: Props) {
  return (
    <SectionCard
      id="section-links"
      icon={<FiLink className="h-4 w-4" />}
      title="Links e Fontes"
      subtitle="Links oficiais e referências utilizadas"
      badge={<CompletionBadge count={links.length + sources.length} />}
      defaultOpen={false}
    >
      <div className="space-y-6">
        {/* Links oficiais */}
        <div>
          <FieldLabel hint="Portais, documentos, relatórios ou vídeos relacionados">
            Links Oficiais
          </FieldLabel>

          <div className="space-y-3">
            {links.map((link, idx) => (
              <div key={link.id} className="rounded-xl border border-[#e8e9f0] bg-[#f8f9fc] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.78rem] font-bold uppercase tracking-wide text-[#9ca3af]">
                    Link {idx + 1}
                  </span>
                  <RemoveButton onClick={() => onRemoveLink(link.id)} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor={`link-label-${link.id}`}>Rótulo</FieldLabel>
                    <TextInput
                      id={`link-label-${link.id}`}
                      value={link.label}
                      onChange={(v) => onUpdateLink(link.id, { label: v })}
                      placeholder="Ex.: Portal SIT"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`link-type-${link.id}`}>Tipo</FieldLabel>
                    <SelectInput
                      id={`link-type-${link.id}`}
                      value={link.type}
                      onChange={(v) => onUpdateLink(link.id, { type: v })}
                      options={LINK_TYPE_OPTIONS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor={`link-url-${link.id}`}>URL</FieldLabel>
                    <TextInput
                      id={`link-url-${link.id}`}
                      value={link.url}
                      onChange={(v) => onUpdateLink(link.id, { url: v })}
                      placeholder="https://…"
                    />
                  </div>
                </div>
              </div>
            ))}

            <AddButton onClick={onAddLink}>Adicionar link</AddButton>
          </div>
        </div>

        {/* Fontes */}
        <div>
          <FieldLabel hint="Entidades, sistemas ou publicações que embasam os dados">
            Fontes de Dados
          </FieldLabel>
          <TagInput
            tags={sources}
            onAdd={onAddSource}
            onRemove={onRemoveSource}
            placeholder="Ex.: IBGE, Secretaria de Saúde…"
            tagColor="bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
          />
        </div>
      </div>
    </SectionCard>
  );
}
