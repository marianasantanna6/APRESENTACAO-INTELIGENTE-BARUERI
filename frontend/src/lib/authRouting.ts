import { canAccessAdminModules, canCreatePresentations } from "./accessControl";
import type { AuthSessionUser } from "../types/auth";
import { ROUTE_PATHS } from "../router/paths";

export function getDefaultRouteForUser(user: AuthSessionUser) {
  // Pure approver (has approver role but cannot create) → approval queue
  if (!canCreatePresentations(user)) {
    return ROUTE_PATHS.teams;
  }
  // Everyone else lands on the presentations list, not directly on the create wizard
  return ROUTE_PATHS.presentations;
}

export function getPresentationsRouteForUser(_user: AuthSessionUser | null) {
  return ROUTE_PATHS.presentations;
}

export function canAccessPathForUser(
  user: AuthSessionUser,
  requestedPath: string,
) {
  if (
    requestedPath.startsWith(ROUTE_PATHS.presentations)
    || requestedPath.startsWith(ROUTE_PATHS.myAccount)
    || requestedPath.startsWith(ROUTE_PATHS.settings)
    || requestedPath.startsWith(ROUTE_PATHS.generatedPresentation)
    || requestedPath.startsWith(ROUTE_PATHS.adminProjects)
  ) {
    return true;
  }

  if (requestedPath.startsWith(ROUTE_PATHS.createPresentation)) {
    return canCreatePresentations(user);
  }

  if (
    requestedPath.startsWith(ROUTE_PATHS.adminData)
    || requestedPath.startsWith(ROUTE_PATHS.adminAdministration)
    || requestedPath === ROUTE_PATHS.adminRoot
  ) {
    return canAccessAdminModules(user);
  }

  return false;
}
