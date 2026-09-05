import type { CSSProperties } from "react";
import type { IconType } from "react-icons";
import { FaCogs, FaLanguage, FaPlug, FaSync } from "react-icons/fa";
import SectionHeader from "./SectionHeader";

type Feature = {
  title: string;
  description: string;
  icon: IconType;
};

const features: Feature[] = [
  {
    title: "Sistema dinâmico",
    description:
      "Apresentações que se adaptam ao contexto e público-alvo automaticamente.",
    icon: FaCogs,
  },
  {
    title: "Integração com APIs",
    description:
      "Dados do IBGE, PIB, IDH e fontes governamentais em tempo real.",
    icon: FaPlug,
  },
  {
    title: "Multi-idioma",
    description: "Tradução automática para português, inglês e espanhol.",
    icon: FaLanguage,
  },
  {
    title: "Atualização Automática",
    description: "Dados sempre atualizados sem intervenção manual.",
    icon: FaSync,
  },
];

const cardBase =
  "rounded-[16px] border border-black/5 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]";

function FeaturesSection() {
  return (
    <section
      id="funcionalidades"
      data-public-section="surface"
      className="bg-[linear-gradient(121.94deg,#ffffff_0%,#f5f0f0_84.07%)] px-5 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-303.5">
        <div className="reveal-on-scroll">
          <SectionHeader
            title="Por que usar?"
            description="Recursos que transformam suas apresentações"
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                data-public-card="tile"
                className={`reveal-on-scroll ${cardBase} min-h-57.5 px-6 py-6 sm:px-7`}
                style={
                  { "--reveal-delay": `${index * 100}ms` } as CSSProperties
                }
              >
                <div className="flex h-17.25 w-22.5 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#8cb3ce_0%,#1675b8_100%)]">
                  <Icon className="h-11 w-11 text-white" />
                </div>

                <h3
                  data-public-heading
                  className="mt-7 text-[1.35rem] font-semibold tracking-[-0.02em] text-black sm:text-[1.5rem]"
                >
                  {feature.title}
                </h3>
                <p
                  data-public-text
                  className="mt-4 max-w-126.25 text-sm leading-[2.1] tracking-[0.01em] text-black/70"
                >
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
