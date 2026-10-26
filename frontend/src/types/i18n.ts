/**
 * Idiomas suportados pela interface do sistema.
 *
 * Separado de PresentationLanguage (types/institutionalPresentation.ts)
 * porque o idioma da UI e o idioma de uma apresentação são conceitos
 * independentes: um usuário pode operar a interface em inglês e criar
 * uma apresentação em português.
 */
export type UILanguage = "pt-BR" | "en-US" | "es";

export const UI_LANGUAGE_LABELS: Record<UILanguage, string> = {
  "pt-BR": "Português (BR)",
  "en-US": "English (US)",
  "es": "Español",
};

export const UI_LANGUAGE_NATIVE_LABELS: Record<UILanguage, string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "es": "Español",
};
