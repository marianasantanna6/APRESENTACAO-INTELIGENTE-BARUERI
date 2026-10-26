import { DashboardMetric, DonutGauge } from "../DashboardWidgets";
import type { DashboardSlideAction, PresentationMockData } from "./types";

export function NationalIdhCard({
  data,
  onOpenSlide,
}: { data: PresentationMockData } & DashboardSlideAction) {
  return (
    <DashboardMetric
      title="IDH Nacional"
      titleClassName="text-center"
      contentClassName="flex h-full items-center justify-center"
      ariaLabel="Abrir slide de IDH nacional"
      onClick={() => onOpenSlide?.("idh-gauge")}
    >
      <DonutGauge
        value={data.nationalIdh}
        label={data.nationalIdh.toFixed(3)}
        showCaption
      />
    </DashboardMetric>
  );
}
