import {
  EvolutionCardChart,
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function EvolutionPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant} className="min-h-0 items-stretch">
        <EvolutionCardChart
          points={data.historicalIdh}
          size={variant === "stage" ? "presentation" : "card"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
