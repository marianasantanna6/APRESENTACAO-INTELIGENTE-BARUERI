import {
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function NationalSummaryCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  const metricBlockClassName =
    variant === "stage"
      ? "rounded-[18px] bg-white px-5 py-4 text-left shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
      : "rounded-[14px] bg-white px-4 py-3 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]";
  const labelClassName =
    variant === "stage"
      ? "text-[0.82rem] uppercase tracking-[0.12em] text-[#706e6e]"
      : "text-[0.72rem] uppercase tracking-[0.08em] text-[#706e6e]";
  const valueClassName =
    variant === "stage"
      ? "mt-2 text-[2rem] font-extrabold text-[#0d5283]"
      : "mt-1.5 text-[1.55rem] font-extrabold text-[#0d5283]";

  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant} className="items-stretch">
        <div className={`grid w-full ${variant === "stage" ? "gap-4" : "gap-2.5"}`}>
          <div className={metricBlockClassName}>
            <p className={labelClassName}>
              Expectativa de vida
            </p>
            <p className={valueClassName}>
              {data.lifeExpectancy.toFixed(1)} anos
            </p>
          </div>

          <div className={metricBlockClassName}>
            <p className={labelClassName}>
              Renda per capita
            </p>
            <p className={variant === "stage" ? "mt-2 text-[1.65rem] font-extrabold text-[#0d5283]" : "mt-1.5 text-[1.3rem] font-extrabold text-[#0d5283]"}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(data.incomePerCapita)}
            </p>
          </div>
        </div>
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
