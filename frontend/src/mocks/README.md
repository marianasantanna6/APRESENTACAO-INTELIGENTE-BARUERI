# Mocks

Mocks sao apenas apoio de desenvolvimento.

## Arquivo atual

- `presentationMockData.ts`

## Regras

- Nao importe mocks diretamente nas paginas.
- Consuma dados mockados atraves da camada `src/api/`.
- Se o contrato da UI mudar, atualize primeiro `src/types/presentation.ts` e
  depois ajuste o mock.
