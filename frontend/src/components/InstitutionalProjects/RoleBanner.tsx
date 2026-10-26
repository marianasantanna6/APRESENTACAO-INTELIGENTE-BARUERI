import { FiShield } from "react-icons/fi";
import { ROLE_LABELS } from "../../types/user";
import type { UserRole } from "../../types/user";

const ROLE_COLOR: Record<UserRole, { bg: string; border: string; text: string; icon: string }> = {
  "administrador-geral":  { bg: "bg-[#fdf4ff]", border: "border-[#d8b4fe]", text: "text-[#6b21a8]", icon: "text-[#7c3aed]" },
  "gestor-institucional": { bg: "bg-[#eff6ff]", border: "border-[#bfdbfe]", text: "text-[#1e40af]", icon: "text-[#2563eb]" },
  "gestor-secretaria":    { bg: "bg-[#ecfdf5]", border: "border-[#a7f3d0]", text: "text-[#065f46]", icon: "text-[#059669]" },
  "editor":               { bg: "bg-[#fffbeb]", border: "border-[#fde68a]", text: "text-[#92400e]", icon: "text-[#d97706]" },
  "revisor":              { bg: "bg-[#fff7ed]", border: "border-[#fed7aa]", text: "text-[#9a3412]", icon: "text-[#ea580c]" },
  "apresentador":         { bg: "bg-[#f0fdf4]", border: "border-[#bbf7d0]", text: "text-[#14532d]", icon: "text-[#16a34a]" },
  "publico-externo":      { bg: "bg-[#f9fafb]", border: "border-[#e5e7eb]", text: "text-[#374151]", icon: "text-[#6b7280]" },
};

const ROLE_CAPABILITIES: Record<UserRole, string> = {
  "administrador-geral":  "Acesso total — pode criar, editar, arquivar, excluir e aprovar todos os projetos.",
  "gestor-institucional": "Visualiza todos os projetos e pode aprovar conteúdos estratégicos.",
  "gestor-secretaria":    "Gerencia projetos da própria secretaria. Pode aprovar conteúdos da sua área.",
  "editor":               "Cria e edita projetos. Não publica nem aprova.",
  "revisor":              "Revisa conteúdos e solicita correções. Não edita livremente.",
  "apresentador":         "Consulta projetos aprovados para montar apresentações.",
  "publico-externo":      "Sem acesso a esta área.",
};

type Props = { role: UserRole; userName: string; department: string };

export function RoleBanner({ role, userName, department }: Props) {
  const color = ROLE_COLOR[role];

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border ${color.border} ${color.bg} px-4 py-3`}
    >
      <FiShield className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${color.icon}`} />
      <div className="min-w-0">
        <p className={`text-[0.84rem] font-bold ${color.text}`}>
          {userName} — {ROLE_LABELS[role]}
          <span className="ml-2 font-medium opacity-70">· {department}</span>
        </p>
        <p className={`mt-0.5 text-[0.78rem] ${color.text} opacity-80`}>
          {ROLE_CAPABILITIES[role]}
        </p>
      </div>
    </div>
  );
}
