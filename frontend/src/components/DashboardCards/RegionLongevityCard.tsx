import { DashboardMetric, RegionBars } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function RegionLongevityCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Médias de Longevidade por Região"
      ariaLabel="Abrir slide de longevidade por região"
      onClick={() => onOpenSlide?.("longevity")}
    >
      <RegionBars data={data.regionLongevity} />
    </DashboardMetric>
  );
}
