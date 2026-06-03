import { Navigate, Route, Routes } from "react-router-dom";
import {
  AdminAdministrationPage,
  AdminConsoleLayout,
  AdminDataPage,
  AdminMyAccountPage,
  AdminProjectsPage,
  AdminSettingsPage,
} from "../pages/AdminConsolePage";
import CreatePresentationPage from "../pages/CreatePresentationPage";
import GeneratedPresentationPage from "../pages/GeneratedPresentationPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import {
  AdminRoute,
  CreatePresentationRoute,
  ProtectedRoute,
} from "./ProtectedRoute";
import { ROUTE_PATHS } from "./paths";

/**
 * Arvore central de navegacao do frontend.
 *
 * Toda nova pagina deve ser registrada aqui e deve reutilizar os caminhos
 * definidos em `paths.ts`.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.home} element={<LandingPage />} />
      <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminConsoleLayout />}>
          <Route
            path={ROUTE_PATHS.presentations}
            element={<AdminProjectsPage />}
          />
          <Route
            path={ROUTE_PATHS.myAccount}
            element={<AdminMyAccountPage />}
          />
          <Route
            path={ROUTE_PATHS.settings}
            element={<AdminSettingsPage />}
          />
          <Route
            path={ROUTE_PATHS.adminProjects}
            element={<Navigate to={ROUTE_PATHS.presentations} replace />}
          />
          <Route element={<AdminRoute />}>
            <Route
              path={ROUTE_PATHS.adminRoot}
              element={<Navigate to={ROUTE_PATHS.presentations} replace />}
            />
            <Route path={ROUTE_PATHS.adminData} element={<AdminDataPage />} />
            <Route
              path={ROUTE_PATHS.adminAdministration}
              element={<AdminAdministrationPage />}
            />
          </Route>
        </Route>
        <Route element={<CreatePresentationRoute />}>
          <Route
            path={ROUTE_PATHS.createPresentation}
            element={<CreatePresentationPage />}
          />
        </Route>
        <Route
          path={ROUTE_PATHS.generatedPresentation}
          element={<GeneratedPresentationPage />}
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTE_PATHS.home} replace />} />
    </Routes>
  );
}
