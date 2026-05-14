# Paginas

`src/pages` concentra as telas de rota do frontend.

## Regras

- Cada pasta representa uma tela principal.
- `index.ts` deve exportar a tela para simplificar imports.
- Componentes compartilhados devem ser importados diretamente de `src/components/`.
- Crie `components/` dentro de uma pagina apenas quando existir UI exclusiva
  daquela tela.

## Paginas atuais

- `LandingPage`
- `LoginPage`
- `CreatePresentationPage`
- `GeneratedPresentationPage`

## Observacao importante

`GeneratedPresentationPage` hoje tambem orquestra o modo apresentacao. A regra
e manter a interface do viewer em `src/components/PresentationMode/` e deixar na
pagina apenas a composicao com hooks e dados.
