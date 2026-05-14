import { DashboardMetric, DonutGauge } from "../DashboardWidgets";
import type { PresentationMockData } from "./types";

export function NationalIdhCard({ data }: { data: PresentationMockData }) {
  return (
    <DashboardMetric
      title="IDH Nacional"
      titleClassName="text-center"
      contentClassName="flex h-full items-center justify-center"
    >
      <DonutGauge
        value={data.nationalIdh}
        label={data.nationalIdh.toFixed(3)}
        showCaption
      />
    </DashboardMetric>
  );
}
