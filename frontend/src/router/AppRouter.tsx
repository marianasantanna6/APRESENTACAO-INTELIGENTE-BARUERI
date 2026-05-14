import { Navigate, Route, Routes } from "react-router-dom";
import CreatePresentationPage from "../pages/CreatePresentationPage";
import GeneratedPresentationPage from "../pages/GeneratedPresentationPage";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
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
      <Route
        path={ROUTE_PATHS.createPresentation}
        element={<CreatePresentationPage />}
      />
      <Route
        path={ROUTE_PATHS.generatedPresentation}
        element={<GeneratedPresentationPage />}
      />
      <Route path="*" element={<Navigate to={ROUTE_PATHS.home} replace />} />
    </Routes>
  );
}
