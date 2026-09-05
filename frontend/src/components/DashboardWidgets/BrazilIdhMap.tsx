import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { StateDistributionItem } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, getBucketColor, legendBuckets, type ScatterPointShapeProps, formatIdh } from "./chartShared";

export function BrazilIdhMap({
  data,
  size = "dashboard",
}: {
  data: StateDistributionItem[];
  size?: "dashboard" | "card" | "presentation";
}) {
  const chartHeight =
    size === "presentation" ? 312 : size === "card" ? 246 : 260;
  const isPresentation = size === "presentation";
  const layoutClassName =
    size === "card"
      ? "mx-auto w-full max-w-[336px] space-y-4"
      : isPresentation
        ? "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_190px]"
        : "grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_156px]";
  const legendClassName =
    size === "card"
      ? "grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.72rem] leading-4 text-[#706e6e]"
      : isPresentation
        ? "space-y-3 rounded-[18px] bg-white px-4 py-4 text-[0.88rem] text-[#706e6e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        : "space-y-2 rounded-[14px] bg-white px-3 py-3 text-[0.72rem] text-[#706e6e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]";

  return (
    <div className={layoutClassName}>
      <div className="min-w-0" style={{ height: chartHeight, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
            <YAxis type="number" dataKey="y" hide reversed domain={[0, 100]} />
            <Tooltip
              cursor={false}
              content={(tooltipProps) => {
                const tooltip = tooltipProps as unknown as ChartTooltipProps;

                if (!tooltip.active || !tooltip.payload?.length) {
                  return null;
                }

                const item = tooltip.payload[0]?.payload as StateDistributionItem | undefined;

                if (!item) {
                  return null;
                }

                return (
                  <ChartTooltipBox
                    label={item.region}
                    rows={[
                      {
                        name: item.uf,
                        value: formatIdh(item.value),
                        color: getBucketColor(item.value),
                      },
                    ]}
                  />
                );
              }}
            />
            <Scatter
              data={data}
              shape={(scatterProps) => {
                const point = scatterProps as ScatterPointShapeProps<StateDistributionItem>;
                const item = point.payload;

                if (!item) {
                  return null;
                }

                const radius = isPresentation ? 13 : size === "card" ? 11.5 : 11;

                return (
                  <g>
                    <circle
                      cx={point.cx}
                      cy={point.cy}
                      r={radius}
                      fill={getBucketColor(item.value)}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <text
                      x={point.cx}
                      y={(point.cy ?? 0) + 3.4}
                      textAnchor="middle"
                      fontSize={isPresentation ? 8.2 : size === "card" ? 7.8 : 7.4}
                      fontWeight={700}
                      fill="var(--app-foreground)"
                    >
                      {item.uf}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div data-dashboard-surface="legend-panel" className={legendClassName}>
        {legendBuckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: bucket.color }} />
            <span>{bucket.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
