# Router

Tudo relacionado a navegacao do frontend fica aqui.

## Arquivos

- `paths.ts`: constantes de rotas.
- `AppRouter.tsx`: arvore central do React Router.
- `ProtectedRoute.tsx`: guardas de autenticacao e permissao.
- `presentationSearchParams.ts`: helpers para ler e montar a query string da pagina de resultado.

## Regras

- Evite strings de rota hardcoded em componentes.
- Sempre use `ROUTE_PATHS` para links e redirecionamentos.
- Se os nomes dos query params mudarem, ajuste primeiro `presentationSearchParams.ts`.

## Rota de login

- `ROUTE_PATHS.login` aponta para `/login`.
- `AppRouter.tsx` registra essa rota como publica.
- `ProtectedRoute.tsx` intercepta acessos nao autenticados e redireciona para
  `/login`.
- Nesse redirecionamento, a rota original fica guardada em `state.from` para que
  o login tente devolver o usuario ao destino correto depois da autenticacao.

## Rotas protegidas

- `ProtectedRoute`: exige sessao autenticada para apresentacoes, conta,
  configuracoes, criacao e resultado.
- `AdminRoute`: libera `/admin`, `/admin/dados` e
  `/admin/administracao` apenas para perfis administrativos.
- `CreatePresentationRoute`: protege `/criar`, embora no estado atual qualquer
  usuario autenticado possa acessar essa tela.

## Rotas da area logada

- `ROUTE_PATHS.presentations`: dashboard principal autenticado.
- `ROUTE_PATHS.myAccount`: perfil da pessoa autenticada.
- `ROUTE_PATHS.settings`: preferencias locais do sistema em `/configuracoes`.
- `ROUTE_PATHS.adminData` e `ROUTE_PATHS.adminAdministration`: modulos
  restritos a perfis administrativos.
