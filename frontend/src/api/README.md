# API

Esta pasta concentra a comunicacao do frontend com fontes externas de dados.

## Estrutura atual

- `presentation/`: camada de dados da tela de criacao + dashboard + cards.

## Regras

- Paginas nao devem importar mocks diretamente.
- Hooks e componentes devem consumir a camada `api`.
- Mapeamentos de DTO do backend devem acontecer dentro da propria camada de API.
- Ao trocar mocks por backend real, a mudanca principal deve acontecer aqui.
