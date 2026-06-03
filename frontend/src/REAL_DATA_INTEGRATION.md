# Guia de Integracao com Dados Reais

O frontend ja esta preparado para trocar mocks por backend real sem reescrever
os componentes.

## Fluxo atual

1. A pagina le os query params via `src/router/presentationSearchParams.ts`.
2. A pagina chama `usePresentationData` em `src/hooks/usePresentationData.ts`.
3. O hook consome `presentationApi` em `src/api/presentation/index.ts`.
4. A implementacao ativa hoje e `mockPresentationApi`.
5. O mock devolve `presentationMockData`.

## Status atual do login

O login esta temporariamente 100% frontend-driven:

1. `src/pages/LoginPage/LoginPage.tsx` chama `useAuth().login(...)`.
2. `src/context/AuthContext.tsx` valida a credencial diretamente no frontend.
3. A base inicial usada no login vem de `src/mocks/authMockData.ts`.
4. O estado salvo no `localStorage` continua alimentando perfil, senha e sessao.

## Status atual de configuracoes do sistema

A tela `src/pages/AdminConsolePage/AdminSettingsPage.tsx` tambem esta local por
enquanto:

1. tema, alto contraste e navegacao por teclado ja sao aplicados em tempo real
   pelo frontend;
2. a fonte dessas preferencias hoje e `src/context/SystemPreferencesContext.tsx`;
3. o salvamento atual vai para `localStorage`;
4. termos, privacidade e traducao com Google estao preparados apenas na UI;
5. a futura integracao com backend pode reaproveitar a mesma tela trocando
   apenas a origem dos dados e a acao de salvar.

### O que ainda falta para o login ficar 100% backend-driven

- endpoint de sessao/perfil no backend;
- payload do usuario autenticado retornado pelo backend;
- troca do perfil local em `AuthContext.tsx` por dados vindos da API.

## O que mudar para integrar backend real

### 1. Criar uma implementacao real da API

Sugestao de arquivo:

- `src/api/presentation/httpPresentationApi.ts`

Essa implementacao deve respeitar o contrato:

- `PresentationApiContract`

Arquivo do contrato:

- `src/api/presentation/presentationApiContract.ts`

### 2. Adaptar o payload externo

Nao passe o DTO do backend direto para a interface.

Adapte isso dentro da implementacao HTTP ou em um mapper dedicado, caso o
backend use nomes/estruturas diferentes do contrato da UI.

O retorno final deve respeitar:

- `PresentationData` em `src/types/presentation.ts`

### 3. Ativar a nova implementacao

No arquivo:

- `src/api/presentation/index.ts`

troque:

- `export const presentationApi = mockPresentationApi;`

por algo como:

- `export const presentationApi = httpPresentationApi;`

### 4. Evitar mexer nas paginas

Se a nova API continuar devolvendo `PresentationData`, as paginas abaixo devem
continuar funcionando com pouca ou nenhuma alteracao:

- `src/pages/CreatePresentationPage/CreatePresentationPage.tsx`
- `src/pages/GeneratedPresentationPage/GeneratedPresentationPage.tsx`
- `src/components/PresentationMode/PresentationModeOverlay.tsx`

### 5. Estados de loading e erro

A pagina de resultado ja trata:

- carregamento
- erro de integracao

Se a API real trouxer cenarios extras, amplie:

- `src/hooks/usePresentationData.ts`
- `src/pages/GeneratedPresentationPage/GeneratedPresentationPage.tsx`

### 6. Evolucao futura do login

Para concluir a migracao do login:

1. o backend deve retornar o usuario autenticado;
2. `AuthContext.tsx` deve parar de depender de `authMockData.ts`;
3. a integracao de login pode voltar para `src/api/` quando houver necessidade
   real de trafegar sessao via HTTP.

### 7. Checklist de payload esperado

Garanta que o backend entregue:

- filtros padrao: query, categoria, ano
- metricas de resumo do dashboard
- serie historica de IDH
- longevidade por regiao
- pilares do IDH por regiao
- ranking de UFs
- contribuicao relativa dos componentes
- distribuicao geografica por UF
- metadados e insights dos cards da apresentacao

### 7.1. Se o backend for persistir slides removidos

Hoje a exclusao de slides e local da sessao e fica em:

- `src/hooks/usePresentationDeck.ts`

Se o produto passar a salvar slides removidos no backend, o ideal e:

1. expor esse estado na resposta da API
2. adaptar o payload na camada `src/api/`
3. trocar a persistencia local do hook por chamadas da camada `src/api/`
4. manter os componentes de `src/components/PresentationMode/` sem mudanca estrutural

### 8. Se o backend usar nomes diferentes

Nao renomeie props em toda a UI.

Faça assim:

1. leia os campos brutos na implementacao da API
2. transforme na camada `src/api/presentation/`
3. devolva o contrato `PresentationData`

### 9. Validacao final

Depois da troca, execute:

```powershell
npm run build
```

Depois teste manualmente:

- landing page
- fluxo login -> criacao
- criacao -> resultado com query string
- renderizacao do dashboard
- renderizacao dos cards
- estados de loading e erro
