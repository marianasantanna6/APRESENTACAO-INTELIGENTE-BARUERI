import type { PresentationFilters } from "../../types/presentation";

/**
 * Valores padrão compartilhados pelo fluxo de criação/resultado.
 *
 * Esses valores são sincronizados e servem para inicializar formulário e
 * leitura de query params sem depender de requisição de rede.
 */
export const DEFAULT_PRESENTATION_FILTERS: PresentationFilters = {
  query: "Índice de desenvolvimento humano no Brasil",
  category: "Educação",
  year: "Todos",
};
