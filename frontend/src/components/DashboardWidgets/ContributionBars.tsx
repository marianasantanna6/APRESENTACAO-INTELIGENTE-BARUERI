import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ContributionItem } from "../../types/presentation";
import { ChartTooltipBox, type ChartTooltipProps, getContributionBarRadius, getContributionShortLabel } from "./chartShared";
import { LegendDot } from "./LegendDot";

export function ContributionBars({
  data,
  size = "dashboard",
  showNotes = true,
}: {
  data: ContributionItem[];
  size?: "dashboard" | "card" | "presentation";
  showNotes?: boolean;
}) {
  const isPresentation = size === "presentation";
  const chartData = [
    data.reduce<Record<string, number | string>>(
      (accumulator, item, index) => {
        accumulator[`segment-${index}`] = item.value;
        return accumulator;
      },
      { name: "Composicao" },
    ),
  ];

  return (
    <div className={size === "card" ? "mx-auto w-full max-w-[292px] space-y-4" : isPresentation ? "space-y-5" : "space-y-4"}>
      <div className={isPresentation ? "h-[108px] w-full" : "h-[92px] w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              cursor={false}
              content={(tooltipProps) => {
                const tooltip = tooltipProps as unknown as ChartTooltipProps;

                if (!tooltip.active || !tooltip.payload?.length) {
                  return null;
                }

                const segment = tooltip.payload.find((item) => typeof item.value === "number");

                if (!segment?.name || typeof segment.value !== "number") {
                  return null;
                }

                return (
                  <ChartTooltipBox
                    rows={[
                      {
                        name: String(segment.name),
                        value: `${segment.value.toFixed(2)}%`,
                        color: segment.color,
                      },
                    ]}
                  />
                );
              }}
            />

            {data.map((item, index) => (
              <Bar
                key={item.label}
                dataKey={`segment-${index}`}
                name={item.label}
                stackId="composition"
                fill={item.color}
                radius={getContributionBarRadius(index, data.length)}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!showNotes ? (
        <div className="flex flex-wrap justify-center gap-2.5 text-[0.7rem] text-[#706e6e]">
          {data.map((item) => (
            <LegendDot key={item.label} color={item.color} label={getContributionShortLabel(item.label)} />
          ))}
        </div>
      ) : null}

      <div
        className={
          size === "card"
            ? "grid gap-3 sm:grid-cols-2"
            : isPresentation
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            : "grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        {data.map((item) => (
          <div
            key={item.label}
            className={`rounded-[14px] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] shadow-[0_4px_12px_rgba(18,94,148,0.08)] ${
              isPresentation ? "px-4 py-4" : "px-3.5 py-3"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              <span className={`font-bold uppercase tracking-[0.04em] text-[#1e1e1e] ${isPresentation ? "text-[0.82rem]" : "text-[0.74rem]"}`}>
                {getContributionShortLabel(item.label)}
              </span>
            </div>
            <div className={`mt-1.5 font-extrabold text-[#0d5283] ${isPresentation ? "text-[1.3rem]" : "text-[1.08rem]"}`}>
              {item.value.toFixed(2)}%
            </div>
            {showNotes ? (
              <p className={`mt-1 text-[#706e6e] ${isPresentation ? "text-[0.82rem] leading-5" : "text-[0.73rem] leading-4"}`}>{item.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
