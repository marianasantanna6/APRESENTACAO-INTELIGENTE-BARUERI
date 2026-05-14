import { DashboardMetric, EvolutionCardChart } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function EvolutionIdhCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric
      title="Evolução do IDH"
      contentClassName="flex h-full items-center justify-center"
    >
      <EvolutionCardChart points={data.historicalIdh} size="dashboard" />
    </DashboardMetric>
  );
}
