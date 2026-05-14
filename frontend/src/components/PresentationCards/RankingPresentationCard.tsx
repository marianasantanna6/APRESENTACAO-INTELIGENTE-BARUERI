import {
  HorizontalRanking,
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function RankingPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant}>
        <HorizontalRanking
          data={data.rankingTopIdh}
          size={variant === "stage" ? "presentation" : "card"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
