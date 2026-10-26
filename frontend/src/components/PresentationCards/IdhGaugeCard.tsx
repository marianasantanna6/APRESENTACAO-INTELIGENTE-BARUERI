import {
  DonutGauge,
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function IdhGaugeCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  const gaugeSize = variant === "stage" ? "presentation" : "card";

  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant}>
        <DonutGauge
          value={data.nationalIdh}
          label={data.nationalIdh.toFixed(3)}
          size={gaugeSize}
          showCaption={variant === "stage"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
