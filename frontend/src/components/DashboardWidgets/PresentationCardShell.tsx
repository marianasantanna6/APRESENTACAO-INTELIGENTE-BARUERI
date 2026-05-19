import type { ReactNode } from "react";
import type { PresentationCard } from "../../types/presentation";
import type { PresentationCardVariant } from "../PresentationCards";

export function PresentationCardShell({
  card,
  children,
  variant = "grid",
}: {
  card: PresentationCard;
  children: ReactNode;
  variant?: PresentationCardVariant;
}) {
  const shellClassName =
    variant === "stage"
      ? "rounded-[20px] border border-black/5 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8"
      : "h-full overflow-hidden rounded-[14px] border border-black/5 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] flex flex-col gap-3.5 px-4 py-4 sm:px-5";
  const titleClassName =
    variant === "stage"
      ? "text-[1.75rem] font-bold leading-tight text-[#1e1e1e] text-center sm:text-[2.15rem]"
      : "text-[1rem] font-bold leading-5 text-[#1e1e1e] sm:text-[1.08rem]";
  const bodyClassName =
    variant === "stage"
      ? "grid flex-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center"
      : "grid flex-1 gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center";
  const sourceClassName =
    variant === "stage"
      ? "border-t border-[#e7edf3] pt-3 text-left text-[0.95rem] text-[#898989]"
      : "border-t border-[#e7edf3] pt-2.5 text-right text-[0.72rem] text-[#898989]";

  return (
    <article className={shellClassName}>
      <div className={variant === "stage" ? "min-h-[72px]" : "min-h-[44px]"}>
        <h3 className={titleClassName}>
          {card.title}
        </h3>
      </div>

      <div className={bodyClassName}>
        {children}
      </div>

      <p className={sourceClassName}>
        {card.source}
      </p>
    </article>
  );
}
