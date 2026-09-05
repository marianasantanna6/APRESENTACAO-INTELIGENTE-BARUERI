/**
 * Ponto de entrada único para todos os services da plataforma.
 *
 * Uso:
 *   import { projectService, permissionService } from "../services";
 *
 * Para trocar mock por implementação real, altere apenas o arquivo
 * do service correspondente — este index não precisa mudar.
 */

export { projectService } from "./projectService";
export { presentationService } from "./presentationService";
export { templateService } from "./templateService";
export { analyticsService } from "./analyticsService";
export { userService } from "./userService";
export { permissionService } from "./permissionService";
export { integrationService } from "./integrationService";
export { categoryService } from "./categoryService";

export type { ProjectServiceContract } from "./projectService";
export type { PresentationServiceContract } from "./presentationService";
export type { TemplateServiceContract, TemplateFilters } from "./templateService";
export type { AnalyticsServiceContract } from "./analyticsService";
export type { UserServiceContract, UserMutationResult } from "./userService";
export type { PermissionServiceContract } from "./permissionService";
export type { IntegrationServiceContract } from "./integrationService";
export type { CategoryServiceContract } from "./categoryService";
