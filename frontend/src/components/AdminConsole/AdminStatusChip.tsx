import type {
  ApiIntegrationStatus,
  PresentationSummaryStatus,
} from "../../types/admin";
import type { AccountStatus } from "../../types/auth";

type AdminStatusTone =
  | AccountStatus
  | ApiIntegrationStatus
  | PresentationSummaryStatus;

type AdminStatusChipProps = {
  label: string;
  tone: AdminStatusTone;
};

const toneMap: Record<
  AdminStatusTone,
  { dot: string; text: string; background: string }
> = {
  active: {
    dot: "bg-[#1fdf4d]",
    text: "text-[#3f5c46]",
    background: "bg-[#f5fff5]",
  },
  inactive: {
    dot: "bg-[#949494]",
    text: "text-[#666666]",
    background: "bg-[#f6f6f6]",
  },
  maintenance: {
    dot: "bg-[#ffb020]",
    text: "text-[#8a6110]",
    background: "bg-[#fff9ef]",
  },
  presented: {
    dot: "bg-[#1fdf4d]",
    text: "text-[#6d6d6d]",
    background: "bg-transparent",
  },
  ready: {
    dot: "bg-[#1675b8]",
    text: "text-[#6d6d6d]",
    background: "bg-transparent",
  },
};

export default function AdminStatusChip({
  label,
  tone,
}: AdminStatusChipProps) {
  const palette = toneMap[tone];

  return (
    <span
      data-status-chip
      data-status-tone={tone}
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[0.82rem] font-medium ${palette.text} ${palette.background}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
      {label}
    </span>
  );
}
