import { FiGlobe } from "react-icons/fi";
import type { OdsGoal } from "../../../types/project";
import { CompletionBadge, SectionCard } from "../EditorShared";

const ODS_META: Record<OdsGoal, { title: string; color: string }> = {
  1:  { title: "Erradicação da Pobreza",          color: "#e5243b" },
  2:  { title: "Fome Zero",                        color: "#dda63a" },
  3:  { title: "Saúde e Bem-estar",                color: "#4c9f38" },
  4:  { title: "Educação de Qualidade",            color: "#c5192d" },
  5:  { title: "Igualdade de Gênero",              color: "#ff3a21" },
  6:  { title: "Água Potável e Saneamento",        color: "#26bde2" },
  7:  { title: "Energia Limpa e Acessível",        color: "#fcc30b" },
  8:  { title: "Trabalho Decente",                 color: "#a21942" },
  9:  { title: "Indústria e Inovação",             color: "#fd6925" },
  10: { title: "Redução das Desigualdades",        color: "#dd1367" },
  11: { title: "Cidades Sustentáveis",             color: "#fd9d24" },
  12: { title: "Consumo Responsável",              color: "#bf8b2e" },
  13: { title: "Ação Contra a Mudança do Clima",   color: "#3f7e44" },
  14: { title: "Vida na Água",                     color: "#0a97d9" },
  15: { title: "Vida Terrestre",                   color: "#56c02b" },
  16: { title: "Paz, Justiça e Instituições",      color: "#00689d" },
  17: { title: "Parcerias pelas Metas",            color: "#19486a" },
};

type Props = {
  selected: OdsGoal[];
  onToggle: (n: OdsGoal) => void;
};

export function OdsSection({ selected, onToggle }: Props) {
  const goals = Array.from({ length: 17 }, (_, i) => (i + 1) as OdsGoal);

  return (
    <SectionCard
      id="section-ods"
      icon={<FiGlobe className="h-4 w-4" />}
      title="ODS — Objetivos de Desenvolvimento Sustentável"
      subtitle="Marque os ODS da ONU relacionados a este projeto"
      badge={<CompletionBadge count={selected.length} />}
      defaultOpen={false}
    >
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
        {goals.map((n) => {
          const meta = ODS_META[n];
          const active = selected.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggle(n)}
              title={meta.title}
              aria-pressed={active}
              aria-label={`ODS ${n}: ${meta.title}`}
              className="group relative flex flex-col items-center gap-1 rounded-xl p-2 transition"
            >
              {/* Círculo */}
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-[1rem] font-bold text-white transition-all ${
                  active
                    ? "scale-110 shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                    : "opacity-30 grayscale hover:opacity-60 hover:grayscale-0"
                }`}
                style={{ backgroundColor: meta.color }}
              >
                {n}
              </span>
              {active && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[0.6rem] font-bold shadow" style={{ color: meta.color }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-[0.76rem] font-semibold uppercase tracking-wide text-[#9ca3af]">
            Selecionados
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.sort((a, b) => a - b).map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.76rem] font-semibold text-white"
                style={{ backgroundColor: ODS_META[n].color }}
              >
                {n} — {ODS_META[n].title}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
