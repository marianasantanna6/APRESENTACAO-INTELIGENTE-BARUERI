import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import i18next from "../lib/i18n";
import { useSystemPreferences } from "./SystemPreferencesContext";

/**
 * Mantém o idioma do i18next sincronizado com a preferência de idioma da UI
 * armazenada em SystemPreferencesContext.
 *
 * Deve ser renderizado dentro de SystemPreferencesProvider.
 */
export function I18nSyncProvider({ children }: PropsWithChildren) {
  const { preferences } = useSystemPreferences();

  useEffect(() => {
    if (i18next.language !== preferences.uiLanguage) {
      i18next.changeLanguage(preferences.uiLanguage);
    }
  }, [preferences.uiLanguage]);

  return <>{children}</>;
}
