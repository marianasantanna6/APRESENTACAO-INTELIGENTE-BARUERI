import type {
  PresentationData,
  PresentationFilters,
} from "../../types/presentation";

/**
 * Contrato da camada de API consumida pelas paginas e hooks do frontend.
 *
 * A implementacao concreta pode usar mocks, fetch, axios, GraphQL ou qualquer
 * outra estrategia, desde que respeite esse contrato.
 */
export interface PresentationApiContract {
  getPresentationData(
    filters: PresentationFilters,
  ): Promise<PresentationData> | PresentationData;
}
