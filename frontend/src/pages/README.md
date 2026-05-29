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

## Fluxo da LoginPage

`LoginPage` concentra apenas a interface e a orquestracao do login:

- valida `identifier` e `password` antes do submit;
- mostra estado de carregamento enquanto `useAuth().login(...)` esta em voo;
- exibe erros de autenticacao devolvidos pelo contexto;
- se o usuario ja estiver autenticado, redireciona para `state.from` quando a
  permissao permitir;
- se nao houver destino anterior valido, navega para `/criar`.

Observacoes do comportamento atual:

- o botao "Entrar com o GOV" ainda e somente visual;
- o checkbox "Lembrar de mim" ainda nao muda a persistencia da sessao.

## Observacao importante

`GeneratedPresentationPage` hoje tambem orquestra o modo apresentacao. A regra
e manter a interface do viewer em `src/components/PresentationMode/` e deixar na
pagina apenas a composicao com hooks e dados.
