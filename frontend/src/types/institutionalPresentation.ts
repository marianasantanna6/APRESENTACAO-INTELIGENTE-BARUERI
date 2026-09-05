import type { ShareConfig } from "./share";

/**
 * Domínio: Apresentação Institucional
 *
 * Representa uma apresentação montada dinamicamente a partir de
 * projetos e módulos cadastrados na plataforma. Diferente de
 * PresentationData (fluxo de IDH/dashboard legado), esta entidade
 * é o objeto central do novo fluxo de montagem de apresentações.
 */

// ─── Enumerações ────────────────────────────────────────────────────────────

export type EventType =
  | "congresso"
  | "visita-tecnica"
  | "premiacao"
  | "reuniao-interna"
  | "feira"
  | "audiencia-publica"
  | "outro";

export type PresentationStatus = "draft" | "ready" | "presented" | "archived";

export type PresentationLanguage = "pt-BR" | "en-US" | "es";

// ─── Módulos padrão (Fase 11) ─────────────────────────────────────────────────

export type PresentationModuleId =
  | "capa-institucional"
  | "dados-gerais-barueri"
  | "dados-macro"
  | "apresentacao-sit"
  | "apresentacao-secretario"
  | "visao-geral-projetos"
  | "projetos-selecionados"
  | "indicadores"
  | "premios"
  | "ods"
  | "videos"
  | "encerramento"
  | "agradecimento";

/**
 * Configuração de uma instância de módulo dentro de uma apresentação.
 * `instanceId` é único por instância — permite duplicar o mesmo módulo.
 * A ordem é determinada pela posição no array `moduleConfigs`.
 * Estrutura preparada para drag and drop futuro.
 */
export type PresentationModuleConfig = {
  instanceId: string;
  moduleId: PresentationModuleId;
  enabled: boolean;
  hidden: boolean;
  duplicatedFrom?: string; // instanceId de origem, quando for cópia
  config?: Record<string, unknown>;
};

// ─── Entidade principal ──────────────────────────────────────────────────────

export type InstitutionalPresentation = {
  id: string;
  title: string;
  eventName: string;
  eventType: EventType;
  purpose: string;
  audience: string;
  mainFocus: string;
  secondaryFocuses: string[];
  selectedProjects: string[];        // IDs de InstitutionalProject
  moduleConfigs: PresentationModuleConfig[];
  language: PresentationLanguage;
  status: PresentationStatus;
  createdBy: string;                 // userId
  createdAt: string;
  updatedAt: string;
  version: number;
  publicLink?: string;
  qrCode?: string;                   // data URL ou código (legado)
  shareConfig?: ShareConfig;         // Fase 15 — configuração de compartilhamento
  notes?: string;
};

// ─── Payloads de mutação ─────────────────────────────────────────────────────

export type NewPresentationPayload = Omit<
  InstitutionalPresentation,
  "id" | "createdAt" | "updatedAt" | "version" | "publicLink" | "qrCode"
>;

export type UpdatePresentationPayload = Partial<
  Omit<InstitutionalPresentation, "id" | "createdAt" | "createdBy">
>;

// ─── Projeção resumida (para listagens) ─────────────────────────────────────

export type PresentationSummary = {
  id: string;
  title: string;
  eventName: string;
  eventType: EventType;
  status: PresentationStatus;
  language: PresentationLanguage;
  mainFocus: string;
  audience: string;
  selectedProjects: string[];
  activeModuleCount: number;
  totalModuleCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

// ─── Filtros ─────────────────────────────────────────────────────────────────

export type PresentationFiltersNew = {
  query?: string;
  status?: PresentationStatus | "";
  eventType?: EventType | "";
  language?: PresentationLanguage | "";
  createdBy?: string;
};
