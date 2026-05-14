import { mockPresentationApi } from "./mockPresentationApi";

/**
 * Implementacao de API ativa no frontend.
 *
 * Para integrar dados reais, troque este export para a nova implementacao sem
 * obrigar paginas e componentes a mudarem.
 */
export const presentationApi = mockPresentationApi;

export * from "./defaultPresentationFilters";
export * from "./mockPresentationApi";
export * from "./presentationApiContract";
export * from "./presentationMapper";
