/**
 * accessControl.ts — Camada de compatibilidade
 *
 * As novas checagens de permissão vivem em lib/permissions.ts.
 * Este arquivo mantém as funções antigas para que os componentes
 * existentes continuem funcionando sem nenhuma mudança.
 */

import type { AuthSessionUser, UserAccessLevel } from "../types/auth";

// ─── Funções legadas (preservadas) ───────────────────────────────────────────

export function isAdminAccessLevel(accessLevel: UserAccessLevel) {
  return accessLevel !== "employee";
}

export function canCreatePresentations(user: AuthSessionUser | null) {
  return Boolean(user);
}

export function canAccessAdminModules(user: AuthSessionUser | null) {
  return Boolean(user && isAdminAccessLevel(user.accessLevel));
}

export function canManageEmployees(user: AuthSessionUser | null) {
  return user?.accessLevel === "admin_level_2";
}

export function canViewCrossTeamData(user: AuthSessionUser | null) {
  return user?.accessLevel === "admin_level_2";
}

export function getAccessLevelLabel(accessLevel?: UserAccessLevel) {
  switch (accessLevel) {
    case "admin_level_2": return "Admin nível 2";
    case "admin_level_1": return "Admin nível 1";
    case "employee":      return "Funcionário";
    default:              return "Usuário";
  }
}

// ─── Re-exports do novo sistema ───────────────────────────────────────────────

export {
  resolveRole,
  isAtLeastRole,
  hasRole,
  hasPermission,
  canViewProjects,
  canCreateProject,
  canEditProject,
  canArchiveProject,
  canApproveContent,
  canReviewContent,
  canValidateContent,
  canCreatePresentation,
  canEditPresentation,
  canViewAllPresentations,
  canDeletePresentation,
  canPublishPresentation,
  canSharePresentation,
  canGeneratePublicLink,
  canGenerateQrCode,
  canUsePresentationMode,
  canViewTemplates,
  canSaveTemplate,
  canConfigureTemplates,
  canViewAnalytics,
  canExportAnalytics,
  canViewVersionHistory,
  canAccessAdminPanel,
  canManageUsers,
  canManagePermissions,
  canManageIntegrations,
  canManageRoles,
} from "./permissions";

export type { PermissionSubject } from "./permissions";
