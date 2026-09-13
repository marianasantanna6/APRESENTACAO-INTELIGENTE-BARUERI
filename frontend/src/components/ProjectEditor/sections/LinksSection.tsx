import { useState } from "react";
import { FiExternalLink, FiLink, FiPlus, FiX } from "react-icons/fi";
import type { ProjectOfficialLink } from "../../../types/project";
import {
  CompletionBadge,
  FieldLabel,
  SectionCard,
} from "../EditorShared";

type Props = {
  links: ProjectOfficialLink[];
  onAddLink: (url: string) => void;
  onUpdateLink: (id: string, c: Partial<ProjectOfficialLink>) => void;
  onRemoveLink: (id: string) => void;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinksSection({ links, onAddLink, onUpdateLink, onRemoveLink }: Props) {
  const [urlInput, setUrlInput] = useState("");

  function handleAdd() {
    const v = urlInput.trim();
    if (!v) return;
    onAddLink(v);
    setUrlInput("");
  }

  return (
    <SectionCard
      id="section-links"
      icon={<FiLink className="h-4 w-4" />}
      title="Links Oficiais"
      subtitle="Portais, documentos e referências do projeto"
      badge={<CompletionBadge count={links.length} />}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <FieldLabel hint="Cole a URL — o rótulo é gerado automaticamente pelo sistema">
          Adicionar link
        </FieldLabel>

        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
            }}
            placeholder="https://…"
            className="flex-1 rounded-xl border border-[#e5e7eb] px-4 py-2.5 text-[0.9rem] text-[#1e1e1e] placeholder:text-[#9ca3af] focus:border-[#6fa8d6] focus:outline-none focus:ring-2 focus:ring-[#6fa8d6]/20 transition"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!urlInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-[#eff6ff] px-4 py-2.5 text-[0.84rem] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:opacity-40"
          >
            <FiPlus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[0.8rem] font-medium text-[#1d4ed8]"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 max-w-[220px] truncate hover:underline"
                  title={link.url}
                >
                  <FiExternalLink className="h-3 w-3 shrink-0" />
                  {extractDomain(link.url) || link.label || link.url}
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveLink(link.id)}
                  className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                  aria-label={`Remover ${link.url}`}
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
