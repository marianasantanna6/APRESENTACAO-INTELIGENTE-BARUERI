import { DashboardMetric } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function IncomePerCapitaCard({
  data,
}: {
  data: PresentationMockData;
}) {
  return (
    <DashboardMetric
      title="Renda per Capita"
      titleClassName="text-center"
      contentClassName="flex h-full items-center justify-center"
    >
      <div className="mx-auto max-w-[200px] space-y-0 text-center">
        <p className="text-[2.15rem] font-extrabold leading-tight text-[#0d5283]">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          }).format(data.incomePerCapita)}
        </p>
        <p className="text-[0.95rem] leading-5 text-[#706e6e]">
          Renda média individual anual simulada.
        </p>
      </div>
    </DashboardMetric>
  );
}
