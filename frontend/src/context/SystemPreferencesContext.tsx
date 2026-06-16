import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

export type SystemPreferences = {
  theme: ThemeMode;
  highContrast: boolean;
  keyboardNavigation: boolean;
};

type SavePreferencesResult =
  | { ok: true }
  | { ok: false; message: string };

type SystemPreferencesContextValue = {
  preferences: SystemPreferences;
  savedPreferences: SystemPreferences;
  hasPendingChanges: boolean;
  updatePreference: <Key extends keyof SystemPreferences>(
    key: Key,
    value: SystemPreferences[Key],
  ) => void;
  savePreferences: () => SavePreferencesResult;
};

export const SYSTEM_PREFERENCES_STORAGE_KEY =
  "barueri-inteligente:system-settings";
export const THEME_STORAGE_KEY = "theme";

export const defaultSystemPreferences: SystemPreferences = {
  theme: "light",
  highContrast: false,
  keyboardNavigation: false,
};

const SystemPreferencesContext = createContext<
  SystemPreferencesContextValue | undefined
>(undefined);

function arePreferencesEqual(
  left: SystemPreferences,
  right: SystemPreferences,
) {
  return (
    left.theme === right.theme
    && left.highContrast === right.highContrast
    && left.keyboardNavigation === right.keyboardNavigation
  );
}

function normalizeThemeMode(value: unknown): ThemeMode | null {
  return value === "dark" || value === "light" ? value : null;
}

export function readStoredSystemPreferences(): SystemPreferences {
  if (typeof window === "undefined") {
    return defaultSystemPreferences;
  }

  try {
    const rawPreferences = window.localStorage.getItem(
      SYSTEM_PREFERENCES_STORAGE_KEY,
    );
    const storedTheme = normalizeThemeMode(
      window.localStorage.getItem(THEME_STORAGE_KEY),
    );
    const parsedPreferences = rawPreferences
      ? (JSON.parse(rawPreferences) as Partial<SystemPreferences>)
      : null;
    const nextTheme = normalizeThemeMode(parsedPreferences?.theme) ?? storedTheme;

    return {
      ...defaultSystemPreferences,
      ...(parsedPreferences ?? {}),
      ...(nextTheme ? { theme: nextTheme } : {}),
    };
  } catch {
    return defaultSystemPreferences;
  }
}

export function applySystemPreferencesToDocument(
  preferences: SystemPreferences,
) {
  if (typeof document === "undefined") {
    return;
  }

  const { documentElement } = document;

  documentElement.setAttribute("data-theme", preferences.theme);
  documentElement.setAttribute(
    "data-contrast",
    preferences.highContrast ? "high" : "default",
  );
  documentElement.setAttribute(
    "data-keyboard-navigation",
    preferences.keyboardNavigation ? "enabled" : "disabled",
  );
  documentElement.classList.toggle(
    "keyboard-navigation",
    preferences.keyboardNavigation,
  );
  documentElement.style.colorScheme = preferences.highContrast
    || preferences.theme === "dark"
    ? "dark"
    : "light";
}

export function SystemPreferencesProvider({
  children,
}: PropsWithChildren) {
  const [savedPreferences, setSavedPreferences] = useState<SystemPreferences>(
    readStoredSystemPreferences,
  );
  const [preferences, setPreferences] = useState<SystemPreferences>(
    readStoredSystemPreferences,
  );

  useEffect(() => {
    applySystemPreferencesToDocument(preferences);
  }, [preferences]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key !== SYSTEM_PREFERENCES_STORAGE_KEY
        && event.key !== THEME_STORAGE_KEY
      ) {
        return;
      }

      const nextPreferences = readStoredSystemPreferences();
      setSavedPreferences(nextPreferences);
      setPreferences(nextPreferences);
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const contextValue = useMemo<SystemPreferencesContextValue>(() => ({
    preferences,
    savedPreferences,
    hasPendingChanges: !arePreferencesEqual(preferences, savedPreferences),
    updatePreference: (key, value) => {
      setPreferences((current) => ({
        ...current,
        [key]: value,
      }));
    },
    savePreferences: () => {
      if (typeof window === "undefined") {
        return { ok: true };
      }

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, preferences.theme);
        window.localStorage.setItem(
          SYSTEM_PREFERENCES_STORAGE_KEY,
          JSON.stringify(preferences),
        );
        setSavedPreferences(preferences);

        return { ok: true };
      } catch {
        return {
          ok: false,
          message: "Não foi possível salvar as configurações localmente.",
        };
      }
    },
  }), [preferences, savedPreferences]);

  return (
    <SystemPreferencesContext.Provider value={contextValue}>
      {children}
    </SystemPreferencesContext.Provider>
  );
}

export function useSystemPreferences() {
  const contextValue = useContext(SystemPreferencesContext);

  if (!contextValue) {
    throw new Error(
      "useSystemPreferences must be used within a SystemPreferencesProvider",
    );
  }

  return contextValue;
}
