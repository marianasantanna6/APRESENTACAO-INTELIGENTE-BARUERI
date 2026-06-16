import type { ReactNode } from "react";
import type { KeyboardEvent } from "react";

const dashboardPanelClass =
  "rounded-[12px] border border-black/5 bg-[#f8fafc] shadow-[0_3px_10px_rgba(0,0,0,0.08)]";

export function DashboardMetric({
  title,
  children,
  titleClassName = "",
  contentClassName = "",
  onClick,
  ariaLabel,
}: {
  title: string;
  children: ReactNode;
  titleClassName?: string;
  contentClassName?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const isInteractive = Boolean(onClick);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onClick();
  }

  return (
    <div
      data-dashboard-surface="metric"
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? (ariaLabel ?? `Abrir slide de ${title}`) : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${dashboardPanelClass} h-full px-2.5 py-2.5 ${
        isInteractive
          ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-24px_rgba(13,82,131,0.42)] focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
          : ""
      }`}
    >
      <h3
        className={`text-[0.92rem] font-bold uppercase tracking-[0.08em] text-[#1e1e1e] ${titleClassName}`}
      >
        {title}
      </h3>
      <div className={`mt-1.5 ${contentClassName}`}>{children}</div>
    </div>
  );
}
