import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScrollReveal from "./components/ScrollReveal";
import { useAuth, useSystemPreferences } from "./context";
import {
  canAccessAdminModules,
  canCreatePresentations,
} from "./lib/accessControl";
import { AppRouter } from "./router";
import { ROUTE_PATHS } from "./router/paths";

function SystemPreferencesRuntime() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { preferences } = useSystemPreferences();
  const canSeeCreateFlow = canCreatePresentations(user);
  const canSeeAdminModules = canAccessAdminModules(user);

  useEffect(() => {
    if (!preferences.keyboardNavigation || !isAuthenticated) {
      return;
    }

    function handleKeyboardShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || Boolean(target?.isContentEditable);

      if (
        isTypingTarget
        || !event.altKey
        || event.ctrlKey
        || event.metaKey
        || event.shiftKey
      ) {
        return;
      }

      let nextPath: string | null = null;

      if (event.key === "1") {
        nextPath = ROUTE_PATHS.presentations;
      } else if (event.key === "2") {
        nextPath = ROUTE_PATHS.myAccount;
      } else if (event.key === "3") {
        nextPath = ROUTE_PATHS.settings;
      } else if (event.key === "4" && canSeeCreateFlow) {
        nextPath = ROUTE_PATHS.createPresentation;
      } else if (event.key === "5" && canSeeAdminModules) {
        nextPath = ROUTE_PATHS.adminData;
      }

      if (!nextPath || nextPath === location.pathname) {
        return;
      }

      event.preventDefault();
      navigate(nextPath);
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [
    isAuthenticated,
    location.pathname,
    navigate,
    canSeeAdminModules,
    canSeeCreateFlow,
    preferences.keyboardNavigation,
  ]);
  
  return null;
}

function App() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Pular para o conteudo principal
      </a>
      <SystemPreferencesRuntime />
      <ScrollReveal />
      <AppRouter />
    </div>
  );
}

export default App;
