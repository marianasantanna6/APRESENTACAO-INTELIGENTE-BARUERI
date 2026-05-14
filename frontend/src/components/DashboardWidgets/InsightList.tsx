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
      <div className="grid content-start gap-4">
        {items.map((item) => {
          const parsed = parseInsight(item);

          return (
            <div key={item} className="text-[1.18rem] leading-8 text-[#1e1e1e] sm:text-[1.45rem] sm:leading-10">
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
    <div className="grid content-start gap-2">
      {items.map((item) => {
        const parsed = parseInsight(item);

        return (
          <div
            key={item}
            className="rounded-[12px] bg-[#f8fafc] px-3.5 py-2.5 text-[0.78rem] leading-5 text-[#1e1e1e] shadow-[inset_0_0_0_1px_rgba(13,82,131,0.04)]"
          >
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
