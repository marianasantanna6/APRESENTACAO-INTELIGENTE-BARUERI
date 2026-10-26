import { DashboardMetric, GroupedBars } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function RegionPillarsCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Três Pilares do IDH por Região"
      ariaLabel="Abrir slide de pilares do IDH por região"
      onClick={() => onOpenSlide?.("pillars")}
    >
      <GroupedBars data={data.regionPillars} />
    </DashboardMetric>
  );
}
