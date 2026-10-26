# Gerador de apresentações a partir de pesquisa

Este serviço Python recebe um tema, pesquisa a Wikipédia em português, recupera pesquisas anteriores por similaridade no Supabase/pgvector, gera slides estruturados com Gemini e entrega JSON e um PowerPoint (`.pptx`). A interface HTTP é consumida pelo backend Node.js; o frontend comunica somente com o backend.

## Fluxo da pesquisa até o arquivo

1. **Entrada — `src/api.py` ou `src/main.py`:** o backend envia `tema` para `POST /research`; o CLI continua disponível para execução manual. A função `generate_research(tema)` coordena o fluxo e retorna os dados validados, o caminho do PPTX e o estado da busca RAG.

2. **Recuperação RAG — `services/supabase_service.py`:** a consulta é convertida para embedding com o modelo configurado e buscada por similaridade no PostgreSQL/pgvector. A busca exige o mesmo `embedding_model`, vetor de 1536 dimensões, pontuação mínima de 0,25 e metadados de fonte; aceita filtros opcionais por `source` e `intent`.

3. **Pesquisa atual — `services/wiki_service.py`:** remove palavras comuns da busca, consulta a API da Wikipédia e tenta obter resumos de até cinco páginas. Cada página utilizável vira uma `ResearchSource` com ID, título, URL, trecho, data/hora UTC da consulta e metadados disponíveis (descrição, idioma, ID da página, última edição e dados de imagem/localização, quando retornados); os resultados atuais são combinados com fontes RAG sem duplicar URLs ou trechos idênticos.

4. **Memória e geração — `services/supabase_service.py`, `prompts/academic_prompt.py`, `chains/research_chain.py`, `services/llm_service.py`:** uma nova pesquisa atual é salva junto com a lista completa de fontes para futuras recuperações. O prompt envia ao Gemini apenas as fontes verificáveis atuais e recuperadas e pede JSON com título, slides, IDs de fonte e limitações.

5. **Validação — `services/presentation_service.py`:** confere o JSON, os layouts, os limites de conteúdo e os IDs de fontes. Verifica também citações literais, organiza capa e encerramento e anexa os metadados de referência; respostas inválidas podem receber uma tentativa de correção.

6. **Entrega — `services/pptx_generator.py`:** renderiza os slides 16:9 segundo `estiliza_o_e_configura_o_pptx.md`, adiciona a página de referências e salva o `.pptx` em `output/`.

Na versão atual, a única integração externa de pesquisa encontrada no código é a Wikipédia em português. APIs governamentais adicionais ainda não estão implementadas; o serviço não apresenta dados dessas fontes como se já estivessem conectadas.

## Responsabilidades dos serviços

| Arquivo | Operação principal | Entrada → saída |

| `src/services/wiki_service.py` | Busca e coleta fontes da Wikipédia. | Tema → `ResearchData` ou `None` |

| `src/services/research_context.py` | Combina resultados atuais e memórias RAG, removendo URLs e trechos duplicados e mantendo os IDs das fontes. | Tema, pesquisa atual e memórias → contexto com referências |

| `src/services/supabase_service.py` | Persiste pesquisa, embedding e metadados das fontes; cria embedding da consulta e recupera memórias compatíveis por similaridade. | Pesquisa ou consulta → registro salvo ou lista ordenada de memórias |

| `src/services/llm_service.py` | Cria o cliente Gemini com o modelo e timeout configurados. | Nome do modelo → cliente de chat |

| `src/services/presentation_service.py` | Valida e normaliza o contrato de apresentação vindo do modelo. | JSON e fontes verificadas → apresentação pronta para renderização |

| `src/services/pptx_generator.py` | Desenha e salva os slides PowerPoint e a página de referências. | Apresentação validada → caminho do `.pptx` |

| `src/utils/retries.py` | Repete chamadas temporariamente falhas com limite, espera exponencial, jitter e suporte a `Retry-After`. | Operação externa → resultado ou erro final |

## Integração com backend e frontend

### Iniciar localmente

Com Python 3.15 instalado, a partir da raiz do projeto no PowerShell:

```powershell
py -3.15 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r src\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000
```

No Linux/macOS, use `python3.15 -m venv .venv` e `.venv/bin/python -m uvicorn api:app --app-dir src --host 127.0.0.1 --port 8000`. O serviço escuta em `127.0.0.1:8000` para desenvolvimento local; `GET /health` deve retornar `{"status":"ok"}`. O arquivo `.python-version` registra o alvo informado: `3.15.0`.

### Endpoints implementados

#### `GET /health`

Verifica se o processo está ativo. Não testa Gemini, Wikipédia nem Supabase.

Resposta `200 application/json`:

```json
{"status":"ok"}
```

#### `POST /research`

Recebe uma pergunta/tema, executa a pesquisa e a geração síncrona, e devolve o JSON validado dos slides com um identificador para baixar o PowerPoint.

Requisição `application/json`:

```json
{"tema":"Como políticas públicas reduzem a evasão escolar?"}
```

`tema` é obrigatório, texto de 1 a 300 caracteres. A resposta `200 application/json` segue esta estrutura (o conteúdo dos slides e as fontes variam conforme a pesquisa):

