/**
 * Domínio: Histórico de Versões
 *
 * Registra cada alteração realizada em qualquer entidade gerenciada
 * pela plataforma. Permite auditoria completa e rollback quando necessário.
 */

// ─── Enumerações ────────────────────────────────────────────────────────────

export type EntityType =
  | "project"
  | "presentation"
  | "template"
  | "user"
  | "integration";

export type UpdateType =
  | "manual"          // edição direta pelo usuário na plataforma
  | "api-sync"        // sincronização automática via API externa
  | "spreadsheet"     // importação via planilha
  | "system";         // atualização gerada pelo próprio sistema

// ─── Entidade principal ──────────────────────────────────────────────────────

export type VersionHistoryEntry = {
  id: string;
  entityType: EntityType;
  entityId: string;
  previousValue: Record<string, unknown> | null;   // null na criação inicial
  newValue: Record<string, unknown>;
  changedBy: string;        // userId ou "system"
  changedAt: string;        // ISO 8601
  source: string;           // ex: "Portal SIT", "IBGE API", "Editor"
  sourceLink?: string;      // URL da fonte, se aplicável
  updateType: UpdateType;
  summary?: string;         // descrição legível da mudança
};

// ─── Filtros ─────────────────────────────────────────────────────────────────

export type VersionHistoryFilters = {
  entityType?: EntityType;
  entityId?: string;
  changedBy?: string;
  updateType?: UpdateType;
  startDate?: string;
  endDate?: string;
};
