import { ContributionBars, DashboardMetric } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function ContributionCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Contribuição Relativa de cada Componente para o IDH Nacional"
      ariaLabel="Abrir slide de contribuição relativa para o IDH nacional"
      onClick={() => onOpenSlide?.("contribution")}
    >
      <ContributionBars data={data.contribution} />
    </DashboardMetric>
  );
}
