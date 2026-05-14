import type { PresentationFilters } from "../types/presentation";

/**
 * Monta a query string usada pela pagina de resultado.
 */
export function buildPresentationSearchParams(filters: PresentationFilters) {
  return new URLSearchParams({
    q: filters.query,
    categoria: filters.category,
    ano: filters.year,
  });
}

/**
 * Le filtros da URL e aplica os valores padrao quando algum parametro nao
 * estiver presente.
 */
export function readPresentationFiltersFromSearchParams(
  searchParams: URLSearchParams,
  defaults: PresentationFilters,
): PresentationFilters {
  return {
    query: searchParams.get("q") ?? defaults.query,
    category: searchParams.get("categoria") ?? defaults.category,
    year: searchParams.get("ano") ?? defaults.year,
  };
}
