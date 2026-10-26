/**
 * Sistema de Permissões — Guards Puros (sem React)
 *
 * Aceita AuthSessionUser (sistema legado com accessLevel) e PlatformUser
 * (sistema novo com role) via tipo PermissionSubject.
 *
 * Regra de ouro: componentes chamam usePermissions() (hook).
 *                guards de rota chamam as funções diretamente.
 *                nenhum componente testa roles/levels inline.
 */

import type { UserRole, UserPermission } from "../types/user";
import type { UserAccessLevel } from "../types/auth";

// ─── Tipo de entrada unificado ───────────────────────────────────────────────

/**
 * Representa qualquer usuário autenticado, seja do sistema legado
 * (com accessLevel) ou do novo modelo (com role).
 */
export type PermissionSubject = {
  id: string;
  role?: UserRole;
  accessLevel?: UserAccessLevel;
  department?: string;
  permissions?: UserPermission[];
} | null;

// ─── Hierarquia de cargos ────────────────────────────────────────────────────

const ROLE_ORDER: UserRole[] = [
  "publico-externo",
  "apresentador",
  "revisor",
  "editor",
  "gestor-secretaria",
  "gestor-institucional",
  "administrador-geral",
];

/**
 * Converte accessLevel legado no cargo equivalente mais próximo.
 * admin_level_2 → administrador-geral
 * admin_level_1 → gestor-secretaria
 * employee      → editor
 */
function accessLevelToRole(level: UserAccessLevel): UserRole {
  switch (level) {
    case "admin_level_2": return "administrador-geral";
    case "admin_level_1": return "gestor-secretaria";
    default:              return "editor";
  }
}

/**
 * Resolve o cargo efetivo de qualquer tipo de usuário.
 */
export function resolveRole(user: PermissionSubject): UserRole | null {
  if (!user) return null;
  if (user.role) return user.role;
  if (user.accessLevel) return accessLevelToRole(user.accessLevel);
  return null;
}

/**
 * Verifica se o cargo do usuário está no nível mínimo exigido.
 * Considera a hierarquia: administrador-geral > gestor-institucional > … > publico-externo
 */
export function isAtLeastRole(user: PermissionSubject, minRole: UserRole): boolean {
  const role = resolveRole(user);
  if (!role) return false;
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(minRole);
}

/**
 * Verifica se o usuário tem exatamente um dos cargos especificados.
 */
export function hasRole(user: PermissionSubject, ...roles: UserRole[]): boolean {
  const role = resolveRole(user);
  if (!role) return false;
  return roles.includes(role);
}

/**
 * Verifica se o usuário tem uma permissão atômica específica.
 * Quando o user tem `permissions[]` explícito, usa esse array.
 * Caso contrário, infere pelo cargo.
 */
export function hasPermission(user: PermissionSubject, permission: UserPermission): boolean {
  if (!user) return false;
  if (user.permissions) return user.permissions.includes(permission);
  // Fallback: inferir pelo cargo
  const role = resolveRole(user);
  if (!role) return false;
  return ROLE_PERMISSION_MAP[role].includes(permission);
}

// ─── Mapa cargo → permissões (espelho de ROLE_DEFINITIONS) ──────────────────

const ROLE_PERMISSION_MAP: Record<UserRole, UserPermission[]> = {
  "administrador-geral": [
    "view:projects", "create:projects", "edit:projects", "archive:projects", "approve:projects", "validate:projects",
    "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
    "publish:presentations", "share:presentations", "present:presentations",
    "view:templates", "create:templates", "edit:templates", "configure:templates",
    "approve:content", "review:content",
    "view:analytics", "view:analytics:full", "export:analytics",
    "view:history", "view:history:full",
    "manage:users", "manage:permissions", "manage:integrations", "manage:roles",
  ],
  "gestor-institucional": [
    "view:projects", "create:projects", "edit:projects", "approve:projects", "validate:projects",
    "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
    "publish:presentations", "share:presentations", "present:presentations",
    "view:templates", "create:templates", "edit:templates",
    "approve:content", "review:content",
    "view:analytics", "view:analytics:full", "export:analytics",
    "view:history", "view:history:full",
  ],
  "gestor-secretaria": [
    "view:projects", "create:projects", "edit:projects", "approve:projects", "validate:projects",
    "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
    "share:presentations", "present:presentations",
    "view:templates", "create:templates", "edit:templates",
    "approve:content", "review:content",
    "view:analytics", "export:analytics",
    "view:history",
  ],
  "editor": [
    "view:projects", "create:projects", "edit:projects",
    "view:presentations", "create:presentations", "edit:presentations",
    "share:presentations", "present:presentations",
    "view:templates", "create:templates",
  ],
  "revisor": [
    "view:projects", "approve:projects", "validate:projects",
    "view:presentations", "present:presentations",
    "view:templates",
    "review:content",
    "view:analytics",
    "view:history",
  ],
  "apresentador": [
    "view:projects",
    "view:presentations", "create:presentations", "edit:presentations",
    "share:presentations", "present:presentations",
    "view:templates", "create:templates",
  ],
  "publico-externo": [
    "view:presentations",
  ],
};

