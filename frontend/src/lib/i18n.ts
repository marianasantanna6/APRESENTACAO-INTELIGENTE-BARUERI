import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "../locales/en-US";
import ptBR from "../locales/pt-BR";
import es from "../locales/es";

i18next.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    "en-US": { translation: enUS },
    es: { translation: es },
  },
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18next;
