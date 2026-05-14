/**
 * Contratos de dominio canonicos do fluxo de apresentacao/dashboard.
 *
 * Estes tipos devem permanecer independentes de framework para que UI, mocks,
 * hooks e adaptadores da API compartilhem o mesmo contrato.
 */

export type HistoricalPoint = {
  year: number;
  value: number;
};

export type RegionMetric = {
  region: string;
  value: number;
  color: string;
};

export type RegionPillar = {
  region: string;
  longevity: number;
  income: number;
  education: number;
};

export type RankingItem = {
  label: string;
  value: number;
};

export type ContributionItem = {
  label: string;
  value: number;
  color: string;
  note: string;
};

export type StateDistributionItem = {
  uf: string;
  value: number;
  region: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  x: number;
  y: number;
};

export type PresentationCardId =
  | "idh-gauge"
  | "national-summary"
  | "evolution"
  | "map"
  | "longevity"
  | "pillars"
  | "contribution"
  | "ranking";

export type PresentationCard = {
  id: PresentationCardId;
  title: string;
  source: string;
  insights: string[];
};

export type PresentationData = {
  defaultQuery: string;
  defaultCategory: string;
  defaultYear: string;
  generatedAtLabel: string;
  nationalIdh: number;
  lifeExpectancy: number;
  incomePerCapita: number;
  historicalIdh: HistoricalPoint[];
  regionLongevity: RegionMetric[];
  regionPillars: RegionPillar[];
  rankingTopIdh: RankingItem[];
  contribution: ContributionItem[];
  stateDistribution: StateDistributionItem[];
  presentationCards: PresentationCard[];
};

/**
 * Alias de compatibilidade mantido durante a migracao de nomes antigos
 * orientados a mock.
 */
export type PresentationMockData = PresentationData;

export type PresentationFilters = {
  query: string;
  category: string;
  year: string;
};
