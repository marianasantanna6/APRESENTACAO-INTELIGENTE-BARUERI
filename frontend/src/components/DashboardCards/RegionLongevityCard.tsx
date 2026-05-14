import { DashboardMetric, RegionBars } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function RegionLongevityCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric title="Médias de Longevidade por Região">
      <RegionBars data={data.regionLongevity} />
    </DashboardMetric>
  );
}
