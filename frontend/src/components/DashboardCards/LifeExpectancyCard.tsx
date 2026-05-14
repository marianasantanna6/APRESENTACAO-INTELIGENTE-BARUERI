import { DashboardMetric } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function LifeExpectancyCard({
  data,
}: {
  data: PresentationMockData;
}) {
  return (
    <DashboardMetric
      title="Expectativa de Vida"
      titleClassName="text-center"
      contentClassName="flex h-full items-center justify-center"
    >
      <div className="mx-auto max-w-[200px] space-y-0 text-center">
        <p className="text-[2.9rem] font-extrabold leading-none text-[#0d5283]">
          {data.lifeExpectancy.toFixed(1)}
        </p>
        <p className="text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-[#706e6e]">
          Anos
        </p>
      </div>
    </DashboardMetric>
  );
}
