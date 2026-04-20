import { Link } from "react-router-dom";
import { FaArrowDown, FaServer } from "react-icons/fa";
import heroChartPie from "../assets/images/hero-chart-pie.png";
import heroChartBars from "../assets/images/hero-chart-bars.png";

function HeroSection() {
  return (
    <section
      id="inicio"
      className="bg-[linear-gradient(180deg,#f8fafc_24%,rgba(158,172,181,0.07)_100%)]"
    >
      <div className="mx-auto flex max-w-310 flex-col gap-10 px-5 pb-20 pt-12 sm:px-6 md:pb-24 md:pt-16 lg:px-8">
        <div className="max-w-245">
          <h1 className="max-w-250 text-[2.35rem] leading-[1.06] font-extrabold tracking-[-0.04em] text-[#222] sm:text-[3.3rem] lg:text-[4.75rem]">
            O fim das apresentações institucionais{" "}
            <span className="bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_78.846%)] bg-clip-text text-transparent">
              desatualizadas
            </span>
          </h1>

          <p className="mt-5 max-w-240 text-[1rem] leading-8 text-black/45 sm:text-[1.1rem] lg:text-[1.75rem] lg:leading-[3.1rem]">
            Crie apresentações dinâmicas, personalizadas e atualizadas em tempo
            real com dados oficiais. Automatize seu conteúdo institucional com
            inteligência artificial.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex h-14.5 items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(100.26deg,rgba(10,52,82,0.63)_1.91%,#1675b8_68.48%)] px-7 text-[1rem] font-bold text-[#f8fafc] shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 sm:h-17.25 sm:px-8 sm:text-[1.15rem]"
            >
              Criar Apresentação
              <FaArrowDown className="h-5 w-5 rotate-90 sm:h-5.5 sm:w-5.5" />
            </Link>

            <Link
              to="/login"
              className="inline-flex h-14.5 items-center justify-center rounded-[18px] border-[3px] border-[#1675b8] bg-white px-7 text-[1rem] font-bold text-[#1675b8] shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 sm:h-17.25 sm:px-8 sm:text-[1.15rem]"
            >
              Criar Dashboard
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-220 rounded-[30px] bg-white px-4 pb-6 pt-5 shadow-[0_4px_29px_rgba(0,0,0,0.25)] sm:px-8 sm:pb-8">
          <div className="mb-6 flex gap-3">
            <div className="h-7 w-7 rounded-full bg-[#1675b8]" />
            <div className="h-7 w-7 rounded-full bg-[#1675b8]/80" />
            <div className="h-7 w-7 rounded-full bg-[#1675b8]/60" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[383px_1fr]">
            <div className="rounded-[26px] bg-[rgba(202,196,208,0.25)]">
              <img
                src={heroChartPie}
                alt="Gráfico de pizza do dashboard"
                className="mx-auto h-auto max-h-85.5 w-full max-w-90 object-contain"
              />
            </div>

            <div className="grid gap-4">
              <div className="rounded-[26px] bg-[rgba(202,196,208,0.25)] px-4 py-4 sm:px-8">
                <img
                  src={heroChartBars}
                  alt="Gráfico de barras do dashboard"
                  className="mx-auto h-auto max-h-42.5 w-full max-w-70.5 object-contain"
                />
              </div>

              <div className="flex items-center gap-5 rounded-[26px] bg-[rgba(202,196,208,0.25)] px-6 py-7">
                <div className="flex h-20 w-26 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#8cb3ce_0%,#1675b8_100%)]">
                  <FaServer className="h-11 w-11 text-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-[1.15rem] font-bold text-black sm:text-[1.5rem]">
                    Atualizado
                  </p>
                  <p className="text-[1rem] font-semibold text-[#706e6e] sm:text-[1.25rem]">
                    Agora mesmo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
