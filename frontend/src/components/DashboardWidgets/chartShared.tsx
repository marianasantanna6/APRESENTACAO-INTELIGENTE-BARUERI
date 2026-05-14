type TooltipRow = {
  name: string;
  value: string;
  color?: string;
};

export type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    color?: string;
    name?: string;
    payload?: unknown;
    value?: number | string;
  }>;
};

export type ScatterPointShapeProps<TPayload> = {
  cx?: number;
  cy?: number;
  payload?: TPayload;
};

export const regionAbbreviation = {
  Norte: "N",
  Nordeste: "NE",
  "Centro-Oeste": "CO",
  Sudeste: "SE",
  Sul: "S",
} as const;

export const legendBuckets = [
  { label: "Muito alto (0,80+)", color: "#22c55e" },
  { label: "Alto (0,78-0,79)", color: "#84cc16" },
  { label: "Medio (0,75-0,77)", color: "#facc15" },
  { label: "Medio-baixo (0,72-0,74)", color: "#fb923c" },
  { label: "Baixo (ate 0,71)", color: "#f97316" },
];

export function formatIdh(value: number) {
  return value.toFixed(3);
}

export function getBucketColor(value: number) {
  if (value >= 0.8) return "#22c55e";
  if (value >= 0.78) return "#84cc16";
  if (value >= 0.75) return "#facc15";
  if (value >= 0.72) return "#fb923c";
  return "#f97316";
}

export function getContributionShortLabel(label: string) {
  if (label === "Renda do Trabalho") return "Renda Trab.";
  if (label === "Renda Complementar") return "Renda Comp.";
  return label;
}

export function getRegionLabel(
  region: string,
  size: "dashboard" | "card" | "presentation",
) {
  if (size === "card") {
    return regionAbbreviation[region as keyof typeof regionAbbreviation] ?? region;
  }

  return region;
}

export function getContributionBarRadius(
  index: number,
  total: number,
): [number, number, number, number] {
  if (total === 1) return [999, 999, 999, 999];
  if (index === 0) return [999, 0, 0, 999];
  if (index === total - 1) return [0, 999, 999, 0];
  return [0, 0, 0, 0];
}

export function truncateLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function ChartTooltipBox({
  label,
  rows,
}: {
  label?: string | number;
  rows: TooltipRow[];
}) {
  return (
    <div className="min-w-[148px] rounded-[14px] border border-[#dbe7f4] bg-white px-3 py-2 text-[0.74rem] shadow-[0_12px_32px_-18px_rgba(15,23,42,0.3)]">
      {label ? (
        <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#0d5283]">
          {label}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={`${row.name}-${row.value}`}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-[#1e1e1e]">
              {row.color ? (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: row.color }}
                />
              ) : null}
              <span className="font-semibold">{row.name}</span>
            </div>
            <span className="font-bold text-[#0d5283]">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
