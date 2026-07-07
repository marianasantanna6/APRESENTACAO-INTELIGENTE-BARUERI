/**
 * Domínio: Analytics Institucional
 *
 * Dados de uso e métricas da plataforma — estatísticos e institucionais.
 * Nenhum dado pessoal sensível é coletado.
 */

// ─── Enums básicos ────────────────────────────────────────────────────────────

export type DeviceType = "desktop" | "tablet" | "mobile" | "unknown";

export type AccessSource =
  | "direct"          // acesso direto pela plataforma
  | "public-link"     // link público compartilhado
  | "qr-code"         // acesso via QR Code
  | "embed";          // conteúdo incorporado

// ─── Evento atômico de acesso ────────────────────────────────────────────────

export type AnalyticsEvent = {
  id: string;
  presentationId: string;
  projectId?: string;
  moduleId?: string;
  accessCount: number;
  averageTime: number;         // segundos
  deviceType: DeviceType;
  language: string;
  source: AccessSource;
  eventName?: string;
  accessedAt: string;          // ISO 8601
  qrCodeAccess: boolean;
  publicLinkAccess: boolean;
};

// ─── KPIs gerais ─────────────────────────────────────────────────────────────

export type AnalyticsSummary = {
  totalPresentations: number;
  totalProjectsRegistered: number;
  presentationsThisMonth: number;
  mostUsedCategory: string;
  activeUsers: number;
  totalSharedLinks: number;
  totalQrCodeScans: number;
  totalPublicLinkAccesses: number;
  totalDirectAccesses: number;
  avgSessionSeconds: number;
};

// ─── Apresentações mais acessadas / consultadas ───────────────────────────────

export type PresentationUsageEntry = {
  presentationId: string;
  title: string;
  viewCount: number;
  sharedCount: number;
  averageSessionSeconds: number;
  lastViewedAt: string;
  ownerName: string;           // nome do funcionário (não é dado sensível — é papel institucional)
  eventName?: string;
};

// ─── Projetos mais usados ─────────────────────────────────────────────────────

export type ProjectUsageStat = {
  projectId: string;
  projectName: string;
  usageCount: number;
  lastUsedAt: string;
  categories: string[];
};

// ─── Categorias mais usadas ───────────────────────────────────────────────────

export type CategoryDistribution = {
  category: string;
  count: number;
  percentage: number;
};

// ─── Tempo médio por módulo ───────────────────────────────────────────────────

export type ModuleTimeStat = {
  moduleId: string;
  moduleName: string;
  avgTimeSeconds: number;
  totalViews: number;
};

// ─── Idioma utilizado ─────────────────────────────────────────────────────────

export type LanguageDistribution = {
  language: string;            // ex: "pt-BR"
  label: string;               // ex: "Português (BR)"
  count: number;
  percentage: number;
};

// ─── Dispositivo usado ────────────────────────────────────────────────────────

export type DeviceDistribution = {
  device: DeviceType;
  label: string;
  count: number;
  percentage: number;
};

// ─── Acessos por origem (QR Code, link, direto) ───────────────────────────────

export type AccessSourceStat = {
  source: AccessSource;
  label: string;
  count: number;
  percentage: number;
};

// ─── Versões usadas em eventos ────────────────────────────────────────────────

export type VersionEventStat = {
  presentationId: string;
  title: string;
  version: number;
  eventName: string;
  eventDate: string;
  ownerName: string;
};

// ─── Funcionários que mais criaram/revisaram ──────────────────────────────────

export type UserActivityStat = {
  userName: string;            // nome do funcionário (papel institucional)
  department: string;
  createdCount: number;
  reviewedCount: number;
  lastActivityAt: string;
};

// ─── Templates mais usados ────────────────────────────────────────────────────

export type TemplateUsageStat = {
  templateId: string;
  templateName: string;
  usageCount: number;
  eventType: string;
  lastUsedAt: string;
};

// ─── Atividade mensal ────────────────────────────────────────────────────────

export type MonthlyActivity = {
  month: string;
  presentationsCreated: number;
  projectsUpdated: number;
  totalAccesses: number;
};

// ─── Visão agregada completa ──────────────────────────────────────────────────

export type AnalyticsData = {
  summary: AnalyticsSummary;
  projectUsage: ProjectUsageStat[];
  presentationUsage: PresentationUsageEntry[];
  categoryDistribution: CategoryDistribution[];
  moduleTimeStats: ModuleTimeStat[];
  languageDistribution: LanguageDistribution[];
  deviceDistribution: DeviceDistribution[];
  accessSourceStats: AccessSourceStat[];
  versionEventStats: VersionEventStat[];
  userActivityStats: UserActivityStat[];
  templateUsageStats: TemplateUsageStat[];
  activityByMonth: MonthlyActivity[];
};

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m" | "all";

export type AnalyticsFilters = {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  department?: string;
  source?: AccessSource;
  deviceType?: DeviceType;
};
