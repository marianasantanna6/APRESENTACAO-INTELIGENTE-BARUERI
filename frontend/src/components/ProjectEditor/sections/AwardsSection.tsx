import { useEffect, useRef, useState } from "react";
import { FiAward, FiSearch, FiX } from "react-icons/fi";
import { authFetch } from "../../../lib/apiClient";
import type { ProjectAward } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  TextInput,
} from "../EditorShared";

type ApiAward = {
  id: string | number;
  name: string;
  institution: string;
  year: number;
  description: string | null;
  link: string | null;
};

type Props = {
  awards: ProjectAward[];
  onAdd: (prefill?: Partial<ProjectAward>) => void;
  onUpdate: (id: string, c: Partial<ProjectAward>) => void;
  onRemove: (id: string) => void;
};

export function AwardsSection({ awards, onAdd, onUpdate, onRemove }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiAward[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("name", query.trim());
        const res = await authFetch(`/api/projects/awards?${params}`);
        if (res.ok) {
          const data: ApiAward[] = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchOpen]);

  function handleSelect(a: ApiAward) {
    onAdd({
      name: a.name,
      organization: a.institution,
      year: String(a.year),
      description: a.description ?? "",
      link: a.link ?? "",
    });
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  }

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
        {awards.length === 0 && !searchOpen && (
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

        {/* Busca de prêmios existentes */}
        {searchOpen && (
          <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.8rem] font-semibold text-[#1e40af]">
                Buscar premiação existente
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#6b7280] hover:text-[#111827] transition-colors"
                aria-label="Fechar busca"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o nome do prêmio..."
                autoFocus
                className="w-full rounded-lg border border-[#bfdbfe] bg-white py-2 pl-9 pr-3 text-[0.85rem] text-[#111827] placeholder-[#9ca3af] focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {loading && (
                <p className="text-center text-[0.8rem] text-[#6b7280] py-3">Buscando...</p>
              )}
              {!loading && results.length === 0 && query.trim() && (
                <p className="text-center text-[0.8rem] text-[#6b7280] py-3">
                  Nenhum prêmio encontrado.
                </p>
              )}
              {!loading && results.length === 0 && !query.trim() && (
                <p className="text-center text-[0.8rem] text-[#6b7280] py-3">
                  Digite para buscar prêmios cadastrados em outros projetos.
                </p>
              )}
              {!loading && results.map((a) => (
                <button
                  key={`${a.id}`}
                  type="button"
                  onClick={() => handleSelect(a)}
                  className="w-full rounded-lg border border-[#dbeafe] bg-white px-3 py-2.5 text-left hover:bg-[#dbeafe] transition-colors"
                >
                  <p className="text-[0.84rem] font-semibold text-[#1e3a8a] leading-tight">
                    {a.name || a.institution}
                  </p>
                  <p className="text-[0.75rem] text-[#6b7280] mt-0.5">
                    {a.institution} · {a.year}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[0.82rem] font-medium text-[#1d4ed8] hover:bg-[#dbeafe] transition-colors"
          >
            <FiSearch className="h-3.5 w-3.5" />
            Buscar premiação existente
          </button>
          <AddButton onClick={() => onAdd()}>Cadastrar nova premiação</AddButton>
        </div>
      </div>
    </SectionCard>
  );
}
