/**
 * usePermissions — hook React que expõe os guards de permissão
 * para o usuário da sessão atual.
 *
 * Uso:
 *   const { canEditProject, canManageUsers } = usePermissions();
 *   if (canEditProject({ projectDepartment: "Saúde" })) { ... }
 */

import * as P from "../lib/permissions";
import type { PermissionSubject } from "../lib/permissions";
import type { UserRole } from "../types/user";
import type { UserAccessLevel } from "../types/auth";
import { useAuth } from "../context/AuthContext";

function toSubject(
  user: { id: string; accessLevel: UserAccessLevel; role?: string; department?: string } | null,
): PermissionSubject {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role as UserRole | undefined,
    accessLevel: user.accessLevel,
    department: user.department,
  };
}

export function usePermissions() {
  const { user } = useAuth();
  const subject = toSubject(user);

  return {
    // ── Utilitários
    resolvedRole: P.resolveRole(subject),

    // ── Projetos
    canViewProjects:    () => P.canViewProjects(subject),
    canCreateProject:   () => P.canCreateProject(subject),
    canEditProject:     (opts?: { projectDepartment?: string }) => P.canEditProject(subject, opts),
    canArchiveProject:  () => P.canArchiveProject(subject),
    canApproveContent:  () => P.canApproveContent(subject),
    canReviewContent:   () => P.canReviewContent(subject),
    canValidateContent: () => P.canValidateContent(subject),

    // ── Apresentações
    canCreatePresentation:  () => P.canCreatePresentation(subject),
    canEditPresentation:    (opts?: { ownerUserId?: string }) => P.canEditPresentation(subject, opts),
    canViewAllPresentations: () => P.canViewAllPresentations(subject),
    canDeletePresentation:  (opts?: { ownerUserId?: string }) => P.canDeletePresentation(subject, opts),
    canPublishPresentation: () => P.canPublishPresentation(subject),
    canSharePresentation:   () => P.canSharePresentation(subject),
    canGeneratePublicLink:  () => P.canGeneratePublicLink(subject),
    canGenerateQrCode:      () => P.canGenerateQrCode(subject),
    canUsePresentationMode: () => P.canUsePresentationMode(subject),

    // ── Templates
    canViewTemplates:      () => P.canViewTemplates(subject),
    canSaveTemplate:       () => P.canSaveTemplate(subject),
    canConfigureTemplates: () => P.canConfigureTemplates(subject),

    // ── Analytics
    canViewAnalytics:    (opts?: { scope?: "basic" | "full" }) => P.canViewAnalytics(subject, opts),
    canExportAnalytics:  () => P.canExportAnalytics(subject),

    // ── Histórico
    canViewVersionHistory: (opts?: { scope?: "own" | "full" }) => P.canViewVersionHistory(subject, opts),

    // ── Administração
    canAccessAdminPanel:    () => P.canAccessAdminPanel(subject),
    canManageUsers:         () => P.canManageUsers(subject),
    canManagePermissions:   () => P.canManagePermissions(subject),
    canManageIntegrations:  () => P.canManageIntegrations(subject),
    canManageRoles:         () => P.canManageRoles(subject),

    // ── Genérico
    hasPermission: (permission: Parameters<typeof P.hasPermission>[1]) =>
      P.hasPermission(subject, permission),
  } as const;
}
