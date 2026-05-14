# Inventario da Estrutura

Este documento descreve o papel dos principais arquivos do frontend para que o
grupo saiba exatamente onde mexer em rotas, dados, mocks e componentes.

## Arquivos raiz

- `src/main.tsx`: bootstrap do React e montagem da aplicacao.
- `src/App.tsx`: shell principal que monta animacoes globais e o `AppRouter`.
- `src/index.css`: estilos globais, animacoes e utilitarios visuais.
- `src/vite-env.d.ts`: tipos do ambiente Vite.
- `src/README.md`: visao geral da arquitetura.
- `src/ARCHITECTURE.md`: este inventario.
- `src/REAL_DATA_INTEGRATION.md`: guia de integracao com dados reais.

## Assets

- `src/assets/images/create-logo.png`: logo principal usada no projeto.
- `src/assets/images/login-gov.png`: arte do botao de login GOV.

## Tipos

- `src/types/presentation.ts`: contrato canonico do fluxo de dashboard/apresentacao.
- `src/types/README.md`: orientacoes da camada de tipos.

## Router

- `src/router/paths.ts`: constantes de caminhos do frontend.
- `src/router/AppRouter.tsx`: arvore central de navegacao.
- `src/router/presentationSearchParams.ts`: leitura e escrita dos query params da tela de resultado.
- `src/router/index.ts`: barrel da camada de navegacao.
- `src/router/README.md`: convencoes da camada `router`.

## Hooks

- `src/hooks/usePresentationData.ts`: hook que carrega dados da apresentacao pela camada `api`.
- `src/hooks/usePresentationDeck.ts`: estado local do viewer, slide ativo e exclusoes da sessao.
- `src/hooks/useFullscreenElement.ts`: integracao isolada com a Fullscreen API.
- `src/hooks/index.ts`: barrel da pasta.
- `src/hooks/README.md`: convencoes dos hooks.

## API

- `src/api/presentation/defaultPresentationFilters.ts`: filtros padrao do fluxo de criacao/resultado.
- `src/api/presentation/presentationApiContract.ts`: contrato da camada de API.
- `src/api/presentation/mockPresentationApi.ts`: implementacao temporaria baseada em mock.
- `src/api/presentation/presentationMapper.ts`: ponto de normalizacao de DTO externo -> contrato interno.
- `src/api/presentation/index.ts`: export da implementacao ativa.
- `src/api/README.md`: convencoes da camada `api`.

## Mocks

- `src/mocks/presentationMockData.ts`: dataset local usado pela implementacao mock.
- `src/mocks/README.md`: regras de uso dos mocks.

## Pages

- `src/pages/LandingPage/LandingPage.tsx`: tela inicial da aplicacao.
- `src/pages/LoginPage/LoginPage.tsx`: tela de login.
- `src/pages/CreatePresentationPage/CreatePresentationPage.tsx`: tela de criacao e selecao de filtros.
- `src/pages/GeneratedPresentationPage/GeneratedPresentationPage.tsx`: tela de dashboard, cards gerados e orquestracao do viewer da apresentacao.
- `src/pages/README.md`: convencoes das paginas.

## Componentes compartilhados

- `src/components/Navbar.tsx`: cabecalho da landing page.
- `src/components/HeroSection.tsx`: hero da landing page.
- `src/components/CategoriesSection.tsx`: bloco de categorias da landing.
- `src/components/FeaturesSection.tsx`: bloco de funcionalidades.
- `src/components/StepsSection.tsx`: bloco de etapas.
- `src/components/ScrollReveal.tsx`: controlador das animacoes com IntersectionObserver.
- `src/components/SectionHeader.tsx`: helper de titulo de secao.

## Layout da pagina gerada

- `src/components/DashboardSection.tsx`: composicao do layout do dashboard.
- `src/components/PresentationCardsSection.tsx`: composicao da grade de cards da apresentacao.
- `src/components/PresentationMode/*`: modo apresentacao com fullscreen, miniaturas e exclusao.

## DashboardCards

