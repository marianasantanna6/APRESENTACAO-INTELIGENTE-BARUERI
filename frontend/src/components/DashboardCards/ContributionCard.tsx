import { ContributionBars, DashboardMetric } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function ContributionCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric title="Contribuição Relativa de cada componente para o IDH Nacional">
      <ContributionBars data={data.contribution} />
    </DashboardMetric>
  );
}