```json
{
  "presentation_id":"f8b2a4d1-7474-4b0f-bef8-67a4064a6531",
  "presentation":{
    "titulo":"POLÍTICAS PÚBLICAS E EVASÃO ESCOLAR",
    "subtitulo":"",
    "slides":[{"tipo_layout":"capa","titulo":"POLÍTICAS PÚBLICAS","fontes":[]}],
    "fontes":[],
    "limitacoes":[]
  },
  "download_url":"/presentations/f8b2a4d1-7474-4b0f-bef8-67a4064a6531",
  "rag":{"status":"used","memories_retrieved":2}
}
```

`rag.status` pode ser `used`, `no_results`, `no_new_sources` ou `unavailable`. `memories_retrieved` conta os registros de pesquisa encontrados; fontes repetidas por URL ou trecho idêntico são removidas do contexto. Estados sem RAG são explicitados também em `presentation.limitacoes`.

Erros: `422` para tema inválido; `502` quando fontes verificáveis ou a geração não puderem ser concluídas. As chamadas são síncronas e o tempo total varia com os provedores e retries; o backend deve usar timeout de vários minutos ou, para uma experiência com progresso e filas, implementar essa orquestração no seu próprio serviço.

#### `GET /presentations/{presentation_id}`

Baixa o arquivo criado pela pesquisa. O identificador precisa ser o UUID recebido em `POST /research`; o serviço responde `200` com `application/vnd.openxmlformats-officedocument.presentationml.presentation`, ou `404` quando o PPTX não está no diretório local `output/`.

O backend chama `http://127.0.0.1:8000` quando ambos estão no mesmo host. Em contêineres ou hospedagem separada, deve usar o nome/endereço privado definido pela equipe de implantação; não existe variável de ambiente de URL de backend ou frontend no código Python.

### Segurança e hospedagem

A API não implementa autenticação, rate limit ou fila. Mantenha-a em `localhost` durante o desenvolvimento e, em hospedagem, exponha-a somente em rede privada ao backend; restrinja tráfego por firewall/rede e use HTTPS no proxy de borda. O backend aplica autenticação, limites de requisição e timeouts. Nunca envie chaves do Gemini ao frontend ou nos logs. Evite expor a porta Python diretamente à internet.

## Contrato de dados dos slides

O modelo retorna um objeto com `titulo`, `subtitulo`, `slides` e `limitacoes`. Cada slide descreve `tipo_layout`, `titulo`, texto de apoio, pontos, KPIs, tags, blocos, citação, reconhecimentos e `fontes` (IDs como `fonte_01`). O conjunto de layouts e limites visuais é derivado do guia `estiliza_o_e_configura_o_pptx.md`; URLs e títulos completos das fontes são anexados pelo validador usando os dados coletados, e a página de referências é montada pelo gerador.

Cada item de `presentation.fontes[]` na resposta HTTP contém `id`, `titulo`, `url` e `trecho`; quando disponíveis, também contém `consultado_em` (data/hora UTC ISO 8601) e `metadados` (objeto com os campos realmente retornados pela Wikipédia, como `description`, `lang`, `pageid` e `timestamp`, que indica a última edição da página). Esses campos são persistidos junto das fontes no Supabase e mantidos quando uma fonte reaparece em resultados RAG; registros antigos continuam sem os campos que não guardaram.

`ResearchData.to_chain_input()` converte os dados da pesquisa para as chaves esperadas pelo prompt (`titulo`, `detectar_intencao`, `fontes_fornecidas`). `validate_presentation()` converte a resposta do modelo para o formato canônico usado por `criar_apresentacao()`.


## RAG e migração de dados

A migração `002` adiciona `sources` como JSONB e cria `search_research_memories`, que filtra por modelo de embedding, filtros opcionais de fonte/intenção e similaridade mínima. Consultas e documentos usam o mesmo `EMBEDDING_MODEL`; o código valida a compatibilidade com `vector(1536)` antes de gravar ou buscar. A gravação calcula um hash estável e reutiliza o embedding pronto quando conteúdo e modelo coincidem; pesquisas pendentes ou vetores de outro modelo recebem o embedding necessário.

As linhas criadas antes da migração recebem `sources=[]`: o esquema antigo guardava somente a URL da primeira página, apesar de agregar trechos de várias páginas no conteúdo. Para não atribuir afirmações a referências incompletas, a busca RAG ignora essas linhas. Elas não são apagadas nem reindexadas; novas pesquisas após a migração preservam a lista completa de fontes e passam a ser recuperáveis.

Quando uma nova consulta repete exatamente o conteúdo de um registro pronto, o sistema reaproveita o embedding existente. Se esse registro antigo ainda não possuir a lista de fontes, a nova coleta pode preencher os metadados validados sem recalcular o vetor.

Uma pontuação mínima de `0.25` é o valor inicial da busca, não uma avaliação calibrada para todos os temas. A relevância real, os filtros e a cobertura precisam ser avaliados com dados do projeto. Se a migração `002` ou a conexão falhar, a apresentação pode continuar com fontes atuais e informa `rag.status=unavailable`; isso não significa que a recuperação foi bem-sucedida.


## Estrutura relevante

```text
src/
  api.py                   # fluxo de execução e tentativas de geração/correção
  chains/                  # composição do prompt, modelo e parser JSON
  config/                  # configurações, guia visual e estilos
  models/                  # estruturas de pesquisa e fontes
  prompts/                 # instruções e contrato JSON para o modelo
  services/                # Wikipédia, Supabase, Gemini, validação e PPTX
  utils/                   # detecção de intenção e extração de palavras-chave
```
