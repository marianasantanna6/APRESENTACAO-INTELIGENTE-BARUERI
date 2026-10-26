/**
 * Domínio: Fontes de Integração
 *
 * Representa as fontes externas e internas que alimentam dados da plataforma.
 * Cada IntegrationSource tem um tipo, status e responsável designado.
 */

// ─── Enumerações ────────────────────────────────────────────────────────────

export type IntegrationSourceType =
  | "api"               // API REST/GraphQL externa
  | "spreadsheet"       // planilha Excel/CSV importada manualmente
  | "manual"            // cadastro manual direto na plataforma
  | "internal-system";  // sistema interno da Prefeitura

export type IntegrationStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "error";

// ─── Fontes nomeadas (catálogo oficial) ──────────────────────────────────────

export const INTEGRATION_SOURCE_NAMES = [
  "Portal SIT",
  "IBGE",
  "SEADE",
  "Atlas do Desenvolvimento Humano",
  "dados.gov.br",
  "Sistemas Internos Autorizados",
  "Planilha",
  "Cadastro Manual",
] as const;

export type IntegrationSourceName =
  (typeof INTEGRATION_SOURCE_NAMES)[number];

// ─── Entidade principal ──────────────────────────────────────────────────────

export type IntegrationSource = {
  id: string;
  name: IntegrationSourceName | string;   // string permite fontes não catalogadas
  type: IntegrationSourceType;
  url?: string;
  status: IntegrationStatus;
  lastSync?: string;    // ISO 8601
  responsible: string;  // nome ou userId do responsável
  description: string;
};

// ─── Payloads de mutação ─────────────────────────────────────────────────────

export type NewIntegrationPayload = Omit<IntegrationSource, "id" | "lastSync">;

export type UpdateIntegrationPayload = Partial<
  Omit<IntegrationSource, "id">
>;