- `src/components/DashboardCards/NationalIdhCard.tsx`: card do gauge de IDH.
- `src/components/DashboardCards/LifeExpectancyCard.tsx`: card de expectativa de vida.
- `src/components/DashboardCards/IncomePerCapitaCard.tsx`: card de renda per capita.
- `src/components/DashboardCards/EvolutionIdhCard.tsx`: card da evolucao historica do IDH.
- `src/components/DashboardCards/StateDistributionCard.tsx`: card da distribuicao geografica.
- `src/components/DashboardCards/RankingTopIdhCard.tsx`: card do ranking.
- `src/components/DashboardCards/RegionLongevityCard.tsx`: card da longevidade por regiao.
- `src/components/DashboardCards/RegionPillarsCard.tsx`: card dos tres pilares por regiao.
- `src/components/DashboardCards/ContributionCard.tsx`: card da contribuicao relativa.
- `src/components/DashboardCards/types.ts`: tipos compartilhados dos cards do dashboard.
- `src/components/DashboardCards/index.ts`: barrel da pasta.

## DashboardWidgets

- `src/components/DashboardWidgets/DonutGauge.tsx`: gauge circular do IDH.
- `src/components/DashboardWidgets/EvolutionCardChart.tsx`: grafico de area/linha da evolucao do IDH.
- `src/components/DashboardWidgets/RegionBars.tsx`: grafico de barras da longevidade por regiao.
- `src/components/DashboardWidgets/GroupedBars.tsx`: grafico agrupado dos pilares do IDH.
- `src/components/DashboardWidgets/HorizontalRanking.tsx`: ranking horizontal.
- `src/components/DashboardWidgets/ContributionBars.tsx`: composicao empilhada de contribuicoes.
- `src/components/DashboardWidgets/BrazilIdhMap.tsx`: visao geografica baseada em scatter plot.
- `src/components/DashboardWidgets/DashboardMetric.tsx`: shell visual de um card do dashboard.
- `src/components/DashboardWidgets/PresentationPreview.tsx`: shell de preview dos cards de apresentacao.
- `src/components/DashboardWidgets/PresentationCardShell.tsx`: shell estrutural de card/slides.
- `src/components/DashboardWidgets/InsightList.tsx`: renderizacao de insights textuais.
- `src/components/DashboardWidgets/LegendDot.tsx`: marcador visual de legenda.
- `src/components/DashboardWidgets/chartShared.tsx`: helpers compartilhados dos graficos.
- `src/components/DashboardWidgets/index.ts`: barrel da pasta.
- `src/components/DashboardWidgets.tsx`: barrel de compatibilidade.

## PresentationCards

- `src/components/PresentationCards/IdhGaugeCard.tsx`: card da apresentacao para o gauge.
- `src/components/PresentationCards/NationalSummaryCard.tsx`: card de sintese nacional.
- `src/components/PresentationCards/EvolutionPresentationCard.tsx`: card da evolucao do IDH.
- `src/components/PresentationCards/MapPresentationCard.tsx`: card da distribuicao geografica.
- `src/components/PresentationCards/LongevityPresentationCard.tsx`: card da longevidade por regiao.
- `src/components/PresentationCards/PillarsPresentationCard.tsx`: card dos pilares do IDH.
- `src/components/PresentationCards/ContributionPresentationCard.tsx`: card das contribuicoes.
- `src/components/PresentationCards/RankingPresentationCard.tsx`: card do ranking de UFs.
- `src/components/PresentationCards/PresentationSlide.tsx`: renderer unico dos slides em grade, palco e miniatura.
- `src/components/PresentationCards/registry.tsx`: mapa central entre `card.id` e componente visual.
- `src/components/PresentationCards/types.ts`: tipos compartilhados dos cards da apresentacao.
- `src/components/PresentationCards/index.ts`: barrel da pasta.

## Onde mexer em cada caso

- Nova rota/tela: `src/router/paths.ts` e `src/router/AppRouter.tsx`
- Mudanca na query string do resultado: `src/router/presentationSearchParams.ts`
- Integracao com API real: `src/api/presentation/`
- Tipos de negocio: `src/types/presentation.ts`
- Dashboard visual: `src/components/DashboardCards/` e `src/components/DashboardWidgets/`
- Cards de apresentacao: `src/components/PresentationCards/`
- Viewer da apresentacao e exclusao de slides: `src/components/PresentationMode/` e `src/hooks/usePresentationDeck.ts`
