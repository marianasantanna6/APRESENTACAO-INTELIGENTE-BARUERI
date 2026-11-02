import { authFetch } from "../lib/apiClient";
import type {
  GovernmentArea,
  InstitutionalProject,
  NewProjectPayload,
  ProjectCategory,
  ProjectFilters,
  ProjectStatus,
  ProjectSummary,
  UpdateProjectPayload,
} from "../types/project";
import type { ProjectServiceContract } from "./projectService";

// Mapeamento status numérico (banco) → string (frontend)
function mapStatus(s: number): ProjectStatus {
  if (s === 2) return "active";
  if (s === 3) return "archived";
  return "draft";
}

type ApiProject = {
  id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  main_department: string | null;
  related_departments: string[];
  areas: string[];
  theme: string | null;
  status: number;
  last_update: string | null;
  keywords: string[];
  audience: string | null;
  technologies: string[];
  source: { url: string; name: string }[];
  ods: number[];
  awards: { institution: string; year: number; description: string | null; link: string | null }[];
  indicators: { label: string; value: string; measure: string | null; source: string; year: number }[];
  implementation_date: string | null;
  user: string;
  team: string;
  version: string;
  family: string;
};

function toSummary(p: ApiProject): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    shortDescription: p.short_description ?? "",
    status: mapStatus(p.status),
    categories: p.areas as ProjectCategory[],
    governmentArea: (p.theme ?? "Administração") as GovernmentArea,
    mainDepartment: p.main_department ?? "",
    lastUpdatedAt: p.last_update ?? new Date().toISOString(),
  };
}

function toFull(p: ApiProject): InstitutionalProject {
  return {
    id: p.id,
    name: p.name,
    shortDescription: p.short_description ?? "",
    fullDescription: p.full_description ?? "",
    mainDepartment: p.main_department ?? "",
    relatedDepartments: p.related_departments,
    governmentArea: (p.theme ?? "Administração") as GovernmentArea,
    categories: p.areas as ProjectCategory[],
    technologies: p.technologies,
    keywords: p.keywords,
    targetAudience: p.audience ? [p.audience] : [],
    status: mapStatus(p.status),
    implementationDate: p.implementation_date ?? "",
    indicators: p.indicators.map((ind, i) => ({
      id: `ind-${i}`,
      label: ind.label,
      value: ind.value,
      unit: ind.measure ?? undefined,
      source: ind.source,
      year: String(ind.year),
    })),
    images: [],
    videos: [],
    officialLinks: p.source.map((s, i) => ({
      id: `src-${i}`,
      label: s.name,
      url: s.url,
      type: "portal" as const,
    })),
    awards: p.awards.map((a, i) => ({
      id: `aw-${i}`,
      name: a.description ?? a.institution,
      organization: a.institution,
      year: String(a.year),
      description: a.description ?? undefined,
      link: a.link ?? undefined,
    })),
    ods: p.ods as InstitutionalProject["ods"],
    sources: p.source.map((s) => s.url),
    relatedProjectIds: [],
    lastUpdatedAt: p.last_update ?? new Date().toISOString(),
    updatedBy: p.user,
    versionHistory: [],
    createdByUserId: p.user,
    createdAt: p.last_update ?? new Date().toISOString(),
  };
}

export const realProjectService: ProjectServiceContract = {
  async getProjects(filters: ProjectFilters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status === "active" ? "2" : filters.status === "archived" ? "3" : "1");
      if (filters.department) params.set("main_department", filters.department);
      if (filters.query) params.set("name", filters.query);

      const res = await authFetch(`/api/projects?${params.toString()}`);
      if (!res.ok) return [];
      const data: ApiProject[] = await res.json();
      return data.map(toSummary);
    } catch {
      return [];
    }
  },

  async getProjectById(id: string) {
    try {
      const res = await authFetch(`/api/projects?id=${id}`);
      if (!res.ok) return null;
      const data: ApiProject[] = await res.json();
      return data.length > 0 ? toFull(data[0]) : null;
    } catch {
      return null;
    }
  },

  async createProject(_data: NewProjectPayload) {
    // Criação de projetos pelo wizard não tem contexto de time —
    // retorna um objeto temporário sem persistir.
    throw new Error("createProject: selecione um time no módulo de Times.");
  },

  async updateProject(_id: string, _data: UpdateProjectPayload) {
    throw new Error("updateProject: não implementado no serviço real.");
  },

  async deleteProject(_id: string) {
    // Sem endpoint de delete no backend (usa reject para rascunhos)
  },

  async archiveProject(_id: string) {
    // Sem endpoint de archive no backend atual
  },

  async searchProjects(query: string) {
    return realProjectService.getProjects({ query });
  },
};
