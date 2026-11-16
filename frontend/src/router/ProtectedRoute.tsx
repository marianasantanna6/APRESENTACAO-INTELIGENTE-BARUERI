import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context";
import {
  canAccessAdminModules,
  canCreatePresentations,
} from "../lib/accessControl";
import { ROUTE_PATHS } from "./paths";

function isApproverInAnyTeam(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return false;
  if (user.teams && user.teams.length > 0) return user.teams.some((t) => t.approver);
  return !!user.approver;
}

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTE_PATHS.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTE_PATHS.login} replace />;
  }

  if (!canAccessAdminModules(user)) {
    return <Navigate to={ROUTE_PATHS.presentations} replace />;
  }

  return <Outlet />;
}

export function CreatePresentationRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTE_PATHS.login} replace />;
  }

  // Per-team check: allow if the user can create in at least one team
  if (!canCreatePresentations(user)) {
    return <Navigate to={ROUTE_PATHS.presentations} replace />;
  }

  return <Outlet />;
}

/** Approvers and managers can access the Teams screen */
export function ApproverRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTE_PATHS.login} replace />;
  }

  if (!isApproverInAnyTeam(user) && !canAccessAdminModules(user)) {
    return <Navigate to={ROUTE_PATHS.presentations} replace />;
  }

  return <Outlet />;
}
