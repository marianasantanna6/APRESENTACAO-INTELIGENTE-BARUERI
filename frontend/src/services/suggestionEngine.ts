/**
 * Motor de sugestão de módulos — regras sem IA.
 *
 * Analisa projetos selecionados, tipo de evento e enfoques para
 * sugerir quais dos 13 módulos padrão devem estar ativos.
 */

import type { ProjectSummary } from "../types/project";
import type {
  EventType,
  PresentationModuleConfig,
  PresentationModuleId,
} from "../types/institutionalPresentation";

// ─── Metadados dos módulos ────────────────────────────────────────────────────

export type ModuleCategory = "estrutura" | "institucional" | "projetos" | "dados" | "encerramento";

export type ModuleInfo = {
  title: string;
  description: string;
  category: ModuleCategory;
};

export const MODULE_DEFINITIONS: Record<PresentationModuleId, ModuleInfo> = {
  "capa-institucional": {
    title: "Capa Institucional",
    description: "Identificação da Prefeitura e tema da apresentação",
    category: "estrutura",
  },
  "dados-gerais-barueri": {
    title: "Dados Gerais de Barueri",
    description: "População, área, IDH, PIB e indicadores municipais",
    category: "institucional",
  },
  "dados-macro": {
    title: "Dados Macro",
    description: "Contexto nacional e benchmarks de transformação digital",
    category: "dados",
  },
  "apresentacao-sit": {
    title: "Apresentação da SIT",
    description: "Estrutura e missão da Secretaria de Inovação e Tecnologia",
    category: "institucional",
  },
  "apresentacao-secretario": {
    title: "Apresentação do Secretário",
    description: "Perfil e mensagem do secretário responsável pela pasta",
    category: "institucional",
  },
  "visao-geral-projetos": {
    title: "Visão Geral dos Projetos",
    description: "Panorama do portfólio de iniciativas selecionadas",
    category: "projetos",
  },
  "projetos-selecionados": {
    title: "Projetos Selecionados",
    description: "Detalhamento individual de cada projeto incluído",
    category: "projetos",
  },
  "indicadores": {
    title: "Indicadores",
    description: "Métricas e resultados mensuráveis dos projetos",
    category: "dados",
  },
  "premios": {
    title: "Prêmios e Reconhecimentos",
    description: "Certificações, premiações e reconhecimentos obtidos",
    category: "dados",
  },
  "ods": {
    title: "ODS — Agenda 2030",
    description: "Alinhamento dos projetos com os Objetivos de Desenvolvimento Sustentável",
    category: "dados",
  },
  "videos": {
    title: "Vídeos",
    description: "Galeria de vídeos e conteúdo audiovisual dos projetos",
    category: "projetos",
  },
  "encerramento": {
    title: "Encerramento",
    description: "Slide de encerramento com próximos passos e contatos",
    category: "encerramento",
  },
  "agradecimento": {
    title: "Agradecimento",
    description: "Slide de agradecimento e abertura para perguntas",
    category: "encerramento",
  },
};

// ─── Ordem canônica ───────────────────────────────────────────────────────────

export const CANONICAL_MODULE_ORDER: PresentationModuleId[] = [
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
];

// ─── Motor de sugestão ────────────────────────────────────────────────────────

/**
 * Retorna 13 PresentationModuleConfig com enabled=true/false baseado em regras.
 * Sem IA — usa categorias dos projetos, tipo de evento e enfoques selecionados.
 */
export function suggestModules(
  projects: ProjectSummary[],
  mainFocus: string,
  eventType: EventType | "",
  secondaryFocuses: string[],
): PresentationModuleConfig[] {
  const categories = new Set(projects.flatMap((p) => p.categories as string[]));
  const allFocuses = new Set([mainFocus, ...secondaryFocuses]);
  const hasProjects = projects.length > 0;

  const isVisita   = eventType === "visita-tecnica";
  const isPremio   = eventType === "premiacao";
  const isCongresso = eventType === "congresso" || eventType === "feira";
  const isAudiencia = eventType === "audiencia-publica";
  const isInterna  = eventType === "reuniao-interna";

  const hasTech =
    categories.has("Inovação") ||
    categories.has("Transformação Digital") ||
    categories.has("Cidades Inteligentes") ||
    categories.has("Inteligência Artificial") ||
    categories.has("Governo Digital") ||
    allFocuses.has("Tecnologia e Inovação");

  const hasSustentabilidade =
    categories.has("Meio Ambiente") ||
    categories.has("Social") ||
    allFocuses.has("Meio Ambiente");

  const hasAwards =
    categories.has("Governo Digital") ||
    categories.has("Cidades Inteligentes") ||
    isPremio;

  function isEnabled(id: PresentationModuleId): boolean {
    switch (id) {
      case "capa-institucional":        return true;
      case "dados-gerais-barueri":      return isVisita || isCongresso || isAudiencia;
      case "dados-macro":               return hasTech || isCongresso || isVisita;
      case "apresentacao-sit":          return !isInterna;
      case "apresentacao-secretario":   return isVisita || isAudiencia || isPremio;
      case "visao-geral-projetos":      return hasProjects;
      case "projetos-selecionados":     return hasProjects;
      case "indicadores":               return hasProjects;
      case "premios":                   return hasAwards;
      case "ods":                       return hasSustentabilidade || isPremio;
      case "videos":                    return false; // ativado manualmente pelo usuário
      case "encerramento":              return true;
      case "agradecimento":             return !isInterna;
    }
  }

  return CANONICAL_MODULE_ORDER.map((moduleId) => ({
    instanceId: `inst-${moduleId}`,
    moduleId,
    enabled: isEnabled(moduleId),
    hidden: false,
  }));
}
