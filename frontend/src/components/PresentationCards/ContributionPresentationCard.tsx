import {
  PresentationCardShell,
} from "../DashboardWidgets";
import { getContributionShortLabel } from "../DashboardWidgets/chartShared";
import type { ContributionItem } from "../../types/presentation";
import type { PresentationCardComponentProps } from "./types";

function parseInsight(item: string) {
  const separatorIndex = item.indexOf(":");

  if (separatorIndex === -1) {
    return { label: "", description: item };
  }

  return {
    label: item.slice(0, separatorIndex),
    description: item.slice(separatorIndex + 1).trim(),
  };
}

function ContributionInfoGrid({
  items,
  variant,
}: {
  items: ContributionItem[];
  variant: "grid" | "stage";
}) {
  const isStage = variant === "stage";

  return (
    <div className={`grid h-full auto-rows-fr gap-2.5 sm:grid-cols-2`}>
      {items.map((item) => (
        <article
          key={item.label}
          data-presentation-surface="insight-card"
          className={`flex h-full flex-col rounded-[16px] ${
            isStage ? "px-3.5 py-3" : "px-3 py-2.5"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span
              className={`font-bold uppercase tracking-[0.04em] text-[#1e1e1e] ${
                isStage ? "text-[0.78rem]" : "text-[0.74rem]"
              }`}
            >
              {getContributionShortLabel(item.label)}
            </span>
          </div>
          <div className={`mt-1.5 font-extrabold text-[#0d5283] ${isStage ? "text-[1.28rem]" : "text-[1.18rem]"}`}>
            {item.value.toFixed(2)}%
          </div>
          <p
            className={`mt-1 overflow-hidden text-[#5b6474] ${
              isStage
                ? "text-[0.75rem] leading-[1.08rem] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
                : "text-[0.72rem] leading-[1.05rem] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
            }`}
          >
            {item.note}
          </p>
          <div className="mt-auto pt-2.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eff6]">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.value}%`, background: item.color }}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ContributionStrip({
  items,
  variant,
}: {
  items: ContributionItem[];
  variant: "grid" | "stage";
}) {
  const isStage = variant === "stage";

  return (
    <div
      className={`flex h-full w-full flex-col justify-center ${
        isStage ? "max-w-[520px] gap-4" : "max-w-[430px] gap-3"
      }`}
    >
      <div
        className={`overflow-hidden rounded-[999px] bg-[#e8eff6] shadow-[inset_0_0_0_1px_rgba(13,82,131,0.08),0_22px_50px_-32px_rgba(13,82,131,0.45)] ${
          isStage ? "h-[138px]" : "h-[112px]"
        }`}
      >
        <div className="flex h-full w-full">
          {items.map((item, index) => (
            <div
              key={item.label}
              className="relative h-full"
              style={{ width: `${item.value}%`, background: item.color }}
            >
              {index < items.length - 1 ? (
                <span className="absolute inset-y-0 right-0 w-px bg-white/35" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`flex flex-wrap justify-center text-[#5b6474] ${
          isStage ? "gap-x-3.5 gap-y-2 text-[0.76rem]" : "gap-x-3 gap-y-1.5 text-[0.72rem]"
        }`}
      >
        {items.map((item) => (
          <div key={item.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            <span>{getContributionShortLabel(item.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributionInsightSummary({ items }: { items: string[] }) {
  return (
    <div
      data-presentation-surface="insight-card"
      className="rounded-[18px] px-4 py-3.5"
    >
      <div className="grid gap-1.5">
        {items.map((item) => {
          const parsed = parseInsight(item);

          return (
            <p
              key={item}
              className="text-[0.75rem] leading-[1.08rem] text-[#1e1e1e]"
            >
              {parsed.label ? (
                <>
                  <strong>{parsed.label}:</strong> {parsed.description}
                </>
              ) : (
                parsed.description
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function ContributionPresentationCard({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  if (variant === "grid") {
    return (
      <PresentationCardShell card={card} variant={variant}>
        <div className="flex h-full min-h-[236px] w-full items-center justify-center px-1 sm:px-2">
          <ContributionStrip items={data.contribution} variant="grid" />
        </div>
        <ContributionInfoGrid items={data.contribution} variant="grid" />
      </PresentationCardShell>
    );
  }

  return (
    <PresentationCardShell card={card} variant={variant}>
      <div className="flex min-h-[300px] w-full items-center justify-center px-2 sm:px-4">
        <ContributionStrip items={data.contribution} variant="stage" />
      </div>

      <div className="flex h-full flex-col gap-3">
        <ContributionInfoGrid items={data.contribution} variant="stage" />
        <ContributionInsightSummary items={card.insights} />
      </div>
    </PresentationCardShell>
  );
}
