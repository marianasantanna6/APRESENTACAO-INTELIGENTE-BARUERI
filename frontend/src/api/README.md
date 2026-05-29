# API

Esta pasta concentra a comunicacao do frontend com fontes externas de dados.

## Estrutura atual

- `auth/`: autenticacao HTTP do login.
- `presentation/`: camada de dados da tela de criacao + dashboard + cards.

## Regras

- Paginas nao devem importar mocks diretamente.
- Hooks e componentes devem consumir a camada `api`.
- Mapeamentos de DTO do backend devem acontecer dentro da propria camada de API.
- Ao trocar mocks por backend real, a mudanca principal deve acontecer aqui.

## Fluxo atual de autenticacao

- `src/api/auth/authApiContract.ts` define o contrato `login(input)`.
- `src/api/auth/httpAuthApi.ts` implementa esse contrato via `fetch`.
- O endpoint padrao do frontend e `/api/login`.
- Em desenvolvimento, o proxy do Vite reescreve `/api/*` para o backend em
  `http://localhost:3000/*`.

## Responsabilidades da camada auth

- centralizar URL base, `fetch`, parse e mensagens de erro;
- impedir que `LoginPage` ou `AuthContext` conhecam detalhes de HTTP;
- permitir trocar a implementacao no futuro sem reescrever a tela de login.

## Limite atual da integracao

Hoje o backend autentica a credencial, mas ainda nao entrega um payload completo
de sessao/perfil. Por isso, apos o sucesso do `POST /login`, o `AuthContext`
ainda monta o perfil localmente com base em `src/mocks/authMockData.ts`.
