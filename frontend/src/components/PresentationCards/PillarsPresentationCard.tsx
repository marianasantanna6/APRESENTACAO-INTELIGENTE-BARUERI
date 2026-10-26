import {
  GroupedBars,
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function PillarsPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant}>
        <GroupedBars
          data={data.regionPillars}
          size={variant === "stage" ? "presentation" : "card"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
