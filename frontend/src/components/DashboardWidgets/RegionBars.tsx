import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RegionMetric } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, getRegionLabel } from "./chartShared";

export function RegionBars({
  data,
  size = "dashboard",
}: {
  data: RegionMetric[];
  size?: "dashboard" | "card" | "presentation";
}) {
  const minValue = Math.max(
    0,
    Math.floor(Math.min(...data.map((item) => item.value)) - 1),
  );
  const maxValue = Math.ceil(Math.max(...data.map((item) => item.value)) + 1);
  const isPresentation = size === "presentation";

  return (
    <div className={size === "card" ? "h-[208px] w-full" : isPresentation ? "h-[260px] w-full" : "h-[188px] w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 16,
            right: 8,
            left: size === "card" ? -12 : -4,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} stroke="rgba(112,110,110,0.12)" />
          <XAxis
            dataKey="region"
            interval={0}
            tickFormatter={(region) => getRegionLabel(String(region), size)}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: size === "card" ? 12 : isPresentation ? 13 : 12,
              fontWeight: 600,
              fill: "#706e6e",
            }}
          />
          <YAxis
            hide={size === "card"}
            domain={[minValue, maxValue]}
            axisLine={false}
            tickLine={false}
            width={isPresentation ? 40 : 34}
            tick={{ fontSize: isPresentation ? 11 : 10, fill: "#706e6e" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(22,117,184,0.05)" }}
            content={(tooltipProps) => {
              const tooltip = tooltipProps as unknown as ChartTooltipProps;

              if (!tooltip.active || !tooltip.payload?.length) {
                return null;
              }

              const item = tooltip.payload[0]?.payload as RegionMetric | undefined;

              if (!item) {
                return null;
              }

              return (
                <ChartTooltipBox
                  label={item.region}
                  rows={[
                    {
                      name: "Longevidade",
                      value: `${item.value.toFixed(1)} anos`,
                      color: item.color,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 0, 0]}
            maxBarSize={size === "card" ? 32 : isPresentation ? 40 : 34}
          >
            {data.map((item) => (
              <Cell key={item.region} fill={item.color} />
            ))}
            {size !== "card" ? (
              <LabelList
                dataKey="value"
                position="top"
                formatter={(chartValue: number | string) =>
                  `${Number(chartValue).toFixed(1)}`
                }
                style={{
                  fontSize: isPresentation ? 11 : 10,
                  fontWeight: 700,
                  fill: "#0d5283",
                }}
              />
            ) : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
