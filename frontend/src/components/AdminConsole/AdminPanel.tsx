import type { PropsWithChildren } from "react";

type AdminPanelProps = PropsWithChildren<{
  className?: string;
}>;

export default function AdminPanel({
  children,
  className = "",
}: AdminPanelProps) {
  return (
    <section
      data-surface="panel"
      className={`rounded-[22px] border border-white/70 bg-white/88 p-6 shadow-[0_18px_40px_rgba(120,130,170,0.16)] backdrop-blur-[4px] ${className}`}
    >
      {children}
    </section>
  );
}
