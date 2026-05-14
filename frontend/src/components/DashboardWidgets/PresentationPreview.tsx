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
  const baseClassName =
    variant === "stage"
      ? "min-h-[280px] w-full items-center justify-center self-start px-2 py-2 sm:min-h-[320px]"
      : "min-h-[152px] w-full items-center justify-center self-start p-0";

  return (
    <div
      className={`flex ${baseClassName} ${className}`}
    >
      {children}
    </div>
  );
}
