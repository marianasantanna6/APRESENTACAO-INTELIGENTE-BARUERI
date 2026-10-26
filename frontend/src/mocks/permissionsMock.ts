/**
 * Mock canônico: Permissões e Cargos
 *
 * Exporta as definições de cargo com suas permissões padrão.
 * Os services importam daqui. Componentes NÃO importam diretamente.
 */

import { ROLE_DEFINITIONS, ROLE_LABELS } from "../types/user";
import type { RoleDefinition, UserPermission, UserRole } from "../types/user";

export { ROLE_DEFINITIONS as roleDefinitionsMock };
export { ROLE_LABELS as roleLabelsMock };

// ─── Mapa de permissão → descrição legível ───────────────────────────────────

export type PermissionMeta = {
  id: UserPermission;
  label: string;
  description: string;
  group: string;
};

export const permissionsMock: PermissionMeta[] = [
  // Projetos
  { id: "view:projects", label: "Visualizar projetos", description: "Acessa a lista e o detalhe de projetos institucionais.", group: "Projetos" },
  { id: "create:projects", label: "Criar projetos", description: "Cadastra novos projetos institucionais.", group: "Projetos" },
  { id: "edit:projects", label: "Editar projetos", description: "Atualiza dados de projetos existentes.", group: "Projetos" },
  { id: "archive:projects", label: "Arquivar projetos", description: "Move projetos para o estado arquivado.", group: "Projetos" },
  // Apresentações
  { id: "view:presentations", label: "Visualizar apresentações", description: "Acessa a lista e o conteúdo de apresentações.", group: "Apresentações" },
  { id: "create:presentations", label: "Criar apresentações", description: "Monta novas apresentações com projetos e módulos.", group: "Apresentações" },
  { id: "edit:presentations", label: "Editar apresentações", description: "Modifica apresentações existentes.", group: "Apresentações" },
  { id: "delete:presentations", label: "Excluir apresentações", description: "Remove apresentações permanentemente.", group: "Apresentações" },
  { id: "share:presentations", label: "Compartilhar apresentações", description: "Gera links públicos e QR Codes.", group: "Apresentações" },
  { id: "present:presentations", label: "Apresentar", description: "Acessa o modo de apresentação em tela cheia.", group: "Apresentações" },
  // Templates
  { id: "view:templates", label: "Visualizar templates", description: "Acessa templates disponíveis.", group: "Templates" },
  { id: "create:templates", label: "Criar templates", description: "Cria novos templates de apresentação.", group: "Templates" },
  { id: "edit:templates", label: "Editar templates", description: "Modifica templates existentes.", group: "Templates" },
  // Analytics
  { id: "view:analytics", label: "Visualizar analytics", description: "Acessa métricas e relatórios da plataforma.", group: "Analytics" },
  { id: "export:analytics", label: "Exportar analytics", description: "Exporta dados de analytics em CSV/PDF.", group: "Analytics" },
  // Administração
  { id: "manage:users", label: "Gerenciar usuários", description: "Adiciona, edita e remove usuários.", group: "Administração" },
  { id: "manage:integrations", label: "Gerenciar integrações", description: "Configura e sincroniza fontes de dados.", group: "Administração" },
  { id: "manage:roles", label: "Gerenciar cargos", description: "Altera permissões e cargos de usuários.", group: "Administração" },
];

// ─── Agrupamento de permissões por cargo ─────────────────────────────────────

export function getPermissionsForRole(role: UserRole): PermissionMeta[] {
  const definition = ROLE_DEFINITIONS.find((d: RoleDefinition) => d.role === role);
  if (!definition) return [];
  return permissionsMock.filter((p) =>
    definition.defaultPermissions.includes(p.id),
  );
}
