/**
 * Mock canônico: Analytics Institucional — Fase 16
 * Os services importam daqui. Componentes NÃO importam diretamente.
 */

import type {
  AnalyticsData,
  AnalyticsEvent,
} from "../types/analytics";

export const analyticsMock: AnalyticsData = {
  // ── KPIs ────────────────────────────────────────────────────────────────────
  summary: {
    totalPresentations:       47,
    totalProjectsRegistered:   7,
    presentationsThisMonth:    9,
    mostUsedCategory:         "Transformação Digital",
    activeUsers:              12,
    totalSharedLinks:         23,
    totalQrCodeScans:         87,
    totalPublicLinkAccesses: 312,
    totalDirectAccesses:     198,
    avgSessionSeconds:        480,
  },

  // ── Projetos mais usados ─────────────────────────────────────────────────────
  projectUsage: [
    { projectId: "proj-app-barueri",    projectName: "App Barueri",           usageCount: 18, lastUsedAt: "2026-06-28T14:00:00", categories: ["Governo Digital", "Cidades Inteligentes"] },
    { projectId: "proj-bi-saude",       projectName: "BI Saúde",              usageCount: 15, lastUsedAt: "2026-06-25T10:30:00", categories: ["Saúde", "Transformação Digital"] },
    { projectId: "proj-internet-social",projectName: "Internet Social",       usageCount: 12, lastUsedAt: "2026-06-20T09:00:00", categories: ["Social", "Cidades Inteligentes"] },
    { projectId: "proj-metaverso",      projectName: "Metaverso Barueri",     usageCount: 10, lastUsedAt: "2026-06-15T16:00:00", categories: ["Inovação", "Inteligência Artificial"] },
    { projectId: "proj-edu-digital",    projectName: "Edu Digital",           usageCount:  8, lastUsedAt: "2026-06-10T11:00:00", categories: ["Educação", "Transformação Digital"] },
    { projectId: "proj-ocr",            projectName: "OCR Documental",        usageCount:  6, lastUsedAt: "2026-05-30T14:00:00", categories: ["Governo Digital", "Transformação Digital"] },
    { projectId: "proj-data-center",    projectName: "Data Center Municipal", usageCount:  4, lastUsedAt: "2026-05-22T10:00:00", categories: ["Infraestrutura"] },
  ],

  // ── Apresentações mais acessadas ─────────────────────────────────────────────
  presentationUsage: [
    { presentationId: "inst-pres-01", title: "Inovação em Saúde — Congresso SP 2026",     viewCount: 142, sharedCount:  8, averageSessionSeconds: 420, lastViewedAt: "2026-06-28T18:00:00", ownerName: "Marina Justus",  eventName: "Congresso Nacional de Inovação Pública 2026" },
    { presentationId: "inst-pres-02", title: "Transformação Digital — Visita BNDES",       viewCount:  87, sharedCount:  5, averageSessionSeconds: 680, lastViewedAt: "2026-06-25T12:00:00", ownerName: "João Lemes",      eventName: "Visita Técnica BNDES" },
    { presentationId: "inst-pres-03", title: "Portfólio SIT — Prêmio Cidades Digitais",   viewCount:  63, sharedCount: 12, averageSessionSeconds: 540, lastViewedAt: "2026-06-20T09:30:00", ownerName: "Bianca Souza",    eventName: "Prêmio Cidades Digitais 2026" },
    { presentationId: "inst-pres-04", title: "Projetos de Saúde — Reunião Interna",        viewCount:  41, sharedCount:  3, averageSessionSeconds: 310, lastViewedAt: "2026-06-15T14:00:00", ownerName: "Rafael Mendonça" },
    { presentationId: "inst-pres-05", title: "Educação Digital — Feira EdTech Barueri",   viewCount:  28, sharedCount:  7, averageSessionSeconds: 460, lastViewedAt: "2026-06-10T11:00:00", ownerName: "Marina Justus",  eventName: "Feira EdTech Barueri 2026" },
  ],

  // ── Categorias mais usadas ────────────────────────────────────────────────────
  categoryDistribution: [
    { category: "Transformação Digital",  count: 14, percentage: 29.8 },
    { category: "Governo Digital",        count: 11, percentage: 23.4 },
    { category: "Inovação",              count:  9, percentage: 19.1 },
    { category: "Cidades Inteligentes",  count:  7, percentage: 14.9 },
    { category: "Saúde",                 count:  4, percentage:  8.5 },
    { category: "Educação",              count:  2, percentage:  4.3 },
  ],

  // ── Tempo médio por módulo ────────────────────────────────────────────────────
  moduleTimeStats: [
    { moduleId: "projetos-selecionados",   moduleName: "Projetos Selecionados",        avgTimeSeconds: 142, totalViews: 41 },
    { moduleId: "indicadores",             moduleName: "Indicadores",                  avgTimeSeconds: 118, totalViews: 38 },
    { moduleId: "capa-institucional",      moduleName: "Capa Institucional",           avgTimeSeconds:  95, totalViews: 47 },
    { moduleId: "visao-geral-projetos",    moduleName: "Visão Geral dos Projetos",     avgTimeSeconds:  87, totalViews: 35 },
    { moduleId: "dados-macro",             moduleName: "Dados Macro",                  avgTimeSeconds:  76, totalViews: 32 },
    { moduleId: "dados-gerais-barueri",    moduleName: "Dados Gerais de Barueri",      avgTimeSeconds:  64, totalViews: 44 },
    { moduleId: "videos",                  moduleName: "Vídeos",                       avgTimeSeconds:  61, totalViews: 22 },
    { moduleId: "apresentacao-sit",        moduleName: "Apresentação da SIT",          avgTimeSeconds:  52, totalViews: 29 },
    { moduleId: "ods",                     moduleName: "ODS",                          avgTimeSeconds:  48, totalViews: 18 },
    { moduleId: "premios",                 moduleName: "Prêmios",                      avgTimeSeconds:  43, totalViews: 14 },
    { moduleId: "encerramento",            moduleName: "Encerramento",                 avgTimeSeconds:  38, totalViews: 46 },
    { moduleId: "agradecimento",           moduleName: "Agradecimento",                avgTimeSeconds:  31, totalViews: 43 },
    { moduleId: "apresentacao-secretario", moduleName: "Apresentação do Secretário",   avgTimeSeconds:  28, totalViews: 11 },
  ],

  // ── Idioma utilizado ──────────────────────────────────────────────────────────
  languageDistribution: [
    { language: "pt-BR", label: "Português (BR)", count: 38, percentage: 80.9 },
    { language: "en-US", label: "English (US)",   count:  7, percentage: 14.9 },
    { language: "es",    label: "Español",         count:  2, percentage:  4.2 },
  ],

  // ── Dispositivo usado ─────────────────────────────────────────────────────────
  deviceDistribution: [
    { device: "desktop", label: "Desktop",  count: 215, percentage: 57.1 },
    { device: "mobile",  label: "Mobile",   count: 118, percentage: 31.4 },
    { device: "tablet",  label: "Tablet",   count:  38, percentage: 10.1 },
    { device: "unknown", label: "Outro",    count:   5, percentage:  1.4 },
  ],

  // ── Origens de acesso (QR Code, link, direto) ─────────────────────────────────
  accessSourceStats: [
    { source: "direct",      label: "Acesso Direto",  count: 198, percentage: 44.1 },
    { source: "public-link", label: "Link Público",   count: 156, percentage: 34.7 },
    { source: "qr-code",     label: "QR Code",        count:  87, percentage: 19.4 },
    { source: "embed",       label: "Incorporado",    count:   8, percentage:  1.8 },
  ],

  // ── Versões usadas em eventos ─────────────────────────────────────────────────
  versionEventStats: [
    { presentationId: "inst-pres-01", title: "Inovação em Saúde — Congresso SP 2026",   version: 2, eventName: "Congresso Nacional de Inovação Pública 2026", eventDate: "2026-03-20", ownerName: "Marina Justus" },
    { presentationId: "inst-pres-01", title: "Inovação em Saúde — Congresso SP 2026",   version: 1, eventName: "Reunião de Preparação SIT",                   eventDate: "2026-02-10", ownerName: "Marina Justus" },
    { presentationId: "inst-pres-02", title: "Transformação Digital — Visita BNDES",     version: 3, eventName: "Visita Técnica BNDES",                         eventDate: "2026-04-15", ownerName: "João Lemes" },
    { presentationId: "inst-pres-03", title: "Portfólio SIT — Prêmio Cidades Digitais", version: 2, eventName: "Prêmio Cidades Digitais 2026",                 eventDate: "2026-06-05", ownerName: "Bianca Souza" },
    { presentationId: "inst-pres-05", title: "Educação Digital — Feira EdTech Barueri", version: 1, eventName: "Feira EdTech Barueri 2026",                    eventDate: "2026-06-10", ownerName: "Marina Justus" },
  ],

  // ── Funcionários que mais criaram / revisaram ──────────────────────────────────
  userActivityStats: [
    { userName: "Marina Justus",   department: "Gabinete de Dados",    createdCount: 18, reviewedCount: 12, lastActivityAt: "2026-06-28T18:00:00" },
    { userName: "João Lemes",      department: "Gabinete de Dados",    createdCount: 11, reviewedCount:  9, lastActivityAt: "2026-06-25T12:00:00" },
    { userName: "Bianca Souza",    department: "Comunicação",          createdCount:  8, reviewedCount: 14, lastActivityAt: "2026-06-20T09:30:00" },
    { userName: "Rafael Mendonça", department: "Gestão Estratégica",   createdCount:  6, reviewedCount:  7, lastActivityAt: "2026-06-15T14:00:00" },
    { userName: "Lucas Ferreira",  department: "Tecnologia e Inovação",createdCount:  4, reviewedCount:  3, lastActivityAt: "2026-06-10T11:00:00" },
  ],

  // ── Templates mais usados ─────────────────────────────────────────────────────
  templateUsageStats: [
    { templateId: "tpl-01", templateName: "Congresso Padrão",          usageCount: 14, eventType: "congresso",       lastUsedAt: "2026-06-28T14:00:00" },
    { templateId: "tpl-02", templateName: "Visita Técnica Completa",   usageCount: 11, eventType: "visita-tecnica",  lastUsedAt: "2026-06-25T10:30:00" },
    { templateId: "tpl-03", templateName: "Premiação Institucional",   usageCount:  8, eventType: "premiacao",       lastUsedAt: "2026-06-20T09:00:00" },
    { templateId: "tpl-04", templateName: "Reunião Interna Executiva", usageCount:  6, eventType: "reuniao-interna", lastUsedAt: "2026-06-15T16:00:00" },
    { templateId: "tpl-05", templateName: "Feira e Exposição",         usageCount:  4, eventType: "feira",           lastUsedAt: "2026-06-10T11:00:00" },
  ],

  // ── Atividade mensal ───────────────────────────────────────────────────────────
  activityByMonth: [
    { month: "Jan/2026", presentationsCreated: 3, projectsUpdated: 1, totalAccesses:  48 },
    { month: "Fev/2026", presentationsCreated: 5, projectsUpdated: 2, totalAccesses:  72 },
    { month: "Mar/2026", presentationsCreated: 8, projectsUpdated: 3, totalAccesses: 140 },
    { month: "Abr/2026", presentationsCreated: 6, projectsUpdated: 1, totalAccesses:  98 },
    { month: "Mai/2026", presentationsCreated:10, projectsUpdated: 4, totalAccesses: 187 },
    { month: "Jun/2026", presentationsCreated: 9, projectsUpdated: 2, totalAccesses: 163 },
  ],
};

