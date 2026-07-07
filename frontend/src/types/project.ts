/**
 * Domínio: Projetos Institucionais
 *
 * Representa os projetos da Prefeitura de Barueri cadastrados na plataforma.
 * Um projeto pode ser reutilizado em múltiplas apresentações e está associado
 * a uma ou mais categorias temáticas e áreas de governo.
 */

// ─── Enumerações ────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "draft" | "archived";

export type ProjectCategory =
  | "Saúde"
  | "Educação"
  | "Inovação"
  | "Transformação Digital"
  | "Cidades Inteligentes"
  | "Governo Digital"
  | "Inteligência Artificial"
  | "Mobilidade Urbana"
  | "Meio Ambiente"
  | "Segurança Pública"
  | "Infraestrutura"
  | "Social"
  | "Economia"
  | "Cultura e Lazer"
  | "Habitação"
  | "Saneamento"
  | "Esporte e Lazer"
  | "Trabalho e Emprego";

export type GovernmentArea =
  | "Saúde"
  | "Educação"
  | "Habitação e Urbanismo"
  | "Meio Ambiente"
  | "Segurança Pública"
  | "Infraestrutura"
  | "Desenvolvimento Econômico"
  | "Social"
  | "Tecnologia e Inovação"
  | "Administração"
  | "Cultura e Lazer"
  | "Mobilidade Urbana";

/** Objetivos de Desenvolvimento Sustentável (1–17) */
export type OdsGoal =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

// ─── Sub-entidades ───────────────────────────────────────────────────────────

export type ProjectIndicator = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  source: string;
  year: string;
};

export type ProjectImage = {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
  uploadedAt: string;
};

export type ProjectVideo = {
  id: string;
  url: string;
  title: string;
  caption?: string;
  durationSeconds?: number;
};

export type ProjectOfficialLink = {
  id: string;
  label: string;
  url: string;
  type: "portal" | "document" | "report" | "video" | "other";
};

export type ProjectAward = {
  id: string;
  name: string;
  organization: string;
  year: string;
  description?: string;
  link?: string;
};

/** Snapshot compacto usado dentro de InstitutionalProject */
export type ProjectVersionRef = {
  version: number;
  changedAt: string;
  changedBy: string;
  summary: string;
};

// ─── Entidade principal ──────────────────────────────────────────────────────

export type InstitutionalProject = {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  mainDepartment: string;
  relatedDepartments: string[];
  governmentArea: GovernmentArea;
  categories: ProjectCategory[];
  technologies: string[];
  keywords: string[];
  targetAudience: string[];
  status: ProjectStatus;
  implementationDate: string;
  indicators: ProjectIndicator[];
  images: ProjectImage[];
  videos: ProjectVideo[];
  officialLinks: ProjectOfficialLink[];
  awards: ProjectAward[];
  ods: OdsGoal[];
  sources: string[];
  relatedProjectIds: string[];
  lastUpdatedAt: string;
  updatedBy: string;
  versionHistory: ProjectVersionRef[];
  createdByUserId: string;
  createdAt: string;
};

// ─── Payloads de mutação ─────────────────────────────────────────────────────

export type NewProjectPayload = Omit<
  InstitutionalProject,
  "id" | "createdAt" | "lastUpdatedAt" | "versionHistory"
>;

export type UpdateProjectPayload = Partial<
  Omit<InstitutionalProject, "id" | "createdAt" | "versionHistory">
>;

// ─── Projeção resumida (para listagens) ─────────────────────────────────────

export type ProjectSummary = {
  id: string;
  name: string;
  shortDescription: string;
  status: ProjectStatus;
  categories: ProjectCategory[];
  governmentArea: GovernmentArea;
  mainDepartment: string;
  lastUpdatedAt: string;
};

// ─── Filtros ─────────────────────────────────────────────────────────────────

export type ProjectFilters = {
  query?: string;
  category?: ProjectCategory | "";
  status?: ProjectStatus | "";
  department?: string;
  governmentArea?: GovernmentArea | "";
};
