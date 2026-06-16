import type { PresentationCardVariant } from "../PresentationCards";

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

export function InsightList({
  items,
  variant = "grid",
}: {
  items: string[];
  variant?: PresentationCardVariant;
}) {
  if (variant === "stage") {
    return (
      <div data-presentation-surface="insight-list" className="grid content-start gap-4">
        {items.map((item, index) => {
          const parsed = parseInsight(item);

          return (
            <div
              key={item}
              data-presentation-surface="insight-card"
              className="rounded-[22px] px-5 py-4 text-[1.02rem] leading-7 text-[#1e1e1e] sm:px-6 sm:py-5 sm:text-[1.12rem] sm:leading-8"
            >
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e9f4fb] text-[0.82rem] font-bold text-[#0d5283]">
                {index + 1}
              </span>
              {parsed.label ? (
                <p>
                  <strong>{parsed.label}:</strong> {parsed.description}
                </p>
              ) : (
                <p>{parsed.description}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div data-presentation-surface="insight-list" className="grid h-full auto-rows-fr gap-2">
      {items.map((item, index) => {
        const parsed = parseInsight(item);

        return (
          <div
            key={item}
            data-presentation-surface="insight-card"
            className="flex h-full rounded-[16px] px-3 py-2.5 text-[0.82rem] leading-[1.4rem] text-[#1e1e1e]"
          >
            <div className="flex h-full items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9f4fb] text-[0.72rem] font-bold text-[#0d5283]">
                {index + 1}
              </span>
              <div className="flex-1">
                {parsed.label ? (
                  <p>
                    <strong>{parsed.label}:</strong> {parsed.description}
                  </p>
                ) : (
                  <p>{parsed.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
