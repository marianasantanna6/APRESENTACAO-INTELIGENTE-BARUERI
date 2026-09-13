import { useState } from "react";
import { FiLink, FiPlus, FiX } from "react-icons/fi";
import type { ProjectOfficialLink } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  TextInput,
} from "../EditorShared";

type Props = {
  links: ProjectOfficialLink[];
  sources: string[];
  onAddLink: () => void;
  onUpdateLink: (id: string, c: Partial<ProjectOfficialLink>) => void;
  onRemoveLink: (id: string) => void;
  onAddSource: (v: string) => void;
  onRemoveSource: (v: string) => void;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinksSection({
  links, sources,
  onAddLink, onUpdateLink, onRemoveLink,
  onAddSource, onRemoveSource,
}: Props) {
  const [sourceInput, setSourceInput] = useState("");

  function handleAddSource() {
    const v = sourceInput.trim();
    if (!v || sources.includes(v)) return;
    onAddSource(v);
    setSourceInput("");
  }

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

                <div className="space-y-3">
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

        {/* Fontes de dados */}
        <div>
          <FieldLabel hint="Cole a URL — o rótulo é gerado automaticamente pelo sistema">
            Fontes de Dados
          </FieldLabel>

          <div className="flex gap-2">
            <input
              type="url"
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddSource(); }
              }}
              placeholder="https://…"
              className="flex-1 rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
            />
            <button
              type="button"
              onClick={handleAddSource}
              disabled={!sourceInput.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#eff6ff] px-4 py-2.5 text-[0.84rem] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:opacity-40"
            >
              <FiPlus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((url) => (
                <div
                  key={url}
                  className="flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[0.8rem] font-medium text-[#15803d]"
                >
                  <span className="max-w-[220px] truncate" title={url}>
                    {extractDomain(url)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveSource(url)}
                    className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                    aria-label={`Remover ${url}`}
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
