import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import {
  applySystemPreferencesToDocument,
  AuthProvider,
  readStoredSystemPreferences,
  SystemPreferencesProvider,
} from "./context";
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
        <AuthProvider>
          <App />
        </AuthProvider>
      </SystemPreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
);
