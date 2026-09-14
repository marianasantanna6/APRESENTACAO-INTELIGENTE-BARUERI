import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context";
import {
  canAccessAdminModules,
  canCreatePresentations,
} from "../lib/accessControl";
import { ROUTE_PATHS } from "./paths";

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

  // Approvers have no access to admin modules — send them to their screen
  if (user.approver) {
    return <Navigate to={ROUTE_PATHS.teams} replace />;
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

  // Approvers cannot create presentations
  if (user.approver) {
    return <Navigate to={ROUTE_PATHS.teams} replace />;
  }

  if (!canCreatePresentations(user)) {
    return <Navigate to={ROUTE_PATHS.presentations} replace />;
  }

  return <Outlet />;
}

/** Only approvers can access the Teams approval screen */
export function ApproverRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTE_PATHS.login} replace />;
  }

  if (!user.approver) {
    // Non-approvers get sent to their natural home
    return <Navigate to={ROUTE_PATHS.createPresentation} replace />;
  }

  return <Outlet />;
}
