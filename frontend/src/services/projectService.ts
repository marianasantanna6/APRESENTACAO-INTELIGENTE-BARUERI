/**
 * projectService — Gestão de Projetos Institucionais
 *
 * Implementação mock com store em memória.
 * Para conectar ao backend real: crie realProjectService.ts
 * implementando ProjectServiceContract e troque o export em index.ts.
 */

import { institutionalProjectsMock } from "../mocks/institutionalProjectsMock";
import type {
  InstitutionalProject,
  NewProjectPayload,
  ProjectFilters,
  ProjectSummary,
  UpdateProjectPayload,
} from "../types/project";

// ─── Contrato ────────────────────────────────────────────────────────────────

export interface ProjectServiceContract {
  getProjects(filters?: ProjectFilters): Promise<ProjectSummary[]>;
  getProjectById(id: string): Promise<InstitutionalProject | null>;
  createProject(data: NewProjectPayload): Promise<InstitutionalProject>;
  updateProject(id: string, data: UpdateProjectPayload): Promise<InstitutionalProject>;
  deleteProject(id: string): Promise<void>;
  archiveProject(id: string): Promise<void>;
  searchProjects(query: string): Promise<ProjectSummary[]>;
}

// ─── Implementação mock ──────────────────────────────────────────────────────

let store: InstitutionalProject[] = [...institutionalProjectsMock];

function toSummary(project: InstitutionalProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    shortDescription: project.shortDescription,
    status: project.status,
    categories: project.categories,
    governmentArea: project.governmentArea,
    mainDepartment: project.mainDepartment,
    lastUpdatedAt: project.lastUpdatedAt,
  };
}

const mockProjectService: ProjectServiceContract = {
  async getProjects(filters = {}) {
    await delay(300);
    return store
      .filter((p) => {
        if (filters.status && p.status !== filters.status) return false;
        if (filters.department && p.mainDepartment !== filters.department) return false;
        if (filters.governmentArea && p.governmentArea !== filters.governmentArea) return false;
        if (filters.category && !p.categories.includes(filters.category as never)) return false;
        if (filters.query) {
          const q = filters.query.toLowerCase();
          const match =
            p.name.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            p.keywords.some((k) => k.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .map(toSummary);
  },

  async getProjectById(id) {
    await delay(200);
    return store.find((p) => p.id === id) ?? null;
  },

  async createProject(data) {
    await delay(400);
    const now = new Date().toISOString();
    const project: InstitutionalProject = {
      ...data,
      id: `project-${Date.now()}`,
      createdAt: now,
      lastUpdatedAt: now,
      versionHistory: [
        { version: 1, changedAt: now, changedBy: data.createdByUserId, summary: "Criação inicial do projeto" },
      ],
    };
    store = [...store, project];
    return project;
  },

  async updateProject(id, data) {
    await delay(350);
    const index = store.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Projeto não encontrado: ${id}`);
    const current = store[index];
    const now = new Date().toISOString();
    const updated: InstitutionalProject = {
      ...current,
      ...data,
      lastUpdatedAt: now,
      versionHistory: [
        ...current.versionHistory,
        {
          version: current.versionHistory.length + 1,
          changedAt: now,
          changedBy: data.updatedBy ?? current.updatedBy,
          summary: "Atualização do projeto",
        },
      ],
    };
    store = [...store.slice(0, index), updated, ...store.slice(index + 1)];
    return updated;
  },

  async deleteProject(id) {
    await delay(300);
    store = store.filter((p) => p.id !== id);
  },

  async archiveProject(id) {
    await delay(300);
    const index = store.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Projeto não encontrado: ${id}`);
    const now = new Date().toISOString();
    store = [
      ...store.slice(0, index),
      { ...store[index], status: "archived", lastUpdatedAt: now },
      ...store.slice(index + 1),
    ];
  },

  async searchProjects(query) {
    await delay(250);
    const q = query.toLowerCase();
    return store
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q)) ||
          p.categories.some((c) => c.toLowerCase().includes(q)),
      )
      .map(toSummary);
  },
};

export const projectService: ProjectServiceContract = mockProjectService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
