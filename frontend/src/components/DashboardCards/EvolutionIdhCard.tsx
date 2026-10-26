import { DashboardMetric, EvolutionCardChart } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function EvolutionIdhCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Evolução do IDH"
      contentClassName="flex h-full items-center justify-center"
      ariaLabel="Abrir slide de evolução do IDH"
      onClick={() => onOpenSlide?.("evolution")}
    >
      <EvolutionCardChart points={data.historicalIdh} size="dashboard" />
    </DashboardMetric>
  );
}
