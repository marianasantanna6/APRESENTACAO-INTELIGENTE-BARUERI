import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { FaArrowDown, FaServer } from "react-icons/fa";
import { ROUTE_PATHS } from "../router";

type BarChartDatum = {
  height: string;
};

const barChartData: BarChartDatum[] = [
  { height: "78%" },
  { height: "64%" },
  { height: "88%" },
  { height: "52%" },
  { height: "72%" },
];

const pieSegments = [
  ["30", "0", "#E62787"],
  ["25", "-30", "#F7A61E"],
  ["22", "-55", "#5FAD41"],
  ["23", "-77", "#1675B8"],
] as const;

function HeroSection() {
  return (
    <section
      id="inicio"
      className="bg-[linear-gradient(180deg,#f8fafc_24%,rgba(158,172,181,0.07)_100%)]"
    >
      <div className="mx-auto flex max-w-310 flex-col gap-10 px-5 pb-20 pt-12 sm:px-6 md:pb-24 md:pt-16 lg:px-8">
        <div className="max-w-none">
          <h1 className="max-w-[20ch] text-[2.15rem] leading-[1.08] font-extrabold tracking-[-0.04em] text-[#222] [text-wrap:balance] sm:text-[2.95rem] lg:max-w-[22ch] lg:text-[3.65rem] xl:text-[4rem]">
            O fim das apresentações institucionais{" "}
            <span className="relative inline-block align-bottom">
              <span aria-hidden="true" className="invisible">
                desatualizadas
              </span>
              <span className="typewriter-word absolute left-0 top-0 bg-[linear-gradient(90deg,#0a3452_0%,#1675b8_78.846%)] bg-clip-text text-transparent">
                desatualizadas
              </span>
            </span>
          </h1>

          <p
            className="reveal-on-scroll mt-5 max-w-240 text-[1rem] leading-8 text-black/45 sm:text-[1.1rem] lg:text-[1.75rem] lg:leading-[3.1rem]"
            style={{ "--reveal-delay": "180ms" } as CSSProperties}
          >
            Crie apresentações dinâmicas, personalizadas e atualizadas em tempo
            real com dados oficiais. Automatize seu conteúdo institucional com
            inteligência artificial.
          </p>

          <div
            className="reveal-on-scroll mt-8 flex flex-col gap-4 sm:flex-row"
            style={{ "--reveal-delay": "280ms" } as CSSProperties}
          >
            <Link
              to={ROUTE_PATHS.login}
              className="inline-flex h-14.5 items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(100.26deg,rgba(10,52,82,0.63)_1.91%,#1675b8_68.48%)] px-7 text-[1rem] font-bold !text-white shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 sm:h-17.25 sm:px-8 sm:text-[1.15rem]"
            >
              <span className="font-bold !text-white">Criar Apresentação</span>
              <FaArrowDown className="h-5 w-5 rotate-270 text-amber-100 sm:h-5.5 sm:w-5.5" />
            </Link>

            <Link
              to={ROUTE_PATHS.login}
              className="inline-flex h-14.5 items-center justify-center rounded-[18px] border-[3px] border-[#1675b8] bg-white px-7 text-[1rem] font-bold text-[#1675b8] shadow-[0_4px_4px_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 sm:h-17.25 sm:px-8 sm:text-[1.15rem]"
            >
              Criar Dashboard
            </Link>
          </div>
        </div>

        <div
          className="reveal-on-scroll mx-auto w-full max-w-220 rounded-[30px] bg-white px-4 pb-6 pt-5 shadow-[0_4px_29px_rgba(0,0,0,0.25)] sm:px-8 sm:pb-8"
          style={{ "--reveal-delay": "360ms" } as CSSProperties}
        >
          <div className="mb-6 flex gap-3">
            <div className="h-7 w-7 rounded-full bg-[#1675b8]" />
            <div className="h-7 w-7 rounded-full bg-[#1675b8]/80" />
            <div className="h-7 w-7 rounded-full bg-[#1675b8]/60" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[383px_1fr]">
            <div className="animated-pie-chart flex items-center justify-center rounded-[26px] bg-[rgba(202,196,208,0.25)] px-5 py-8 sm:px-7">
              <div
                className="flex aspect-square w-full max-w-80 items-center justify-center rounded-full"
                role="img"
                aria-label="Gráfico de pizza animado"
              >
                <div className="pie-chart relative h-full w-full rounded-full">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 120 120"
                    aria-hidden="true"
                  >
                    <circle
                      className="pie-track"
                      cx="60"
                      cy="60"
                      r="42"
                      pathLength="100"
                    />
                    {pieSegments.map(([size, offset, color], index) => (
                      <circle
                        key={`${color}-${offset}`}
                        className="pie-segment"
                        cx="60"
                        cy="60"
                        r="42"
                        pathLength="100"
                        style={
                          {
                            "--segment-size": size,
                            "--segment-offset": offset,
                            "--segment-color": color,
                            "--segment-delay": `${index * 260}ms`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </svg>
                  <div className="pie-core absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                  <div className="pie-pulse absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="animated-bar-chart rounded-[26px] bg-[rgba(202,196,208,0.25)] px-5 py-7 sm:px-8">
                <div
                  className="grid h-40 grid-cols-5 items-end gap-3 border-b border-[#aeb8c2]/35"
                  role="img"
                  aria-label="Gráfico animado de barras"
                >
                  {barChartData.map((bar, index) => (
                    <div
                      key={`${bar.height}-${index}`}
                      className="flex h-full min-w-0 items-end justify-center"
                    >
                      <div className="flex h-full w-full max-w-10 items-end justify-center">
                        <div
                          className="chart-bar w-full rounded-t-[8px] bg-[linear-gradient(180deg,#8cb3ce_0%,#5f9fc8_45%,#1675b8_100%)] shadow-[0_8px_14px_rgba(22,117,184,0.12)]"
                          style={
                            {
                              "--bar-height": bar.height,
                              "--bar-delay": `${index * 120}ms`,
                            } as CSSProperties
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
