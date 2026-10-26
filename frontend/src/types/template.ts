/**
 * Domínio: Templates de Apresentação
 *
 * Templates são modelos salvos que orientam a montagem de apresentações.
 * Cada template define o tipo de evento, foco temático, projetos sugeridos
 * e módulos ordenados com configurações pré-definidas.
 */

import type { ProjectCategory } from "./project";
import type {
  EventType,
  PresentationLanguage,
  PresentationModuleConfig,
} from "./institutionalPresentation";

// ─── Enumerações ────────────────────────────────────────────────────────────

export type TemplateStatus = "active" | "draft" | "archived";

export type TemplateModuleType =
  | "intro"
  | "project-card"
  | "indicator-highlight"
  | "media-gallery"
  | "comparison"
  | "timeline"
  | "map"
  | "closing"
  | "custom";

// ─── Sub-entidades ───────────────────────────────────────────────────────────

export type TemplateModule = {
  id: string;
  type: TemplateModuleType;
  title: string;
  description: string;
  isOptional: boolean;
  config?: Record<string, unknown>;
};

// ─── Entidade principal ──────────────────────────────────────────────────────

export type PresentationTemplate = {
  id: string;
  name: string;
  description: string;
  eventName?: string;
  eventType: EventType;
  focus: string;
  secondaryFocuses?: string[];
  objective?: string;
  audience?: string;
  categories: ProjectCategory[];
  projects: string[];                          // IDs de InstitutionalProject
  modules: TemplateModule[];
  moduleOrder: string[];
  moduleConfigs?: PresentationModuleConfig[];  // módulos vindos do wizard (Fase 14)
  language: PresentationLanguage;
  createdBy: string;                           // userId
  createdByName?: string;                      // nome legível do autor
  createdAt: string;
  updatedAt: string;
  status: TemplateStatus;
  shareLink?: string;
  notes?: string;
  isOfficial: boolean;
  estimatedDurationMinutes: number;
};

// ─── Payloads de mutação ─────────────────────────────────────────────────────

export type NewTemplatePayload = Omit<
  PresentationTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTemplatePayload = Partial<
  Omit<PresentationTemplate, "id" | "createdAt" | "createdBy">
>;
