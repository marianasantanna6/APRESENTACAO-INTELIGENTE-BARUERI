/**
 * Módulo: Apresentações Institucionais
 *
 * Re-exporta tudo que pertence ao domínio de apresentações:
 * tipos, serviço e templates.
 * As páginas e componentes deste domínio serão adicionados
 * aqui à medida que forem criados.
 */

export type {
  AdminPresentationSummary,
  PresentationSummaryStatus,
} from "../../types/admin";

export type { PresentationFilters } from "../../types/presentation";

export { presentationService } from "../../services/presentationService";
export type { PresentationServiceContract } from "../../services/presentationService";

export type {
  NewPresentationPayload,
  UpdatePresentationPayload,
} from "../../types/institutionalPresentation";

export { templateService } from "../../services/templateService";
export type {
  TemplateServiceContract,
  TemplateFilters,
} from "../../services/templateService";

export type { PresentationTemplate, TemplateModule, TemplateModuleType } from "../../types/template";
