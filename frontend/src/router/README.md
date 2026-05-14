# Router

Tudo relacionado a navegacao do frontend fica aqui.

## Arquivos

- `paths.ts`: constantes de rotas.
- `AppRouter.tsx`: arvore central do React Router.
- `presentationSearchParams.ts`: helpers para ler e montar a query string da pagina de resultado.

## Regras

- Evite strings de rota hardcoded em componentes.
- Sempre use `ROUTE_PATHS` para links e redirecionamentos.
- Se os nomes dos query params mudarem, ajuste primeiro `presentationSearchParams.ts`.
