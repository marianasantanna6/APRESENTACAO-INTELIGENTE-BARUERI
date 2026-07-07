/**
 * permissionService — Regras de Permissão da Plataforma
 *
 * Os guards síncronos delegam para lib/permissions.ts.
 * Os métodos assíncronos expõem o catálogo de cargos e permissões.
 *
 * Para RBAC dinâmico via backend: implemente PermissionServiceContract
 * em realPermissionService.ts e troque o export abaixo.
 */

import { roleDefinitionsMock, permissionsMock, getPermissionsForRole } from "../mocks/permissionsMock";
import type { RoleDefinition, UserPermission, UserRole } from "../types/user";
import type { AuthSessionUser } from "../types/auth";
import type { PermissionMeta } from "../mocks/permissionsMock";
import * as guards from "../lib/permissions";
import type { PermissionSubject } from "../lib/permissions";

// ─── Contrato ─────────────────────────────────────────────────────────────────

export interface PermissionServiceContract {
  // Catálogo (assíncronos — prontos para substituição por fetch)
  getPermissions(): Promise<PermissionMeta[]>;
  getRoleDefinitions(): Promise<RoleDefinition[]>;
  getPermissionsForRole(role: UserRole): Promise<PermissionMeta[]>;

  // Guards síncronos — recebem AuthSessionUser para compatibilidade com contextos legados
  canAccessPlatform(user: AuthSessionUser | null): boolean;
  canViewProjects(user: AuthSessionUser | null): boolean;
  canCreateProject(user: AuthSessionUser | null): boolean;
  canEditProject(user: AuthSessionUser | null, projectDepartment?: string): boolean;
  canArchiveProject(user: AuthSessionUser | null): boolean;
  canApproveContent(user: AuthSessionUser | null): boolean;
  canReviewContent(user: AuthSessionUser | null): boolean;
  canCreatePresentation(user: AuthSessionUser | null): boolean;
  canViewAllPresentations(user: AuthSessionUser | null): boolean;
  canDeletePresentation(user: AuthSessionUser | null, ownerUserId?: string): boolean;
  canPublishPresentation(user: AuthSessionUser | null): boolean;
  canSharePresentation(user: AuthSessionUser | null): boolean;
  canAccessAdminArea(user: AuthSessionUser | null): boolean;
  canManageUsers(user: AuthSessionUser | null): boolean;
  canManageIntegrations(user: AuthSessionUser | null): boolean;
  canViewAnalytics(user: AuthSessionUser | null, scope?: "basic" | "full"): boolean;
  canExportAnalytics(user: AuthSessionUser | null): boolean;
  canViewVersionHistory(user: AuthSessionUser | null, scope?: "own" | "full"): boolean;
  hasPermission(user: AuthSessionUser | null, permission: UserPermission): boolean;
}

// ─── Adaptador AuthSessionUser → PermissionSubject ───────────────────────────

function adapt(user: AuthSessionUser | null): PermissionSubject {
  if (!user) return null;
  return { id: user.id, accessLevel: user.accessLevel, department: user.department };
}

// ─── Implementação mock ──────────────────────────────────────────────────────

const mockPermissionService: PermissionServiceContract = {
  async getPermissions() {
    await delay(150);
    return permissionsMock;
  },

  async getRoleDefinitions() {
    await delay(150);
    return roleDefinitionsMock;
  },

  async getPermissionsForRole(role) {
    await delay(100);
    return getPermissionsForRole(role);
  },

  canAccessPlatform: (user) => user !== null,
  canViewProjects:   (user) => guards.canViewProjects(adapt(user)),
  canCreateProject:  (user) => guards.canCreateProject(adapt(user)),
  canEditProject:    (user, dept) => guards.canEditProject(adapt(user), { projectDepartment: dept }),
  canArchiveProject: (user) => guards.canArchiveProject(adapt(user)),
  canApproveContent: (user) => guards.canApproveContent(adapt(user)),
  canReviewContent:  (user) => guards.canReviewContent(adapt(user)),

  canCreatePresentation:   (user)          => guards.canCreatePresentation(adapt(user)),
  canViewAllPresentations: (user)          => guards.canViewAllPresentations(adapt(user)),
  canDeletePresentation:   (user, ownerId) => guards.canDeletePresentation(adapt(user), { ownerUserId: ownerId }),
  canPublishPresentation:  (user)          => guards.canPublishPresentation(adapt(user)),
  canSharePresentation:    (user)          => guards.canSharePresentation(adapt(user)),

  canAccessAdminArea:     (user) => guards.canAccessAdminPanel(adapt(user)),
  canManageUsers:         (user) => guards.canManageUsers(adapt(user)),
  canManageIntegrations:  (user) => guards.canManageIntegrations(adapt(user)),

  canViewAnalytics:     (user, scope) => guards.canViewAnalytics(adapt(user), { scope }),
  canExportAnalytics:   (user)        => guards.canExportAnalytics(adapt(user)),
  canViewVersionHistory:(user, scope) => guards.canViewVersionHistory(adapt(user), { scope }),

  hasPermission: (user, permission) => guards.hasPermission(adapt(user), permission),
};

export const permissionService: PermissionServiceContract = mockPermissionService;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
