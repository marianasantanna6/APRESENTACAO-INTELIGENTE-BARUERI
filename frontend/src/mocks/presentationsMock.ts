/**
 * Mock canônico: Apresentações
 *
 * Inclui tanto o resumo admin (AdminPresentationSummary) quanto
 * as novas apresentações institucionais (InstitutionalPresentation).
 * Os services importam daqui. Componentes NÃO importam diretamente.
 */

import type { AdminPresentationSummary } from "../types/admin";
import type { InstitutionalPresentation } from "../types/institutionalPresentation";

// ─── Resumo admin (listagem de apresentações existente) ──────────────────────

export const presentationsMock: AdminPresentationSummary[] = [
  {
    id: "presentation-marina-idh",
    ownerUserId: "admin-marina",
    ownerName: "Marina Justus",
    title: "IDH no Brasil - 2010",
    category: "Economia",
    status: "presented",
    date: "2026-03-22T14:30:00",
    department: "Gabinete de Dados",
    team: "Plataforma Analítica",
    filters: { query: "IDH no Brasil 2010", category: "Economia", year: "2010" },
  },
  {
    id: "presentation-marina-piramide",
    ownerUserId: "admin-marina",
    ownerName: "Marina Justus",
    title: "Pirâmide etária Brasil 1991 vs 2010",
    category: "População",
    status: "ready",
    date: "2026-03-13T10:15:00",
    department: "Gabinete de Dados",
    team: "Plataforma Analítica",
    filters: { query: "Pirâmide etária Brasil", category: "População", year: "2010" },
  },
  {
    id: "presentation-joao-mobilidade",
    ownerUserId: "admin-joao",
    ownerName: "João Lemes",
    title: "Mobilidade urbana por distrito",
    category: "Planejamento",
    status: "presented",
    date: "2026-03-18T09:00:00",
    department: "Planejamento",
    team: "Planejamento Territorial",
    filters: { query: "Mobilidade urbana distritos", category: "Planejamento", year: "2026" },
  },
  {
    id: "presentation-bianca-contratos",
    ownerUserId: "employee-bianca",
    ownerName: "Bianca Souza",
    title: "Resumo semanal da equipe territorial",
    category: "Planejamento",
    status: "ready",
    date: "2026-03-17T11:20:00",
    department: "Planejamento",
    team: "Planejamento Territorial",
    filters: { query: "Resumo semanal territorial", category: "Planejamento", year: "2026" },
  },
];

// ─── Helper para moduleConfigs padrão ────────────────────────────────────────

function mkModules(
  enabled: Record<string, boolean>,
): InstitutionalPresentation["moduleConfigs"] {
  const ids = [
    "capa-institucional",
    "dados-gerais-barueri",
    "dados-macro",
    "apresentacao-sit",
    "apresentacao-secretario",
    "visao-geral-projetos",
    "projetos-selecionados",
    "indicadores",
    "premios",
    "ods",
    "videos",
    "encerramento",
    "agradecimento",
  ] as const;
  return ids.map((moduleId) => ({
    instanceId: `inst-${moduleId}`,
    moduleId,
    enabled: enabled[moduleId] ?? false,
    hidden: false,
  }));
}

// ─── Apresentações institucionais (novo modelo) ──────────────────────────────

export const institutionalPresentationsMock: InstitutionalPresentation[] = [
  {
    id: "inst-pres-01",
    title: "Inovação em Saúde — Congresso SP 2026",
    eventName: "Congresso Nacional de Inovação Pública 2026",
    eventType: "congresso",
    purpose: "Apresentar as iniciativas de transformação digital na área da saúde de Barueri",
    audience: "Gestores públicos e especialistas em saúde pública",
    mainFocus: "Saúde",
    secondaryFocuses: ["Transformação Digital"],
    selectedProjects: ["project-bi-saude", "project-app-barueri"],
    moduleConfigs: mkModules({
      "capa-institucional":      true,
      "dados-gerais-barueri":    true,
      "dados-macro":             true,
      "apresentacao-sit":        true,
      "visao-geral-projetos":    true,
      "projetos-selecionados":   true,
      "indicadores":             true,
      "encerramento":            true,
      "agradecimento":           true,
    }),
    language: "pt-BR",
    status: "presented",
    createdBy: "admin-marina",
    createdAt: "2026-03-10T09:00:00",
    updatedAt: "2026-03-20T14:00:00",
    version: 2,
    publicLink: "https://sit.barueri.sp.gov.br/p/inovacao-saude-2026",
    notes: "Apresentar no auditório principal às 14h.",
  },
  {
    id: "inst-pres-02",
    title: "Transformação Digital — Visita BNDES",
    eventName: "Visita técnica BNDES a Barueri",
    eventType: "visita-tecnica",
    purpose: "Demonstrar o portfólio de inovação para potencial parceria com o BNDES",
    audience: "Representantes do BNDES e parceiros estratégicos",
    mainFocus: "Transformação Digital",
    secondaryFocuses: ["Governo Digital", "Cidades Inteligentes"],
    selectedProjects: [
      "project-app-barueri",
      "project-metaverso",
      "project-data-center",
      "project-internet-social",
    ],
    moduleConfigs: mkModules({
      "capa-institucional":      true,
      "dados-gerais-barueri":    true,
      "dados-macro":             true,
      "apresentacao-sit":        true,
      "apresentacao-secretario": true,
      "visao-geral-projetos":    true,
      "projetos-selecionados":   true,
      "indicadores":             true,
      "encerramento":            true,
      "agradecimento":           true,
    }),
    language: "pt-BR",
    status: "ready",
    createdBy: "admin-marina",
    createdAt: "2026-04-01T10:00:00",
    updatedAt: "2026-04-15T11:00:00",
    version: 1,
  },
  {
    id: "inst-pres-03",
    title: "Portfólio SIT — Prêmio Cidades Digitais",
    eventName: "Prêmio Cidades Digitais 2026",
    eventType: "premiacao",
    purpose: "Inscrição no prêmio nacional de cidades digitais",
    audience: "Comissão avaliadora do Prêmio Cidades Digitais",
    mainFocus: "Governo Digital",
    secondaryFocuses: ["Cidades Inteligentes"],
    selectedProjects: [
      "project-internet-social",
      "project-edu-digital",
      "project-app-barueri",
    ],
    moduleConfigs: mkModules({
      "capa-institucional":      true,
      "apresentacao-sit":        true,
      "apresentacao-secretario": true,
      "visao-geral-projetos":    true,
      "projetos-selecionados":   true,
      "indicadores":             true,
      "premios":                 true,
      "ods":                     true,
      "encerramento":            true,
      "agradecimento":           true,
    }),
    language: "pt-BR",
    status: "ready",
    createdBy: "employee-bianca",
    createdAt: "2026-05-10T08:00:00",
    updatedAt: "2026-05-20T16:00:00",
    version: 1,
    qrCode: "data:image/png;base64,mockQrCode",
    publicLink: "https://sit.barueri.sp.gov.br/p/cidades-digitais-2026",
  },
];
