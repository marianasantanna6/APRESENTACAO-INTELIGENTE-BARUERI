# Hooks

Os hooks conectam paginas/componentes a camada `api`.

## Hook atual

- `usePresentationData.ts`: carrega os dados da tela de resultado via `presentationApi`.
- `usePresentationDeck.ts`: controla slide ativo, exclusao local e modo deck/solo.
- `useFullscreenElement.ts`: encapsula a Fullscreen API para o viewer.

## Regra

Prefira colocar logica de carga de dados aqui em vez de misturar chamadas
assincronas diretamente nas paginas.

Estados de interface complexos, como o viewer da apresentacao, tambem podem
ficar aqui quando precisarem ser reaproveitados por mais de um componente.
