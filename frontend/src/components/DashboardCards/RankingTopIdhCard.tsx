import { DashboardMetric, HorizontalRanking } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function RankingTopIdhCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="Ranking de UFs - Top 10 Maiores IDH"
      ariaLabel="Abrir slide de ranking do IDH"
      onClick={() => onOpenSlide?.("ranking")}
    >
      <HorizontalRanking data={data.rankingTopIdh} />
    </DashboardMetric>
  );
}
