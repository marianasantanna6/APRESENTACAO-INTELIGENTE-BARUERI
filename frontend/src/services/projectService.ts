/**
 * projectService — Gestão de Projetos Institucionais.
 *
 * Contrato do serviço; a implementação usa o backend (realProjectService.ts).
 */

import type {
  InstitutionalProject,
  NewProjectPayload,
  ProjectFilters,
  ProjectSummary,
  UpdateProjectPayload,
} from "../types/project";
import { realProjectService } from "./realProjectService";

export interface ProjectServiceContract {
  getProjects(filters?: ProjectFilters): Promise<ProjectSummary[]>;
  getProjectById(id: string): Promise<InstitutionalProject | null>;
  createProject(data: NewProjectPayload): Promise<InstitutionalProject>;
  updateProject(id: string, data: UpdateProjectPayload): Promise<InstitutionalProject>;
  deleteProject(id: string): Promise<void>;
  archiveProject(id: string): Promise<void>;
  approveProject(id: string): Promise<void>;
  rejectProject(id: string): Promise<void>;
  searchProjects(query: string): Promise<ProjectSummary[]>;
}

export const projectService: ProjectServiceContract = realProjectService;
