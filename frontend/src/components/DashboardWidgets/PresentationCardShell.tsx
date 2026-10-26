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
  const isStage = variant === "stage";
  const shellClassName =
    isStage
      ? "relative flex flex-col gap-6 overflow-hidden rounded-[28px] border px-6 py-6 sm:px-8 sm:py-8"
      : "relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[24px] border px-3.5 py-3.5 sm:px-4 sm:py-4";
  const headerClassName =
    isStage
      ? "relative z-[1] flex min-h-[72px] flex-col items-center text-center"
      : "relative z-[1] flex min-h-[36px] flex-col";
  const titleClassName =
    isStage
      ? "max-w-[22ch] text-[1.78rem] font-bold leading-tight text-[#1e1e1e] sm:text-[2.15rem]"
      : "max-w-[24ch] text-[1.08rem] font-bold leading-5 text-[#1e1e1e] sm:text-[1.18rem]";
  const bodyClassName =
    isStage
      ? "relative z-[1] grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-center"
      : "relative z-[1] grid flex-1 content-stretch gap-3 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-stretch";
  const sourceWrapperClassName =
    isStage
      ? "relative z-[1] mt-auto flex border-t border-[#dfe7ef] pt-4"
      : "relative z-[1] mt-auto flex border-t border-[#dfe7ef] pt-2";
  const sourceClassName =
    isStage
      ? "inline-flex items-center rounded-full px-4 py-2 text-[0.88rem] font-medium text-[#5b6474]"
      : "inline-flex items-center rounded-full px-3 py-0.5 text-[0.72rem] font-medium text-[#5b6474]";

  return (
    <article data-presentation-surface="shell" className={shellClassName}>
      <div className={headerClassName}>
        <h3 className={titleClassName}>
          {card.title}
        </h3>
      </div>

      <div className={bodyClassName}>
        {children}
      </div>

      <div className={sourceWrapperClassName}>
        <p data-presentation-surface="source-pill" className={sourceClassName}>
          {card.source}
        </p>
      </div>
    </article>
  );
}
