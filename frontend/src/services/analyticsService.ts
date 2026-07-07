/**
 * analyticsService — Analytics Institucional (Fase 16)
 * Mock em memória. Para backend: implemente AnalyticsServiceContract e troque o export.
 *
 * O mock aplica escalonamento realista por período, de modo que trocar o filtro
 * altera os números de forma coerente (7 dias mostra menos que 30, que mostra menos
 * que 90, etc.). Percentuais de distribuição permanecem estáveis — apenas contagens
 * absolutas e totais variam.
 */

import { analyticsMock, analyticsEventsMock } from "../mocks/analyticsMock";
import type {
  AnalyticsData,
  AnalyticsEvent,
  AnalyticsFilters,
  AnalyticsPeriod,
} from "../types/analytics";

// ─── Escala proporcional por período (base = 30d = 1.0) ──────────────────────

const PERIOD_SCALE: Record<AnalyticsPeriod, number> = {
  "7d":  0.22,
  "30d": 1.0,
  "90d": 2.7,
  "12m": 9.2,
  "all": 11.5,
};

// Quantos meses mostrar na atividade mensal
const PERIOD_MONTHS: Record<AnalyticsPeriod, number> = {
  "7d":  1,
  "30d": 1,
  "90d": 3,
  "12m": 6,
  "all": 6,
};

function scale(n: number, factor: number): number {
  return Math.max(0, Math.round(n * factor));
}

function applyPeriod(data: AnalyticsData, period: AnalyticsPeriod): AnalyticsData {
  const f = PERIOD_SCALE[period];
  const months = PERIOD_MONTHS[period];

  return {
    summary: {
      ...data.summary,
      totalPresentations:       scale(data.summary.totalPresentations,       f),
      presentationsThisMonth:   scale(data.summary.presentationsThisMonth,   f),
      activeUsers:              scale(data.summary.activeUsers,               Math.min(f, 1)), // usuários não crescem linearmente
      totalSharedLinks:         scale(data.summary.totalSharedLinks,          f),
      totalQrCodeScans:         scale(data.summary.totalQrCodeScans,          f),
      totalPublicLinkAccesses:  scale(data.summary.totalPublicLinkAccesses,   f),
      totalDirectAccesses:      scale(data.summary.totalDirectAccesses,       f),
      // avgSessionSeconds não escala com o período
    },

    projectUsage: data.projectUsage.map((p) => ({
      ...p,
      usageCount: scale(p.usageCount, f),
    })),

    presentationUsage: data.presentationUsage.map((p) => ({
      ...p,
      viewCount:    scale(p.viewCount,    f),
      sharedCount:  scale(p.sharedCount,  f),
    })),

    categoryDistribution: data.categoryDistribution.map((c) => ({
      ...c,
      count: scale(c.count, f),
      // percentage permanece igual — é relativa
    })),

    moduleTimeStats: data.moduleTimeStats.map((m) => ({
      ...m,
      totalViews: scale(m.totalViews, f),
      // avgTimeSeconds não escala com o período
    })),

    languageDistribution: data.languageDistribution.map((l) => ({
      ...l,
      count: scale(l.count, f),
    })),

    deviceDistribution: data.deviceDistribution.map((d) => ({
      ...d,
      count: scale(d.count, f),
    })),

    accessSourceStats: data.accessSourceStats.map((s) => ({
      ...s,
      count: scale(s.count, f),
    })),

    // Versões em eventos: mostrar apenas os mais recentes para períodos curtos
    versionEventStats: period === "7d"
      ? data.versionEventStats.slice(0, 1)
      : period === "30d"
      ? data.versionEventStats.slice(0, 2)
      : data.versionEventStats,

    userActivityStats: data.userActivityStats.map((u) => ({
      ...u,
      createdCount:  scale(u.createdCount,  f),
      reviewedCount: scale(u.reviewedCount, f),
    })),

    templateUsageStats: data.templateUsageStats.map((t) => ({
      ...t,
      usageCount: scale(t.usageCount, f),
    })),

    // Atividade mensal: fatiar pelos meses mais recentes
    activityByMonth: data.activityByMonth.slice(-months).map((m) => ({
      ...m,
      presentationsCreated: scale(m.presentationsCreated, f / (data.activityByMonth.length / months)),
      projectsUpdated:      scale(m.projectsUpdated,      f / (data.activityByMonth.length / months)),
      totalAccesses:        scale(m.totalAccesses,         f / (data.activityByMonth.length / months)),
    })),
  };
}

// ─── Contrato ─────────────────────────────────────────────────────────────────

export interface AnalyticsServiceContract {
  getAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsData>;
  getAnalyticsEvents(filters?: AnalyticsFilters): Promise<AnalyticsEvent[]>;
  trackEvent(event: Omit<AnalyticsEvent, "id">): Promise<void>;
}

// ─── Implementação mock ───────────────────────────────────────────────────────

let eventsStore: AnalyticsEvent[] = [...analyticsEventsMock];

const mockAnalyticsService: AnalyticsServiceContract = {
  async getAnalytics(filters = {}) {
    await delay(320);
    const period: AnalyticsPeriod = filters.period ?? "30d";
    return applyPeriod(analyticsMock, period);
  },

  async getAnalyticsEvents(filters = {}) {
    await delay(200);
    return eventsStore.filter((e) => {
      if (filters.source     && e.source     !== filters.source)     return false;
      if (filters.deviceType && e.deviceType !== filters.deviceType) return false;
      if (filters.startDate  && e.accessedAt  <  filters.startDate)  return false;
      if (filters.endDate    && e.accessedAt  >  filters.endDate)    return false;
      return true;
    });
  },

  async trackEvent(event) {
    await delay(100);
    eventsStore = [...eventsStore, { ...event, id: `evt-${Date.now()}` }];
  },
};

export const analyticsService: AnalyticsServiceContract = mockAnalyticsService;

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
