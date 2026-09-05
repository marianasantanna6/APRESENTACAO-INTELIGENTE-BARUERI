import type { ProjectStatus } from "../../types/project";

type Props = { status: ProjectStatus; size?: "sm" | "md" };

const CONFIG: Record<ProjectStatus, { label: string; dot: string; text: string; bg: string }> = {
  active:   { label: "Ativo",      dot: "bg-[#22c55e]", text: "text-[#166534]", bg: "bg-[#f0fdf4]" },
  draft:    { label: "Rascunho",   dot: "bg-[#f59e0b]", text: "text-[#92400e]", bg: "bg-[#fffbeb]" },
  archived: { label: "Arquivado",  dot: "bg-[#94a3b8]", text: "text-[#475569]", bg: "bg-[#f1f5f9]" },
};

export function ProjectStatusBadge({ status, size = "md" }: Props) {
  const cfg = CONFIG[status];
  const padding = size === "sm" ? "px-2 py-0.5 text-[0.72rem]" : "px-2.5 py-1 text-[0.78rem]";
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding} ${cfg.bg} ${cfg.text}`}>
      <span className={`rounded-full ${dot} ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
