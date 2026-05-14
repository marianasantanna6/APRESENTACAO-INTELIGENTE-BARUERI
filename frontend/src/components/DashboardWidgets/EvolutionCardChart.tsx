import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoricalPoint } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, formatIdh } from "./chartShared";

export function EvolutionCardChart({
  points,
  size = "card",
}: {
  points: HistoricalPoint[];
  size?: "dashboard" | "card" | "presentation";
}) {
  const gradientId = `idh-area-${size}`;
  const isPresentation = size === "presentation";
  const heightClassName = isPresentation
    ? "h-[264px] w-full"
    : size === "dashboard"
      ? "h-[164px] w-full"
      : "h-[176px] w-full";
  const wrapperClassName = isPresentation
    ? "mx-auto w-full max-w-[440px]"
    : "mx-auto w-full max-w-[294px]";

  return (
    <div className={wrapperClassName}>
      <div className={heightClassName}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{
              top: isPresentation ? 24 : size === "dashboard" ? 16 : 18,
              right: 12,
              left: 2,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(22,117,184,0.24)" />
                <stop offset="100%" stopColor="rgba(22,117,184,0.03)" />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="rgba(112,110,110,0.14)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: isPresentation ? 12 : 9,
                fontWeight: 700,
                fill: "#706e6e",
              }}
            />
            <YAxis
              domain={[0.4, 0.75]}
              ticks={[0.4, 0.5, 0.6, 0.7, 0.75]}
              tickFormatter={(chartValue) => Number(chartValue).toFixed(2)}
              axisLine={false}
              tickLine={false}
              width={isPresentation ? 44 : 38}
              tick={{ fontSize: isPresentation ? 11 : 9, fill: "#706e6e" }}
            />
            <Tooltip
              cursor={{ stroke: "rgba(22,117,184,0.18)", strokeWidth: 1 }}
              content={(tooltipProps) => {
                const tooltip = tooltipProps as unknown as ChartTooltipProps;

                if (!tooltip.active || !tooltip.payload?.length) {
                  return null;
                }

                const point = tooltip.payload[0]?.payload as
                  | HistoricalPoint
                  | undefined;

                if (!point) {
                  return null;
                }

                return (
                  <ChartTooltipBox
                    label={point.year}
                    rows={[
                      { name: "IDH", value: formatIdh(point.value), color: "#1675b8" },
                    ]}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1675b8"
              strokeWidth={isPresentation ? 5 : 4}
              fill={`url(#${gradientId})`}
              dot={{
                r: isPresentation ? 5.4 : 4.6,
                fill: "#1675b8",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: isPresentation ? 6.8 : 6,
                fill: "#1675b8",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={(chartValue: number | string) =>
                  formatIdh(Number(chartValue))
                }
                style={{
                  fontSize: isPresentation ? 12 : 9,
                  fontWeight: 700,
                  fill: "#0d5283",
                }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
