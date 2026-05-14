import { DashboardMetric, HorizontalRanking } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function RankingTopIdhCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric title="Ranking de UFs - Top 10 Maiores IDH">
      <HorizontalRanking data={data.rankingTopIdh} />
    </DashboardMetric>
  );
}
