import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import {
  applySystemPreferencesToDocument,
  AuthProvider,
  I18nSyncProvider,
  readStoredSystemPreferences,
  SystemPreferencesProvider,
} from "./context";
// Inicializa i18next antes da renderização
import "./lib/i18n";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

applySystemPreferencesToDocument(readStoredSystemPreferences());

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <SystemPreferencesProvider>
        <I18nSyncProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nSyncProvider>
      </SystemPreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
);
