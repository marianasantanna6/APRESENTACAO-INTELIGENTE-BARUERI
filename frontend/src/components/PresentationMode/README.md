# PresentationMode

Esta pasta concentra a experiencia de exibicao da apresentacao.

## Componentes

- `PresentationGridCard.tsx`: card clicavel da grade principal, com abrir solo e excluir.
- `PresentationModeOverlay.tsx`: viewer em tela cheia com palco principal, atalhos e miniaturas.
- `PresentationModeToolbar.tsx`: barra superior do viewer com navegacao, fullscreen e exclusao.
- `PresentationThumbnailRail.tsx`: faixa horizontal com miniaturas dos slides.

## Regra de integracao futura

A exclusao de slides hoje e local da sessao e usa `sessionStorage` via
`src/hooks/usePresentationDeck.ts`.

Quando existir persistencia real no backend, o time deve manter estes
componentes e trocar apenas a implementacao do hook/camada `api`.
