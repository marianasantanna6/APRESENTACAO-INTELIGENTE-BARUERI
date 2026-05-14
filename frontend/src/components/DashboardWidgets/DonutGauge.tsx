import { Cell, Pie, PieChart } from "recharts";

export function DonutGauge({
  value,
  label,
  size = "dashboard",
  showCaption = size === "dashboard",
}: {
  value: number;
  label: string;
  size?: "dashboard" | "card" | "presentation";
  showCaption?: boolean;
}) {
  const progressData = [
    { name: "IDH", value: Number((value * 100).toFixed(2)), color: "#1675b8" },
    {
      name: "Restante",
      value: Number(((1 - value) * 100).toFixed(2)),
      color: "rgba(190,198,208,0.22)",
    },
  ];
  const dimension = size === "presentation" ? 220 : size === "card" ? 124 : 132;
  const inset = size === "presentation" ? 32 : size === "card" ? 16 : 18;
  const innerRadius = size === "presentation" ? 72 : size === "card" ? 38 : 42;
  const outerRadius = size === "presentation" ? 102 : size === "card" ? 58 : 62;
  const labelClassName =
    size === "presentation"
      ? "text-[3rem] font-extrabold"
      : size === "card"
        ? "text-[1.55rem] font-extrabold"
        : "text-[1.75rem] font-extrabold";

  return (
    <div
      className={`flex ${
        showCaption
          ? "flex-col items-center gap-1 text-center"
          : "items-center justify-center"
      }`}
    >
      <div
        className="relative shrink-0 rounded-full"
        style={{ width: dimension, height: dimension }}
      >
        <PieChart width={dimension} height={dimension}>
          <Pie
            data={progressData}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            stroke="none"
            paddingAngle={0}
          >
            {progressData.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
        </PieChart>

        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full bg-white text-[#0d5283] shadow-[inset_0_0_0_1px_rgba(13,82,131,0.08)]"
          style={{ inset }}
        >
          <span className={labelClassName}>
            {label}
          </span>
        </div>
      </div>

      {showCaption ? (
        <div className="space-y-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#0d5283]">
            Consolidado
          </p>
          <p className={`mx-auto text-[#706e6e] ${size === "presentation" ? "max-w-[240px] text-[0.96rem] leading-6" : "max-w-[160px] text-[0.78rem] leading-3.5"}`}>
            Desenvolvimento humano em patamar alto no cenario nacional.
          </p>
        </div>
      ) : null}
    </div>
  );
}
