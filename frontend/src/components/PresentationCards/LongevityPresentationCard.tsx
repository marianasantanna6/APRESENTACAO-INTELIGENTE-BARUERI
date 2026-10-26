import {
  InsightList,
  PresentationCardShell,
  PresentationPreview,
  RegionBars,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function LongevityPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant}>
        <RegionBars
          data={data.regionLongevity}
          size={variant === "stage" ? "presentation" : "card"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