// ─── Guards de Projetos ──────────────────────────────────────────────────────

export function canViewProjects(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "publico-externo") && resolveRole(user) !== "publico-externo";
}

export function canCreateProject(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "editor");
}

/**
 * Editores e gestores podem editar projetos.
 * Gestores de secretaria só editam projetos da própria secretaria.
 */
export function canEditProject(
  user: PermissionSubject,
  opts?: { projectDepartment?: string },
): boolean {
  if (!user) return false;
  const role = resolveRole(user);
  if (!role) return false;
  if (isAtLeastRole(user, "gestor-institucional")) return true;
  if (role === "gestor-secretaria") {
    if (!opts?.projectDepartment) return true; // sem contexto, permite
    return user.department === opts.projectDepartment;
  }
  return role === "editor";
}

export function canArchiveProject(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "gestor-secretaria");
}

export function canApproveContent(user: PermissionSubject): boolean {
  return hasRole(user, "revisor", "gestor-secretaria", "gestor-institucional", "administrador-geral");
}

export function canReviewContent(user: PermissionSubject): boolean {
  return hasRole(user, "revisor", "gestor-secretaria", "gestor-institucional", "administrador-geral");
}

export function canValidateContent(user: PermissionSubject): boolean {
  return hasRole(user, "revisor", "gestor-secretaria", "gestor-institucional", "administrador-geral");
}

// ─── Guards de Apresentações ─────────────────────────────────────────────────

export function canCreatePresentation(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canEditPresentation(
  user: PermissionSubject,
  opts?: { ownerUserId?: string },
): boolean {
  if (!user) return false;
  if (isAtLeastRole(user, "gestor-secretaria")) return true;
  if (opts?.ownerUserId && user.id === opts.ownerUserId) return true;
  return hasRole(user, "editor", "apresentador");
}

/**
 * canViewAllPresentations: vê apresentações de toda a organização (não só as próprias).
 */
export function canViewAllPresentations(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "gestor-secretaria");
}

export function canDeletePresentation(
  user: PermissionSubject,
  opts?: { ownerUserId?: string },
): boolean {
  if (!user) return false;
  if (isAtLeastRole(user, "gestor-institucional")) return true;
  if (isAtLeastRole(user, "gestor-secretaria")) return true;
  if (opts?.ownerUserId && user.id === opts.ownerUserId) return true;
  return false;
}

export function canPublishPresentation(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "gestor-institucional");
}

export function canSharePresentation(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canGeneratePublicLink(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canGenerateQrCode(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canUsePresentationMode(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

// ─── Guards de Templates ──────────────────────────────────────────────────────

export function canViewTemplates(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canSaveTemplate(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "apresentador");
}

export function canConfigureTemplates(user: PermissionSubject): boolean {
  return hasRole(user, "administrador-geral");
}

// ─── Guards de Analytics ──────────────────────────────────────────────────────

/**
 * canViewAnalytics: analytics básico da própria área.
 * canViewAnalytics com scope "full": analytics institucional completo.
 */
export function canViewAnalytics(
  user: PermissionSubject,
  opts?: { scope?: "basic" | "full" },
): boolean {
  if (!user) return false;
  if (opts?.scope === "full") return isAtLeastRole(user, "gestor-institucional");
  return hasRole(user, "revisor", "gestor-secretaria", "gestor-institucional", "administrador-geral");
}

export function canExportAnalytics(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "gestor-secretaria");
}

// ─── Guards de Histórico ──────────────────────────────────────────────────────

export function canViewVersionHistory(
  user: PermissionSubject,
  opts?: { scope?: "own" | "full" },
): boolean {
  if (!user) return false;
  if (opts?.scope === "full") return isAtLeastRole(user, "gestor-institucional");
  return isAtLeastRole(user, "revisor");
}

// ─── Guards de Administração ──────────────────────────────────────────────────

export function canAccessAdminPanel(user: PermissionSubject): boolean {
  return isAtLeastRole(user, "gestor-secretaria");
}

export function canManageUsers(user: PermissionSubject): boolean {
  return hasRole(user, "administrador-geral");
}

export function canManagePermissions(user: PermissionSubject): boolean {
  return hasRole(user, "administrador-geral");
}

export function canManageIntegrations(user: PermissionSubject): boolean {
  return hasRole(user, "administrador-geral");
}

export function canManageRoles(user: PermissionSubject): boolean {
  return hasRole(user, "administrador-geral");
}

