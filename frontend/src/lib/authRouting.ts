import { canAccessAdminModules, canCreatePresentations } from "./accessControl";
import type { AuthSessionUser } from "../types/auth";
import { ROUTE_PATHS } from "../router/paths";

export function getDefaultRouteForUser(_user: AuthSessionUser) {
  return ROUTE_PATHS.createPresentation;
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
