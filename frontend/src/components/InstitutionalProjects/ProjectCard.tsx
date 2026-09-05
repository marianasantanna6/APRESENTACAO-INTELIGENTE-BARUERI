import {
  FiArchive,
  FiCalendar,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi";
import type { ProjectSummary } from "../../types/project";
import { ProjectCategoryBadge } from "./ProjectCategoryBadge";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

type CardActions = {
  canEdit: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canAddToPresentation?: boolean;
};

type Props = {
  project: ProjectSummary;
  actions: CardActions;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onAddToPresentation?: (id: string) => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProjectCard({
  project,
  actions,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onApprove,
  onAddToPresentation,
}: Props) {
  const visibleCategories = project.categories.slice(0, 3);
  const extraCategories = project.categories.length - 3;

  return (
    <article className="group flex flex-col rounded-2xl border border-[#e8e9f0] bg-white shadow-[0_2px_12px_rgba(20,33,51,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(20,33,51,0.12)]">
      {/* ── Topo: status + departamento ── */}
      <div className="flex items-start justify-between gap-3 border-b border-[#f0f1f5] px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} size="sm" />
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[0.72rem] font-medium text-[#6b7280]">
              <FiMapPin className="h-2.5 w-2.5" />
              {project.mainDepartment}
            </span>
          </div>
        </div>
        {actions.canApprove && project.status === "draft" && (
          <button
            type="button"
            onClick={() => onApprove(project.id)}
            className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[0.72rem] font-bold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
          >
            Aprovar
          </button>
        )}
      </div>

      {/* ── Corpo principal ── */}
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div>
          <h3 className="text-[1rem] font-bold leading-snug text-[#1e1e1e] transition-colors group-hover:text-[#1d4ed8]">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[0.84rem] leading-relaxed text-[#6b7280]">
            {project.shortDescription}
          </p>
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap gap-1.5">
          {visibleCategories.map((cat) => (
            <ProjectCategoryBadge key={cat} category={cat} />
          ))}
          {extraCategories > 0 && (
            <span className="inline-block rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[0.72rem] font-medium text-[#6b7280]">
              +{extraCategories}
            </span>
          )}
        </div>

        {/* Área governamental */}
        <p className="text-[0.76rem] font-medium text-[#9ca3af]">
          Área: <span className="text-[#6b7280]">{project.governmentArea}</span>
        </p>
      </div>

      {/* ── Rodapé: data + ações ── */}
      <div className="flex items-center justify-between gap-2 border-t border-[#f0f1f5] px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-[0.72rem] text-[#9ca3af]">
          <FiCalendar className="h-3 w-3" />
          {formatDate(project.lastUpdatedAt)}
        </span>

        <div className="flex items-center gap-1">
          {/* Visualizar — sempre visível */}
          <ActionButton
            icon={<FiEye className="h-3.5 w-3.5" />}
            label="Visualizar"
            onClick={() => onView(project.id)}
            variant="default"
          />

          {/* Editar */}
          {actions.canEdit && (
            <ActionButton
              icon={<FiEdit2 className="h-3.5 w-3.5" />}
              label="Editar"
              onClick={() => onEdit(project.id)}
              variant="primary"
            />
          )}

          {/* Arquivar */}
          {actions.canArchive && project.status !== "archived" && (
            <ActionButton
              icon={<FiArchive className="h-3.5 w-3.5" />}
              label="Arquivar"
              onClick={() => onArchive(project.id)}
              variant="warning"
            />
          )}

          {/* Excluir */}
          {actions.canDelete && (
            <ActionButton
              icon={<FiTrash2 className="h-3.5 w-3.5" />}
              label="Excluir"
              onClick={() => onDelete(project.id)}
              variant="danger"
            />
          )}

          {/* Adicionar a apresentação */}
          {actions.canAddToPresentation && onAddToPresentation && (
            <ActionButton
              icon={<FiPlusCircle className="h-3.5 w-3.5" />}
              label="Adicionar a uma apresentação"
              onClick={() => onAddToPresentation(project.id)}
              variant="primary"
            />
          )}
        </div>
      </div>

      {/* Banner "Adicionar à apresentação" — aparece no hover quando permitido */}
      {actions.canAddToPresentation && onAddToPresentation && (
        <div className="overflow-hidden rounded-b-2xl border-t border-[#eff6ff] bg-[#f8fbff] px-5 py-2.5 opacity-0 transition-all group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onAddToPresentation(project.id)}
            className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-[#1675b8] transition hover:underline"
          >
            <FiPlusCircle className="h-3.5 w-3.5" />
            Adicionar a uma apresentação
          </button>
        </div>
      )}
    </article>
  );
}

// ── Botão de ação inline ──────────────────────────────────────────────────────

type ActionButtonVariant = "default" | "primary" | "warning" | "danger";

const VARIANT_CLASSES: Record<ActionButtonVariant, string> = {
  default: "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1e1e1e]",
  primary: "text-[#1d4ed8] hover:bg-[#eff6ff]",
  warning: "text-[#b45309] hover:bg-[#fffbeb]",
  danger:  "text-[#b91c1c] hover:bg-[#fef2f2]",
};

function ActionButton({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: ActionButtonVariant;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${VARIANT_CLASSES[variant]}`}
    >
      {icon}
    </button>
  );
}
