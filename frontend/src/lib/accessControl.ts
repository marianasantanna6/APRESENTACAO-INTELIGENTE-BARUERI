import type { AuthSessionUser, UserAccessLevel } from "../types/auth";

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
    case "admin_level_2":
      return "Admin nível 2";
    case "admin_level_1":
      return "Admin nível 1";
    case "employee":
      return "Funcionário";
    default:
      return "Usuário";
  }
}
