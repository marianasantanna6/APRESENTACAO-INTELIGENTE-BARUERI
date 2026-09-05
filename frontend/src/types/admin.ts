/**
 * Domínio: Console Administrativo
 *
 * Tipos usados pelas páginas de administração: diretório de funcionários,
 * log de atividades, integrações e resumo de apresentações.
 * Mantém compatibilidade total com o código existente.
 */

import type { AccountStatus, UserAccessLevel } from "./auth";
import type { PresentationFilters } from "./presentation";
import type { IntegrationStatus } from "./integration";

// ─── Re-exports para compatibilidade (código existente importa daqui) ────────

export type { IntegrationStatus as ApiIntegrationStatus };

// ─── Organização ─────────────────────────────────────────────────────────────

export type OrganizationDirectoryEntry = {
  department: string;
  teams: string[];
};

// ─── Apresentações (resumo para listagem admin) ───────────────────────────────

export type PresentationSummaryStatus = "presented" | "ready";

export type AdminPresentationSummary = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  title: string;
  category: string;
  status: PresentationSummaryStatus;
  date: string;
  department: string;
  team: string;
  filters: PresentationFilters;
};

// ─── Integrações de API (listagem admin — legado) ─────────────────────────────

export type ApiIntegration = {
  id: string;
  name: string;
  status: IntegrationStatus;
  lastUpdated: string;
  tags: string[];
};

// ─── Diretório de funcionários ────────────────────────────────────────────────

export type EmployeeDirectoryEntry = {
  id: string;
  name: string;
  email: string;
  department: string;
  team: string;
  accessLevel: UserAccessLevel;
  status: AccountStatus;
};

export type NewEmployeePayload = {
  name: string;
  email: string;
  department: string;
  team: string;
};

// ─── Secretarias ─────────────────────────────────────────────────────────────

export type SecretariaEntry = {
  id: string;
  nome: string;
  setor: string;
};

export type NewSecretariaPayload = {
  nome: string;
  setor: string;
};

// ─── Times ───────────────────────────────────────────────────────────────────

export type TimeEntry = {
  id: string;
  nome: string;
  setor: string;
  secretariaId: string;
  secretariaNome: string;
};

export type NewTimePayload = {
  nome: string;
  setor: string;
  secretariaId: string;
};

// ─── Log de atividades ────────────────────────────────────────────────────────

export type ActivityLogCategory =
  | "Apresentações"
  | "Projetos"
  | "Templates"
  | "Usuários"
  | "Integrações"
  | "Aprovações"
  | "Compartilhamentos";

export type ActivityLogStatus = "success" | "error" | "warning";
export type ActivityUpdateType = "manual" | "automatic";

export type ActivityLogEntry = {
  // Campos originais (compatibilidade)
  id: string;
  timestamp: string;
  source: string;
  type: string;
  userName: string;
  department: string;
  team: string;

  // Campos novos (Fase 17)
  category?: ActivityLogCategory;
  action?: string;          // descrição legível da ação (substitui "type" como exibição principal)
  entityName?: string;      // nome da entidade afetada (apresentação, projeto, template…)
  entityType?: string;      // "apresentação" | "projeto" | "template" | "usuário" | …
  entityId?: string;        // para navegação futura
  userRole?: string;        // cargo legível: "Administrador Geral", "Editor" …
  status?: ActivityLogStatus;
  previousValue?: string;   // valor anterior (quando houver alteração de conteúdo)
  newValue?: string;        // novo valor
  updateType?: ActivityUpdateType;
  notes?: string;
};
