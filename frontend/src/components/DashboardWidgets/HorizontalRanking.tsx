import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankingItem } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, formatIdh, truncateLabel } from "./chartShared";

export function HorizontalRanking({
  data,
  size = "dashboard",
}: {
  data: RankingItem[];
  size?: "dashboard" | "card" | "presentation";
}) {
  const items = size === "card" ? data.slice(0, 6) : data;
  const minValue = Math.max(0, Math.min(...items.map((item) => item.value)) - 0.02);
  const maxValue = Math.max(...items.map((item) => item.value)) + 0.025;
  const isPresentation = size === "presentation";
  const chartHeight = items.length * (size === "card" ? 30 : isPresentation ? 34 : 28) + 24;

  return (
    <div style={{ height: chartHeight, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={items}
          margin={{
            top: 4,
            right: 34,
            left: size === "card" ? 0 : 10,
            bottom: 0,
          }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(112,110,110,0.1)" />
          <XAxis type="number" hide domain={[minValue, maxValue]} />
          <YAxis
            type="category"
            dataKey="label"
            width={size === "card" ? 102 : isPresentation ? 182 : 164}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: size === "card" ? 11 : isPresentation ? 13 : 12,
              fontWeight: 600,
              fill: "#1e1e1e",
            }}
            tickFormatter={(chartLabel) =>
              size === "card" ? truncateLabel(String(chartLabel), 14) : String(chartLabel)
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(22,117,184,0.05)" }}
            content={(tooltipProps) => {
              const tooltip = tooltipProps as unknown as ChartTooltipProps;

              if (!tooltip.active || !tooltip.payload?.length) {
                return null;
              }

              const item = tooltip.payload[0]?.payload as RankingItem | undefined;

              if (!item) {
                return null;
              }

              return (
                <ChartTooltipBox
                  label={item.label}
                  rows={[{ name: "IDH", value: formatIdh(item.value), color: "#1675b8" }]}
                />
              );
            }}
          />
          <Bar dataKey="value" fill="#1675b8" radius={[0, 999, 999, 0]} maxBarSize={20}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(chartValue: number | string) => formatIdh(Number(chartValue))}
              style={{
                fontSize: size === "card" ? 10 : isPresentation ? 12 : 11,
                fontWeight: 700,
                fill: "#0d5283",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
