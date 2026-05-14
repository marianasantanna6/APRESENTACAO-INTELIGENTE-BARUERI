import type { ReactNode } from "react";

const dashboardPanelClass =
  "rounded-[12px] border border-black/5 bg-[#f8fafc] shadow-[0_3px_10px_rgba(0,0,0,0.08)]";

export function DashboardMetric({
  title,
  children,
  titleClassName = "",
  contentClassName = "",
}: {
  title: string;
  children: ReactNode;
  titleClassName?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`${dashboardPanelClass} h-full px-2.5 py-2.5`}>
      <h3
        className={`text-[0.92rem] font-bold uppercase tracking-[0.08em] text-[#1e1e1e] ${titleClassName}`}
      >
        {title}
      </h3>
      <div className={`mt-1.5 ${contentClassName}`}>{children}</div>
    </div>
  );
}
