import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RegionPillar } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, getRegionLabel } from "./chartShared";

export function GroupedBars({
  data,
  size = "dashboard",
}: {
  data: RegionPillar[];
  size?: "dashboard" | "card" | "presentation";
}) {
  const maxValue = Math.min(
    1,
    Math.max(...data.flatMap((item) => [item.longevity, item.income, item.education])) + 0.05,
  );
  const isPresentation = size === "presentation";

  return (
    <div className={size === "card" ? "h-[262px] w-full" : isPresentation ? "h-[304px] w-full" : "h-[248px] w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: isPresentation ? 16 : size === "card" ? 14 : 10,
            right: 8,
            left: size === "card" ? -8 : 0,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} stroke="rgba(112,110,110,0.12)" />
          <Legend
          verticalAlign="top"
          align={size === "card" ? "center" : "left"}
          iconType="circle"
          wrapperStyle={{
            paddingBottom: isPresentation ? 18 : size === "card" ? 12 : 12,
            fontSize: isPresentation ? "13px" : size === "card" ? "12px" : "12px",
            color: "#706e6e",
          }}
            formatter={(value) => {
              const legendLabel = {
                longevity: "Longevidade",
                income: "Renda",
                education: "Educacao",
              }[String(value) as "longevity" | "income" | "education"];

              return legendLabel ?? String(value);
            }}
          />
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
            domain={[0, maxValue]}
            axisLine={false}
            tickLine={false}
            width={isPresentation ? 38 : 32}
            tickFormatter={(chartValue) => Number(chartValue).toFixed(1)}
            tick={{ fontSize: isPresentation ? 11 : 10, fill: "#706e6e" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(22,117,184,0.05)" }}
            content={(tooltipProps) => {
              const tooltip = tooltipProps as unknown as ChartTooltipProps;

              if (!tooltip.active || !tooltip.payload?.length) {
                return null;
              }

              const item = tooltip.payload[0]?.payload as RegionPillar | undefined;

              if (!item) {
                return null;
              }

              return (
                <ChartTooltipBox
                  label={item.region}
                  rows={[
                    { name: "Longevidade", value: item.longevity.toFixed(2), color: "#f59e0b" },
                    { name: "Renda", value: item.income.toFixed(2), color: "#8b5cf6" },
                    { name: "Educacao", value: item.education.toFixed(2), color: "#60a5fa" },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="longevity" name="longevity" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          <Bar dataKey="income" name="income" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          <Bar dataKey="education" name="education" fill="#60a5fa" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
