import { BrazilIdhMap, DashboardMetric } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function StateDistributionCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Distribuição Geográfica do IDH por UF"
      ariaLabel="Abrir slide de distribuição geográfica do IDH"
      onClick={() => onOpenSlide?.("map")}
    >
      <BrazilIdhMap data={data.stateDistribution} />
    </DashboardMetric>
  );
}