export const analyticsEventsMock: AnalyticsEvent[] = [
  { id: "evt-1", presentationId: "inst-pres-01", accessCount: 42, averageTime: 380, deviceType: "desktop", language: "pt-BR", source: "direct",      accessedAt: "2026-06-28T14:00:00", qrCodeAccess: false, publicLinkAccess: false },
  { id: "evt-2", presentationId: "inst-pres-01", accessCount: 65, averageTime: 420, deviceType: "mobile",  language: "pt-BR", source: "qr-code",     accessedAt: "2026-06-28T16:00:00", qrCodeAccess: true,  publicLinkAccess: false, eventName: "Congresso Nacional 2026" },
  { id: "evt-3", presentationId: "inst-pres-01", accessCount: 35, averageTime: 460, deviceType: "tablet",  language: "pt-BR", source: "public-link", accessedAt: "2026-06-28T18:00:00", qrCodeAccess: false, publicLinkAccess: true  },
  { id: "evt-4", presentationId: "inst-pres-03", accessCount: 63, averageTime: 540, deviceType: "desktop", language: "pt-BR", source: "public-link", accessedAt: "2026-06-20T09:30:00", qrCodeAccess: false, publicLinkAccess: true,  eventName: "Prêmio Cidades Digitais 2026" },
];
