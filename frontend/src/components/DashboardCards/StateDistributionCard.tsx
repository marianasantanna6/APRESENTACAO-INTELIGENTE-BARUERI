import { BrazilIdhMap, DashboardMetric } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function StateDistributionCard({
  data,
}: {
  data: PresentationMockData;
}) {
  return (
    <DashboardMetric title="Distribuição Geográfica do IDH por UF">
      <BrazilIdhMap data={data.stateDistribution} />
    </DashboardMetric>
  );
}
