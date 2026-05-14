import { presentationMockData } from "../../mocks/presentationMockData";
import type {
  PresentationData,
  PresentationFilters,
} from "../../types/presentation";
import { DEFAULT_PRESENTATION_FILTERS } from "./defaultPresentationFilters";
import { normalizePresentationData } from "./presentationMapper";
import type { PresentationApiContract } from "./presentationApiContract";

/**
 * Implementacao temporaria baseada em mocks locais.
 *
 * A UI nao depende mais do mock diretamente. Quando o backend real estiver
 * pronto, basta criar outra implementacao do contrato e trocar o export ativo
 * em `index.ts`.
 */
export const mockPresentationApi: PresentationApiContract = {
  getDefaultFilters(): PresentationFilters {
    return DEFAULT_PRESENTATION_FILTERS;
  },

  async getPresentationData(
    _filters: PresentationFilters,
  ): Promise<PresentationData> {
    return normalizePresentationData(presentationMockData);
  },
};
