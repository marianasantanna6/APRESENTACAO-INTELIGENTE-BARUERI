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

  if (!canCreatePresentations(user)) {
    return <Navigate to={ROUTE_PATHS.presentations} replace />;
  }

  return <Outlet />;
}
