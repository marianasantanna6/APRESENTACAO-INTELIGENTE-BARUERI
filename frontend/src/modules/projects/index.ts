/**
 * Módulo: Projetos Institucionais
 *
 * Re-exporta tudo que pertence ao domínio de projetos:
 * tipos, serviço, mock e constantes relacionadas.
 * As páginas e componentes deste domínio serão adicionados
 * aqui à medida que forem criados.
 */

export type {
  InstitutionalProject,
  ProjectSummary,
  ProjectFilters,
  ProjectStatus,
  ProjectCategory,
  GovernmentArea,
  OdsGoal,
  ProjectIndicator,
  ProjectImage,
  ProjectVideo,
  ProjectOfficialLink,
  ProjectAward,
  ProjectVersionRef,
  NewProjectPayload,
  UpdateProjectPayload,
} from "../../types/project";

export { projectService } from "../../services/projectService";
export type { ProjectServiceContract } from "../../services/projectService";

export { PROJECT_CATEGORIES, PRIMARY_CATEGORIES } from "../../constants/categories";
