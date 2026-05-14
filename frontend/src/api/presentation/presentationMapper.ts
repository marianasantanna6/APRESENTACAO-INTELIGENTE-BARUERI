import type { PresentationData } from "../../types/presentation";

/**
 * Normaliza payloads externos para o contrato usado pela interface.
 *
 * Quando a API real chegar, adapte aqui o DTO do backend antes de devolver os
 * dados para o restante do frontend.
 */
export function normalizePresentationData(data: PresentationData) {
  return data;
}
