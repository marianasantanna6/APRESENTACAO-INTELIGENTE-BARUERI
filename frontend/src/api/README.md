# API

Esta pasta concentra a comunicacao do frontend com fontes externas de dados.

## Estrutura atual

- `presentation/`: camada de dados da tela de criacao + dashboard + cards.

## Regras

- Paginas nao devem importar mocks diretamente.
- Hooks e componentes devem consumir a camada `api`.
- Mapeamentos de DTO do backend devem acontecer dentro da propria camada de API.
- Ao trocar mocks por backend real, a mudanca principal deve acontecer aqui.

## Fluxo atual de autenticacao

- `src/context/AuthContext.tsx` valida o login diretamente no frontend.
- A base inicial usada vem de `src/mocks/authMockData.ts`.
- Ajustes locais continuam persistidos no `localStorage`.

## Observacao

- Hoje a pasta `api/` concentra apenas o fluxo de apresentacao.
- Se o login voltar a trafegar por HTTP no futuro, a camada de auth pode ser
  recriada aqui sem precisar alterar as paginas.
