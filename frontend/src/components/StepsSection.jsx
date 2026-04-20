import SectionHeader from "./SectionHeader";
import { FaDatabase, FaWrench, FaChartBar, FaArrowDown } from "react-icons/fa";

const steps = [
  {
    step: "Passo 01",
    title: "Conecte APIs",
    description:
      "Selecione fontes de dados como IBGE, dados governamentais e indicadores.",
    icon: FaDatabase,
  },
  {
    step: "Passo 02",
    title: "Configure",
    description: "Escolha o módulo e personalize o layout da apresentação.",
    icon: FaWrench,
  },
  {
    step: "Passo 03",
    title: "Apresente",
    description:
      "Gere apresentações dinâmicas com dados atualizados em tempo real.",
    icon: FaChartBar,
  },
];

const cardBase =
  "rounded-[16px] border border-black/5 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]";

function StepsSection() {
  return (
    <section id="como-funciona" className="px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-325.5">
        <div className="reveal-on-scroll">
          <SectionHeader
            title="Como funciona"
            description="Três passos simples para apresentações inteligentes"
          />
        </div>

        <div className="mt-12 flex flex-col items-stretch justify-center gap-4 lg:flex-row lg:items-center lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="reveal-on-scroll flex flex-col items-center gap-4 lg:flex-row"
                style={{ "--reveal-delay": `${index * 110}ms` }}
              >
                <article
                  className={`${cardBase} flex h-full w-full max-w-92 flex-col items-center px-6 pb-10 pt-11 text-center`}
                >
                  <div className="flex h-26.75 w-29 items-center justify-center rounded-[15px] bg-[linear-gradient(180deg,#8cb3ce_0%,#1675b8_100%)]">
                    <Icon
                      className={`text-white ${
                        step.step === "Passo 01" ? "h-12.5 w-12.5" : "h-16 w-16"
                      }`}
                    />
                  </div>

                  <span className="mt-7 bg-[linear-gradient(180deg,#1675b8_49.519%,#ffffff_100%)] bg-clip-text text-[1rem] font-extrabold tracking-[0.03em] text-transparent">
                    {step.step}
                  </span>
                  <h3 className="mt-4 text-[1.65rem] font-bold tracking-[-0.02em] text-[#1e1e1e]">
                    {step.title}
                  </h3>
                  <p className="mt-6 max-w-84 text-[0.95rem] leading-loose tracking-[0.02em] text-[#706e6e]">
                    {step.description}
                  </p>
                </article>

                {index < steps.length - 1 && (
                  <span className="hidden text-3xl text-black/20 lg:inline">
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="reveal-on-scroll mt-10 flex justify-center">
          <a
            href="#inicio"
            className="inline-flex h-14.5 items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(100.26deg,rgba(10,52,82,0.63)_1.91%,#1675b8_68.48%)] px-7 text-[1rem] font-bold !text-white shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 sm:h-17.25 sm:px-8 sm:text-[1.15rem]"
          >
            <span className="font-bold !text-white">Criar Apresentação</span>
            <FaArrowDown className="h-5 w-5 rotate-270 text-amber-100 sm:h-5.5 sm:w-5.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default StepsSection;
