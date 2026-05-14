import type { PresentationData } from "../types/presentation";

export type {
  ContributionItem,
  HistoricalPoint,
  PresentationCard,
  PresentationMockData,
  RankingItem,
  RegionMetric,
  RegionPillar,
  StateDistributionItem,
} from "../types/presentation";

/**
 * Mock local usado pela implementacao temporaria da camada de API.
 *
 * Este arquivo nao deve ser importado diretamente por paginas. Use a camada
 * `src/api/presentation` para manter a futura integracao centralizada.
 */
export const presentationMockData: PresentationData = {
  defaultQuery: "Índice de desenvolvimento humano no Brasil",
  defaultCategory: "Educação",
  defaultYear: "Todos",
  generatedAtLabel: "Atualizado com dados simulados em 12/05/2026 às 10:30",
  nationalIdh: 0.723,
  lifeExpectancy: 73.9,
  incomePerCapita: 19700,
  historicalIdh: [
    { year: 1991, value: 0.435 },
    { year: 2000, value: 0.612 },
    { year: 2010, value: 0.699 },
    { year: 2020, value: 0.723 },
  ],
  regionLongevity: [
    { region: "Norte", value: 75.1, color: "#facc15" },
    { region: "Nordeste", value: 74.3, color: "#fb923c" },
    { region: "Centro-Oeste", value: 76.8, color: "#60a5fa" },
    { region: "Sudeste", value: 77.2, color: "#a78bfa" },
    { region: "Sul", value: 77.6, color: "#34d399" },
  ],
  regionPillars: [
    { region: "Norte", longevity: 0.75, income: 0.69, education: 0.61 },
    { region: "Nordeste", longevity: 0.74, income: 0.67, education: 0.6 },
    { region: "Centro-Oeste", longevity: 0.79, income: 0.75, education: 0.69 },
    { region: "Sudeste", longevity: 0.8, income: 0.77, education: 0.71 },
    { region: "Sul", longevity: 0.81, income: 0.76, education: 0.72 },
  ],
  rankingTopIdh: [
    { label: "Distrito Federal", value: 0.824 },
    { label: "São Paulo", value: 0.783 },
    { label: "Santa Catarina", value: 0.774 },
    { label: "Rio de Janeiro", value: 0.762 },
    { label: "Paraná", value: 0.761 },
    { label: "Rio Grande do Sul", value: 0.758 },
    { label: "Mato Grosso do Sul", value: 0.754 },
    { label: "Goiás", value: 0.751 },
    { label: "Mato Grosso", value: 0.748 },
    { label: "Espírito Santo", value: 0.742 },
  ],
  contribution: [
    {
      label: "Educação",
      value: 37.37,
      color: "#4f7df3",
      note: "Maior impacto na evolução do índice nacional.",
    },
    {
      label: "Longevidade",
      value: 21.87,
      color: "#8b5cf6",
      note: "Pilar mais estável e consistente entre regiões.",
    },
    {
      label: "Renda do Trabalho",
      value: 24.25,
      color: "#f59e0b",
      note: "Explica grande parte da diferença entre estados líderes.",
    },
    {
      label: "Renda Complementar",
      value: 16.51,
      color: "#f97316",
      note: "Ajuda a sustentar crescimento nos polos urbanos.",
    },
  ],
  stateDistribution: [
    { uf: "RR", value: 0.709, region: "Norte", x: 20, y: 4 },
    { uf: "AP", value: 0.735, region: "Norte", x: 49, y: 7 },
    { uf: "AM", value: 0.721, region: "Norte", x: 13, y: 19 },
    { uf: "PA", value: 0.731, region: "Norte", x: 40, y: 18 },
    { uf: "AC", value: 0.719, region: "Norte", x: 6, y: 35 },
    { uf: "RO", value: 0.725, region: "Norte", x: 15, y: 41 },
    { uf: "TO", value: 0.738, region: "Norte", x: 49, y: 34 },
    { uf: "MA", value: 0.701, region: "Nordeste", x: 63, y: 24 },
    { uf: "PI", value: 0.697, region: "Nordeste", x: 68, y: 31 },
    { uf: "CE", value: 0.713, region: "Nordeste", x: 77, y: 28 },
    { uf: "RN", value: 0.719, region: "Nordeste", x: 87, y: 29 },
    { uf: "PB", value: 0.71, region: "Nordeste", x: 85, y: 34 },
    { uf: "PE", value: 0.719, region: "Nordeste", x: 80, y: 39 },
    { uf: "AL", value: 0.703, region: "Nordeste", x: 82, y: 45 },
    { uf: "SE", value: 0.71, region: "Nordeste", x: 84, y: 50 },
    { uf: "BA", value: 0.714, region: "Nordeste", x: 72, y: 46 },
    { uf: "MT", value: 0.748, region: "Centro-Oeste", x: 31, y: 41 },
    { uf: "MS", value: 0.754, region: "Centro-Oeste", x: 36, y: 57 },
    { uf: "GO", value: 0.751, region: "Centro-Oeste", x: 49, y: 49 },
    { uf: "DF", value: 0.824, region: "Centro-Oeste", x: 54, y: 53 },
    { uf: "MG", value: 0.74, region: "Sudeste", x: 63, y: 54 },
    { uf: "ES", value: 0.742, region: "Sudeste", x: 73, y: 59 },
    { uf: "RJ", value: 0.762, region: "Sudeste", x: 69, y: 64 },
    { uf: "SP", value: 0.783, region: "Sudeste", x: 56, y: 64 },
    { uf: "PR", value: 0.761, region: "Sul", x: 49, y: 75 },
    { uf: "SC", value: 0.774, region: "Sul", x: 52, y: 83 },
    { uf: "RS", value: 0.758, region: "Sul", x: 46, y: 92 },
  ],
  presentationCards: [
    {
      id: "idh-gauge",
      title: "IDH Brasil 2020: Consolidado do Desenvolvimento Alto",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Índice: 0,723, considerado alto na escala nacional.",
        "Síntese: o país consolidou um novo patamar de desenvolvimento humano.",
        "Destaque: avanço expressivo em educação e longevidade.",
      ],
    },
    {
      id: "national-summary",
      title: "Síntese nacional",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Vida: o Brasil apresentou expectativa de 73,9 anos.",
        "Renda: a média simulada chegou a R$19.700.",
        "Leitura: o avanço foi puxado por educação e acesso a serviços.",
      ],
    },
    {
      id: "evolution",
      title: "Evolução do IDH no Brasil (Anterior a 2010)",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Salto: o índice saiu de 0,435 para 0,723.",
        "Ritmo: crescimento médio de 46,4% em vinte anos.",
        "Motor: a maior melhora veio da redução da desigualdade educacional.",
      ],
    },
    {
      id: "map",
      title: "Distribuição Geográfica do IDH por UF",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Liderança: DF e São Paulo aparecem no topo do desenvolvimento.",
        "Desafio: os menores índices seguem concentrados no Norte e Nordeste.",
        "Convergência: essas regiões tiveram o maior avanço relativo recente.",
      ],
    },
    {
      id: "longevity",
      title: "Médias de Longevidade por Região",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Média: o recorte consolidado aponta 75,0 anos.",
        "Liderança: Sul e Sudeste seguem à frente em longevidade.",
        "Avanço: todas as regiões já superam o patamar de 74 anos.",
      ],
    },
    {
      id: "pillars",
      title: "Três Pilares do IDH por Região",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Longevidade: pilar mais forte em todas as regiões.",
        "Renda: principal fator de diferença entre Sul e Nordeste.",
        "Educação: cresce mais rápido e reduz disparidades.",
      ],
    },
    {
      id: "contribution",
      title: "Contribuição Relativa de cada componente para o IDH Nacional",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Educação: responde por 37,37% da evolução do índice.",
        "Longevidade: soma 21,87% e reforça estabilidade estrutural.",
        "Renda: contribui em duas frentes e sustenta ganho social.",
      ],
    },
    {
      id: "ranking",
      title: "Ranking de UFs - Top 10 Maiores IDH",
      source: "Fonte: base simulada da Prefeitura de Barueri",
      insights: [
        "Liderança: Distrito Federal segue na frente com 0,824.",
        "Elite: São Paulo e Santa Catarina completam o pódio.",
        "Predomínio: o top 10 segue concentrado nas regiões de maior renda.",
      ],
    },
  ],
};
