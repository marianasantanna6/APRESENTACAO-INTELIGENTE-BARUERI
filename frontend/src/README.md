# Arquitetura do Frontend

Esta pasta `src` foi organizada para que o time consiga substituir mocks por
dados reais sem reescrever a interface.

## Responsabilidade das pastas

- `assets/`: arquivos estaticos como imagens e logos.
- `api/`: camada de acesso a dados do frontend.
- `components/`: componentes reutilizaveis compartilhados.
- `context/`: sessao autenticada e estado compartilhado entre rotas.
- `hooks/`: hooks React que conectam paginas a `api`.
- `mocks/`: dados falsos usados apenas pela implementacao mock da `api`.
- `pages/`: telas de rota.
- `router/`: navegacao, caminhos e helpers de query string.
- `types/`: contratos de dominio compartilhados.

## Regras principais

- Paginas nao devem importar mocks diretamente.
- Navegacao deve usar `src/router/paths.ts`.
- Query params devem ser lidos/montados via `src/router/presentationSearchParams.ts`.
- Integracoes externas devem passar pela pasta `src/api/`.
- Tipos compartilhados devem nascer em `src/types/presentation.ts`.
- O viewer do modo apresentacao deve reutilizar `src/components/PresentationMode/`
  e `src/hooks/usePresentationDeck.ts` em vez de criar estado paralelo na pagina.

## Fluxo de login

O login real do frontend hoje percorre estas camadas:

1. A rota publica `/login` renderiza `src/pages/LoginPage/LoginPage.tsx`.
2. A pagina valida o formulario e chama `useAuth().login(...)`.
3. `src/context/AuthContext.tsx` delega a autenticacao HTTP para `src/api/auth/`.
4. `src/api/auth/httpAuthApi.ts` faz `fetch("/api/login")`.
5. O proxy do Vite reescreve `/api/login` para `http://localhost:3000/login`.
6. Depois que o backend aceita a credencial, o frontend monta a sessao local com
   base no perfil de `src/mocks/authMockData.ts` enquanto o backend ainda nao
   expoe um endpoint de perfil/sessao.

## Redirecionamento apos login

- Se a pessoa veio de uma rota protegida, `ProtectedRoute.tsx` salva o destino em
  `state.from`.
- `LoginPage.tsx` tenta devolver o usuario para esse caminho quando a permissao
  permite.
- Se nao houver destino anterior valido, o fluxo atual segue para `/criar`.

## Troca de mock por API real

1. Crie uma implementacao real em `src/api/presentation/`.
2. Normalize o payload externo em `presentationMapper.ts`.
3. Troque o export ativo em `src/api/presentation/index.ts`.
4. Preserve o contrato `PresentationData` para evitar retrabalho na UI.

## Viewer da apresentacao

O modo apresentacao agora tem uma camada propria no frontend:

- `src/components/PresentationMode/`: overlay, toolbar, miniaturas e cards clicaveis.
- `src/hooks/usePresentationDeck.ts`: controla slide ativo, exclusoes locais e estado do viewer.
- `src/hooks/useFullscreenElement.ts`: isola a integracao com a Fullscreen API.

Hoje a exclusao de slides fica apenas na sessao do navegador. Quando o backend
ganhar persistencia real, o ponto de troca natural e o hook
`usePresentationDeck.ts` junto com a camada `src/api/`.

Leituras recomendadas:

- `src/ARCHITECTURE.md`
- `src/REAL_DATA_INTEGRATION.md`
