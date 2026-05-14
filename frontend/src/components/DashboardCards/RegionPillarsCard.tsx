import { DashboardMetric, GroupedBars } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function RegionPillarsCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric title="Três Pilares do IDH por Região">
      <GroupedBars data={data.regionPillars} />
    </DashboardMetric>
  );
}
