import type { ReactNode } from "react";
import type { PresentationCardVariant } from "../PresentationCards";

export function PresentationPreview({
  children,
  className = "",
  variant = "grid",
}: {
  children: ReactNode;
  className?: string;
  variant?: PresentationCardVariant;
}) {
  const frameClassName =
    variant === "stage"
      ? "w-full self-start"
      : "w-full self-stretch";
  const previewPanelClassName =
    variant === "stage"
      ? "flex min-h-[300px] w-full items-center justify-center rounded-[24px] px-4 py-4 sm:min-h-[340px] sm:px-6 sm:py-6"
      : "flex h-full min-h-[184px] w-full items-center justify-center rounded-[20px] px-2.5 py-2.5 sm:px-3 sm:py-3";

  return (
    <div className={`flex ${frameClassName}`}>
      <div
        data-presentation-surface="preview-panel"
        className={`${previewPanelClassName} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
