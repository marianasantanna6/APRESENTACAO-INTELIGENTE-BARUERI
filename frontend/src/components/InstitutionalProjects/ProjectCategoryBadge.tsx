import type { ProjectCategory } from "../../types/project";

type Props = { category: ProjectCategory };

const COLOR_MAP: Partial<Record<ProjectCategory, { text: string; bg: string }>> = {
  "Saúde":                { text: "text-[#0e7490]", bg: "bg-[#ecfeff]" },
  "Educação":             { text: "text-[#7c3aed]", bg: "bg-[#f5f3ff]" },
  "Inovação":             { text: "text-[#d97706]", bg: "bg-[#fffbeb]" },
  "Transformação Digital":{ text: "text-[#0369a1]", bg: "bg-[#eff6ff]" },
  "Cidades Inteligentes": { text: "text-[#059669]", bg: "bg-[#ecfdf5]" },
  "Governo Digital":      { text: "text-[#4338ca]", bg: "bg-[#eef2ff]" },
  "Inteligência Artificial":{ text: "text-[#be185d]", bg: "bg-[#fdf2f8]" },
  "Mobilidade":           { text: "text-[#b45309]", bg: "bg-[#fef3c7]" },
  "Meio Ambiente":        { text: "text-[#15803d]", bg: "bg-[#f0fdf4]" },
  "Segurança":            { text: "text-[#991b1b]", bg: "bg-[#fef2f2]" },
  "Infraestrutura":       { text: "text-[#374151]", bg: "bg-[#f3f4f6]" },
  "Social":               { text: "text-[#9d174d]", bg: "bg-[#fdf2f8]" },
};

export function ProjectCategoryBadge({ category }: Props) {
  const color = COLOR_MAP[category] ?? { text: "text-[#374151]", bg: "bg-[#f3f4f6]" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${color.bg} ${color.text}`}>
      {category}
    </span>
  );
}
