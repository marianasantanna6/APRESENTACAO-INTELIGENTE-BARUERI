import {
  ContributionBars,
  InsightList,
  PresentationCardShell,
  PresentationPreview,
} from "../DashboardWidgets";
import type { PresentationCardComponentProps } from "./types";

export function ContributionPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  return (
    <PresentationCardShell card={card} variant={variant}>
      <PresentationPreview variant={variant} className="items-stretch">
        <ContributionBars
          data={data.contribution}
          size={variant === "stage" ? "presentation" : "card"}
          showNotes={variant === "stage"}
        />
      </PresentationPreview>
      <InsightList items={card.insights} variant={variant} />
    </PresentationCardShell>
  );
}
