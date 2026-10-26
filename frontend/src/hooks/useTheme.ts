import { useSystemPreferences } from "../context";
import type { ThemeMode } from "../context";

export function useTheme() {
  const {
    preferences,
    savedPreferences,
    savePreferences,
    updatePreference,
  } = useSystemPreferences();

  return {
    theme: preferences.theme,
    savedTheme: savedPreferences.theme,
    highContrast: preferences.highContrast,
    isDark: preferences.theme === "dark",
    hasPendingThemeChanges:
      preferences.theme !== savedPreferences.theme
      || preferences.highContrast !== savedPreferences.highContrast,
    setTheme: (nextTheme: ThemeMode) => {
      updatePreference("theme", nextTheme);
    },
    setHighContrast: (nextValue: boolean) => {
      updatePreference("highContrast", nextValue);
    },
    toggleTheme: () => {
      updatePreference(
        "theme",
        preferences.theme === "dark" ? "light" : "dark",
      );
    },
    saveThemePreferences: savePreferences,
  };
}
