# Documentação do Projeto — Apresentação Inteligente Barueri

> **Para novos membros do grupo:** leia este documento inteiro antes de mexer no código.
> Ele explica o que foi feito, como tudo se conecta e como contribuir sem quebrar nada.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Rotas e Páginas](#4-rotas-e-páginas)
5. [Autenticação e Usuários de Teste](#5-autenticação-e-usuários-de-teste)
6. [Sistema de Permissões (RBAC)](#6-sistema-de-permissões-rbac)
7. [Wizard de Criação de Apresentações](#7-wizard-de-criação-de-apresentações)
8. [Projetos Institucionais](#8-projetos-institucionais)
9. [Editor de Projetos](#9-editor-de-projetos)
10. [Console Administrativo](#10-console-administrativo)
11. [Módulos de Apresentação](#11-módulos-de-apresentação)
12. [Sistema de Dados (Mocks → Services)](#12-sistema-de-dados-mocks--services)
13. [Como Publicar / Fluxo de Status](#13-como-publicar--fluxo-de-status)
14. [Templates de Apresentação](#14-templates-de-apresentação)
15. [Compartilhamento](#15-compartilhamento)
16. [Analytics](#16-analytics)
17. [Log de Atividades — Centro de Auditoria](#17-log-de-atividades--centro-de-auditoria)
18. [Internacionalização (i18n)](#18-internacionalização-i18n)
19. [Acessibilidade](#19-acessibilidade)
20. [Como Contribuir](#20-como-contribuir)

---

## 1. Visão Geral do Projeto

A **Apresentação Inteligente Barueri** é uma plataforma web que permite servidores da Prefeitura de Barueri criarem apresentações institucionais personalizadas a partir do acervo de projetos municipais.

### Fluxo principal do usuário

```
Login → Wizard de Criação → Selecionar Projetos → Configurar Módulos → Apresentação Gerada
```

### O que a plataforma faz

- **Criar apresentações** a partir de projetos do acervo municipal com 3 passos
- **Gerenciar projetos** institucionais com identidade, indicadores, ODS, mídia, prêmios
- **Controlar acesso** por cargo (quem pode criar, quem pode publicar, quem pode gerenciar)
- **Modo apresentação** full-screen para exibição em eventos e visitas técnicas
- **Console administrativo** para gestão de usuários, integrações e dados

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Função |
|---|---|---|
| React | 19 | Interface do usuário |
| TypeScript | 5+ | Tipagem estática |
| Tailwind CSS | v4 | Estilização utility-first |
| Vite | 6 | Build e dev server (HMR) |
| React Router | v7 | Roteamento SPA |
| React Icons | — | Ícones (Fi = Feather, Fa = FontAwesome) |

**Não há backend real ainda.** Todos os dados são simulados em memória via `services/` com delay artificial de 300ms para simular latência de rede.

---

## 3. Estrutura de Pastas

```
frontend/src/
├── components/          → Componentes reutilizáveis
│   ├── AdminConsole/    → Painel admin (avatar, status chips)
│   ├── DashboardCards/  → Cards de dados do IDH (legado)
│   ├── DashboardWidgets/→ Gráficos e visualizações de dados
│   ├── InstitutionalPresenterMode/ → Modo de apresentação full-screen
│   ├── InstitutionalProjects/      → Cards, filtros, modal de projetos
│   ├── PresentationCards/          → Slides de apresentação IDH
│   ├── PresentationMode/           → Toolbar e overlay de apresentação
│   └── ProjectEditor/              → Editor de projetos em seções
│       ├── sections/    → 7 seções independentes do editor
│       ├── useProjectEditor.ts → Hook central de estado do editor
│       ├── EditorShared.tsx    → Primitivos compartilhados (SectionCard, TagInput…)
│       └── ProjectEditor.tsx   → Layout do editor (overlay full-screen)
│
├── pages/
│   ├── AdminConsolePage/    → Layout e subpáginas do console (/apresentacoes, /projetos…)
│   ├── CreatePresentationPage/ → Wizard de 3 etapas (/criar)
│   ├── GeneratedPresentationPage/ → Resultado + modo apresentação (/criar/resultado)
│   ├── InstitutionalProjectsPage/ → (dentro de AdminConsolePage via router)
│   ├── LandingPage/         → Página inicial pública (/)
│   └── LoginPage/           → Login (/login)
│
├── services/            → Camada de acesso a dados (substitui API)
├── mocks/               → Dados simulados centralizados
├── types/               → Contratos TypeScript de todas as entidades
├── hooks/               → Hooks customizados (usePermissions, etc.)
├── lib/                 → Lógica pura sem React (permissions, accessControl)
├── constants/           → Constantes globais (categorias, access levels)
├── utils/               → Funções utilitárias (slugify, validators)
├── modules/             → Barrel exports por domínio
├── router/              → AppRouter.tsx, paths.ts, ProtectedRoute.tsx
└── context/             → Contextos React (AuthContext)
```

---

## 4. Rotas e Páginas

### Rotas definidas em `router/paths.ts`

| Rota | Componente | Acesso |
|---|---|---|
| `/` | `LandingPage` | Público |
| `/login` | `LoginPage` | Público |
| `/criar` | `CreatePresentationPage` | `canCreatePresentations()` |
| `/criar/resultado` | `GeneratedPresentationPage` | Autenticado |
| `/apresentacoes` | `AdminProjectsPage` | Autenticado |
| `/projetos` | `InstitutionalProjectsPage` | `canViewProjects()` |
| `/templates` | `TemplatesPage` | Autenticado |
| `/analytics` | `AnalyticsPage` | `canViewAnalytics()` (Admin/Gestor) |
| `/minha-conta` | `AdminMyAccountPage` | Autenticado |
| `/configuracoes` | `AdminSettingsPage` | Autenticado |
| `/admin/dados` | `AdminDataPage` | Admin |
| `/admin/administracao` | `AdminAdministrationPage` | Admin |

### Proteção de rotas (`router/ProtectedRoute.tsx`)

- `<ProtectedRoute>` — qualquer usuário autenticado
- `<AdminRoute>` — apenas `administrador-geral` e `gestor-institucional`
- `<CreatePresentationRoute>` — verifica `canCreatePresentations(user)`

---

## 5. Autenticação e Usuários de Teste

O login é feito por **username + senha** (não e-mail). O sistema verifica contra `mocks/usersMock.ts`.

### Credenciais de teste disponíveis

| Usuário | Username | Senha | Cargo | Secretaria |
|---|---|---|---|---|
| Marina Justus | `admin.nivel2` | `barueri123` | Administrador Geral | Gabinete de Dados |
| Rafael Mendonça | `gestor.institucional` | `barueri123` | Gestor Institucional | Gabinete de Dados |
| João Lemes | `admin.nivel1` | `barueri123` | Gestor de Secretaria | Planejamento |
| Bianca Souza | `editor.demo` | `barueri123` | Editor | Planejamento |
| Carlos Francisco | `revisor.demo` | `barueri123` | Revisor | Recursos Humanos |

> **Dica para testar permissões:** logue como `editor.demo` e veja o que fica bloqueado,
> depois como `admin.nivel2` e compare.

### Bridge de compatibilidade de `accessLevel`

O sistema legado usava `accessLevel` (string). O RBAC novo usa `role`. A conversão é automática:

```
"admin_level_2"  → administrador-geral / gestor-institucional
"admin_level_1"  → gestor-secretaria
"employee"       → editor / revisor / apresentador (definido pelo campo `role`)
```

---

## 6. Sistema de Permissões (RBAC)

### Os 7 Cargos (do maior para o menor acesso)

| Cargo | Quem é | O que pode fazer |
|---|---|---|
| `administrador-geral` | TI / coordenação técnica | Tudo: gerencia usuários, integrações, cargos |
| `gestor-institucional` | Secretário / diretoria | Aprova conteúdo, analytics completo, publica apresentações |
| `gestor-secretaria` | Coordenador de secretaria | Gerencia projetos e apresentações da sua secretaria |
| `editor` | Servidor técnico | Cria e edita projetos e apresentações |
| `revisor` | Analista de conteúdo | Revisa conteúdo, devolve ou valida |
| `apresentador` | Servidor de eventos | Monta e exibe apresentações, gera QR e link público |
| `publico-externo` | Parceiro / visitante | Acessa apenas via link público compartilhado |

### Como verificar permissões no código

**Em componentes React** — use o hook `usePermissions()`:

```tsx
import { usePermissions } from "../../hooks/usePermissions";

function MeuComponente() {
  const perms = usePermissions();

  // Projetos
  if (perms.canCreateProject()) { /* mostrar botão "Novo Projeto" */ }
  if (perms.canEditProject({ projectDepartment: "Saúde" })) { /* mostrar editar */ }
  if (perms.canApproveContent()) { /* mostrar botão "Publicar" */ }

  // Apresentações
  if (perms.canCreatePresentations()) { /* botão criar */ }
  if (perms.canPublishPresentation()) { /* publicar */ }

  // Admin
  if (perms.canManageUsers()) { /* aba de usuários no admin */ }
  if (perms.canAccessAdminPanel()) { /* entrar no painel admin */ }
}
```

**Em guards de rota ou services** — use as funções de `lib/permissions.ts`:

```ts
import { canCreatePresentations, canApproveContent } from "../lib/permissions";

if (canCreatePresentations(user)) { ... }
```

### Tabela de permissões por cargo

| Ação | Editor | Revisor | Apresentador | Gestor Sec. | Gestor Inst. | Admin |
|---|---|---|---|---|---|---|
| Ver projetos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar projeto | ✅ | — | — | ✅ | ✅ | ✅ |
| Editar projeto (próprio dept.) | ✅ | — | — | ✅ | ✅ | ✅ |
| **Aprovar / publicar projeto** | — | — | — | ✅ | ✅ | ✅ |
| Criar apresentação | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| **Publicar apresentação** | — | — | — | ✅ | ✅ | ✅ |
| Analytics completo | — | — | — | — | ✅ | ✅ |
| Gerenciar usuários | — | — | — | — | — | ✅ |

---

## 7. Wizard de Criação de Apresentações

Localização: `pages/CreatePresentationPage/CreatePresentationPage.tsx`

O wizard tem **3 etapas** e uma barra de progresso sempre visível no topo.

### Etapa 1 — Contexto + Detalhes do Projeto

**Parte superior (visível imediatamente):**
- Barra de busca grande (tema / objetivo / categoria)
- Grid de 18 categorias temáticas coloridas (clicáveis — primeira selecionada = enfoque principal)
- Seletor de ano de referência
- Botão "Selecionar Projetos →" (avança para Etapa 2)

**Parte inferior — "Detalhes do projeto (opcional)":**
Separada por um divisor. Contém o editor de projeto completo com sidebar nav:

| Seção | O que preenche | Obrigatório? |
|---|---|---|
| Contexto | Nome do evento, tipo, público-alvo, idioma | — |
| Identidade | Nome e descrição do projeto, status, data | ✅ Se quiser salvar no acervo |
| Classificação | Categorias, área gov., secretarias, tecnologias, keywords, público | ✅ Se quiser salvar |
| Indicadores | Métricas numéricas do projeto (valor, unidade, fonte, ano) | — |
| Mídia | Upload de imagens e links de vídeo | — |
| ODS | Objetivos de Desenvolvimento Sustentável da ONU (1–17) | — |
| Links e Fontes | Links oficiais e referências bibliográficas | — |
| Prêmios | Premiações e reconhecimentos recebidos | — |

> **Importante:** se o nome do projeto (Identidade) for preenchido, ao gerar a apresentação o projeto é **automaticamente salvo no acervo institucional** como efeito colateral não bloqueante.

### Etapa 2 — Seleção de Projetos

- Exibe o acervo de projetos filtrado pelo enfoque principal escolhido na Etapa 1
- Campo de busca para filtrar por nome, secretaria ou descrição
- Cards clicáveis com seleção múltipla (toggle)
- Contador de selecionados

### Etapa 3 — Configuração de Módulos

- 13 módulos padrão sugeridos automaticamente pelo motor de sugestão (`services/suggestionEngine.ts`)
- Cada módulo tem ações: **Ativar/Desativar**, **Ocultar**, **Duplicar**, **Mover ↑↓**, **Remover**
- Módulos sugeridos ficam com badge "Sugerido"
- Botão "Gerar Apresentação" salva tudo e navega para `/criar/resultado`

### Motor de sugestão de módulos

Arquivo: `services/suggestionEngine.ts`

Decide quais módulos ativar com base em:
- Projetos selecionados (se têm indicadores → ativa módulo Indicadores; se têm prêmios → ativa Prêmios; etc.)
- Tipo de evento (congressos ganham mais contexto institucional; visitas técnicas ganham projetos técnicos)
- Categorias escolhidas

### Estado compartilhado via `useProjectEditor`

O hook `useProjectEditor` (em `components/ProjectEditor/useProjectEditor.ts`) gerencia o estado do projeto sendo criado. Na Etapa 1 ele é usado com `{ noAutoSave: true }` para não salvar automaticamente durante o preenchimento do wizard:

```ts
const ed = useProjectEditor(null, userId, department, { noAutoSave: true });
```

As categorias selecionadas nos pills do topo e na seção Classificação usam o **mesmo estado** (`ed.draft.categories`), portanto ficam sempre sincronizadas.

---

## 8. Projetos Institucionais

Localização: `pages/AdminConsolePage/` (renderiza `InstitutionalProjectsPage`)

Rota: `/projetos`

### O que é

O acervo de projetos municipais. Cada projeto representa uma iniciativa da Prefeitura de Barueri (app municipal, sistema de BI, data center, etc.) com todos os seus dados estruturados.

### Projetos mock disponíveis

| Projeto | Secretaria | Status |
|---|---|---|
| BI Saúde | Gabinete de Dados | Ativo |
| App Barueri | Gabinete de Dados | Ativo |
| Metaverso Barueri | Gabinete de Dados | Ativo |
| Internet Social | Planejamento | Ativo |
| OCR Documental | Gabinete de Dados | Ativo |
| Data Center Municipal | Gabinete de Dados | Ativo |
| Edu Digital | Planejamento | Ativo |

### Funcionalidades da listagem

- **Filtros**: busca por texto, categoria, status, secretaria
- **Cards**: exibem nome, secretaria, categorias, status, ações disponíveis
- **Ações por cargo**:
  - Editor: ver, editar (própria secretaria)
  - Gestor: ver, editar, arquivar, aprovar
  - Admin: tudo + excluir

### Estrutura de um projeto (`types/project.ts`)

```ts
type InstitutionalProject = {
  id: string
  name: string
  shortDescription: string        // máx 200 caracteres
  fullDescription: string
  mainDepartment: string          // secretaria responsável
  relatedDepartments: string[]    // secretarias parceiras
  governmentArea: GovernmentArea  // ex: "Saúde", "Tecnologia e Inovação"
  categories: ProjectCategory[]   // ex: ["Saúde", "Governo Digital"]
  technologies: string[]          // ex: ["Power BI", "Python"]
  keywords: string[]              // termos de busca
  targetAudience: string[]        // público-alvo
  status: "draft" | "active" | "archived"
  implementationDate: string      // ISO date
  indicators: ProjectIndicator[]  // métricas numéricas
  images: ProjectImage[]          // fotos do projeto
  videos: ProjectVideo[]          // links de vídeo
  officialLinks: ProjectOfficialLink[] // links oficiais
  awards: ProjectAward[]          // premiações
  ods: OdsGoal[]                  // ODS da ONU (1-17)
  sources: string[]               // referências e fontes
  relatedProjectIds: string[]     // projetos relacionados
  versionHistory: VersionEntry[]  // histórico de edições
  createdByUserId: string
  createdAt: string
  lastUpdatedAt: string
  updatedBy: string
}
```

### As 18 Categorias Temáticas (`ProjectCategory`)

Saúde · Educação · Inovação · Transformação Digital · Cidades Inteligentes · Governo Digital · Inteligência Artificial · Mobilidade Urbana · Meio Ambiente · Segurança Pública · Infraestrutura · Social · Economia · Cultura e Lazer · Habitação · Saneamento · Esporte e Lazer · Trabalho e Emprego

---

## 9. Editor de Projetos

Localização: `components/ProjectEditor/`

O editor é um **overlay full-screen** acessado ao clicar em "Novo Projeto" ou "Editar" na página de Projetos Institucionais.

### As 7 seções

Cada seção é um card expansível (`SectionCard`) com indicador verde (preenchido) / vermelho (obrigatório vazio):

| Seção | Componente | Campos principais |
|---|---|---|
| Identidade | `IdentitySection.tsx` | Nome, descrição curta, descrição completa, status, data |
| Classificação | `ClassificationSection.tsx` | Categorias (18 pills), área gov., secretaria, tecnologias, keywords, público |
| Indicadores | `IndicatorsSection.tsx` | Valor, unidade, rótulo, fonte, ano (ilimitados) |
| Mídia | `MediaSection.tsx` | Upload de imagens, links de vídeo (YouTube/Vimeo) |
| ODS | `OdsSection.tsx` | Checkbox visual dos 17 ODS da ONU |
| Links e Fontes | `LinksSection.tsx` | Links oficiais tipados + fontes bibliográficas |
| Prêmios | `AwardsSection.tsx` | Nome do prêmio, organização, ano, descrição |

### Auto-save

O hook `useProjectEditor` faz auto-save 2 segundos após qualquer mudança (debounce). O indicador no topo do editor mostra "Salvando…" → "Salvo" → "Erro".

Para desativar o auto-save (ex: no wizard de criação):
```ts
const ed = useProjectEditor(null, userId, department, { noAutoSave: true });
```

### Componentes compartilhados (`EditorShared.tsx`)

- `SectionCard` — card expansível com id, ícone, título, badge de completude
- `FieldLabel` — label com hint e marcador de campo obrigatório
- `TagInput` — input de tags com sugestões e remoção por clique
- `CompletionBadge` — badge verde/amarelo/vermelho de preenchimento
- `SelectInput` — select estilizado

---

## 10. Console Administrativo

Localização: `pages/AdminConsolePage/`

Layout: `AdminConsoleLayout.tsx` — sidebar fixa com navegação lateral.

### Subpáginas

| Rota | Página | Conteúdo |
|---|---|---|
| `/apresentacoes` | `AdminProjectsPage` | Minhas apresentações criadas |
| `/projetos` | `InstitutionalProjectsPage` | Acervo de projetos municipais |
| `/templates` | `TemplatesPage` | Templates oficiais e salvos |
| `/analytics` | `AnalyticsPage` | Dashboard de métricas (Admin/Gestor) |
| `/minha-conta` | `AdminMyAccountPage` | Perfil do usuário logado |
| `/configuracoes` | `AdminSettingsPage` | Configurações da plataforma |
| `/admin/dados` | `AdminDataPage` | Dados brutos e integrações (admin only) |
| `/admin/administracao` | `AdminAdministrationPage` | Usuários, integrações (admin only) |

### "Minhas Apresentações" (`AdminProjectsPage`)

- Lista todas as apresentações criadas pelo usuário (ou todas, se admin)
- Status: **Rascunho** | **Pronto** | **Apresentado** | **Arquivado**
- Ação "Apresentar" abre o modo de apresentação full-screen
- Ação "Ver" abre o resultado gerado

---

## 11. Módulos de Apresentação

Os módulos são os "slides" da apresentação gerada. Existem 13 módulos padrão:

| Módulo ID | Título | Categoria |
|---|---|---|
| `capa-institucional` | Capa Institucional | Estrutura |
| `dados-gerais-barueri` | Dados Gerais de Barueri | Institucional |
| `dados-macro` | Dados Macro | Dados |
| `apresentacao-sit` | Apresentação da SIT | Institucional |
| `apresentacao-secretario` | Apresentação do Secretário | Institucional |
| `visao-geral-projetos` | Visão Geral dos Projetos | Projetos |
| `projetos-selecionados` | Projetos Selecionados | Projetos |
| `indicadores` | Indicadores | Dados |
| `premios` | Prêmios e Reconhecimentos | Dados |
| `ods` | ODS — Agenda 2030 | Dados |
| `videos` | Vídeos | Projetos |
| `encerramento` | Encerramento | Encerramento |
| `agradecimento` | Agradecimento | Encerramento |

### `PresentationModuleConfig` — estado de cada módulo

```ts
type PresentationModuleConfig = {
  instanceId: string        // ID único da instância (permite duplicatas)
  moduleId: PresentationModuleId
  enabled: boolean          // se aparece na apresentação
  hidden: boolean           // oculto mas não removido
  order: number
  duplicatedFrom?: string   // se é cópia de outro módulo
}
```

---

## 12. Sistema de Dados (Mocks → Services)

### Regra de ouro

> **Componentes e páginas nunca importam mocks diretamente.**
> Tudo passa pelos `services/`. Mocks ficam em `mocks/` e só services importam dali.

### Fluxo de dados

```
components/pages
    ↓ chamam
services/projectService.ts   ← contrato TypeScript (interface)
    ↓ usa internamente
mocks/institutionalProjectsMock.ts  ← dados em memória
```

### Como substituir por API real (Fase 9)

1. Criar `services/realProjectService.ts` que implementa `ProjectServiceContract`
2. No `services/index.ts`, trocar o import — **só esse arquivo muda**
3. Nenhum componente ou página precisa mudar

### Services disponíveis

| Service | Arquivo | Métodos principais |
|---|---|---|
| `projectService` | `services/projectService.ts` | `getProjects`, `createProject`, `updateProject`, `archiveProject`, `deleteProject` |
| `presentationService` | `services/presentationService.ts` | `getPresentations`, `createPresentation`, `updatePresentation`, `markAsPresented` |
| `templateService` | `services/templateService.ts` | `getTemplates`, `getOfficialTemplates`, `createTemplate` |
| `analyticsService` | `services/analyticsService.ts` | `getAnalytics`, `trackEvent` |
| `userService` | `services/userService.ts` | `getUsers`, `getUserById`, `createUser`, `updateUser` |
| `permissionService` | `services/permissionService.ts` | Guards síncronos, `getPermissionsForRole()` |
| `shareService` | `services/shareService.ts` | `getShareConfig`, `generatePresenterLink`, `generatePublicLink`, `revokePresenterLink` |
| `integrationService` | `services/integrationService.ts` | `getIntegrations`, `syncIntegration` |
| `categoryService` | `services/categoryService.ts` | `getCategories` |

---

## 13. Como Publicar / Fluxo de Status

### Projetos Institucionais

```
Editor cria projeto
    ↓ status: "draft"   (rascunho — só equipe interna vê)

Gestor de Secretaria / Gestor Institucional / Admin aprova
    ↓ status: "active"  (publicado — aparece nas apresentações e buscas)

Gestor ou Admin arquiva
    ↓ status: "archived" (tirado de circulação)
```

**Quem pode publicar (mudar de draft → active):**
Apenas usuários com `canApproveContent()` = `gestor-secretaria`, `gestor-institucional`, `administrador-geral`.

**O botão "Publicar" só aparece para esses cargos** — é verificado com:
```tsx
const perms = usePermissions();
{perms.canApproveContent() && <button onClick={handleApprove}>Publicar</button>}
```

### Apresentações

```
Wizard gera apresentação
    ↓ status: "draft"     (rascunho)

Ajustes e revisão
    ↓ status: "ready"     (pronta para apresentar)

Evento acontece
    ↓ status: "presented" (já foi apresentada)

Aposentada
    ↓ status: "archived"  (arquivada)
```

---

## 14. Templates de Apresentação

Localização: `pages/AdminConsolePage/TemplatesPage.tsx`  
Rota: `/templates`

Templates são estruturas reutilizáveis de apresentação. Funcionam como ponto de partida para o wizard — ao "Usar Template", o wizard é pré-preenchido com o contexto, módulos e projetos sugeridos do template.

### Diferença entre Templates e Projetos Institucionais

| | Projetos Institucionais | Templates |
|---|---|---|
| O que é | Iniciativa real da Prefeitura com dados e indicadores | Estrutura de apresentação reutilizável |
| Finalidade | Acervo de conteúdo | Ponto de partida para criar apresentações |
| Exemplo | "BI Saúde — Sistema de BI da Secretaria de Saúde" | "Template: Visita Técnica — Inovação" |

### Funcionalidades

- **Listar**: filtros por tipo de evento, categoria, idioma, status
- **Ver detalhes**: modal com módulos, projetos sugeridos, duração estimada
- **Usar como base**: pré-preenche o wizard de criação
- **Salvar como template**: disponível na página de resultado da apresentação (botão "Salvar como Template")
- **Duplicar**: copia o template para edição
- **Arquivar**: desativa sem excluir
- **Link de compartilhamento**: gera link para compartilhar o template entre equipes

### Tipo `PresentationTemplate` (`types/template.ts`)

```ts
type PresentationTemplate = {
  id: string
  name: string
  description: string
  eventType: EventType
  focus: string                            // enfoque principal
  secondaryFocuses?: string[]
  categories: ProjectCategory[]
  projects: string[]                       // IDs de projetos sugeridos
  moduleConfigs?: PresentationModuleConfig[] // módulos e ordem
  language: PresentationLanguage
  status: "active" | "draft" | "archived"
  isOfficial: boolean                      // template da equipe de gestão
  estimatedDurationMinutes: number
  usageCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

### Templates mock disponíveis

| Template | Tipo de Evento | Duração |
|---|---|---|
| Transformação Digital de Barueri | Congresso | 35 min |
| Barueri Saudável | Visita Técnica | 25 min |
| Barueri Sustentável | Audiência Pública | 40 min |
| Visita Técnica — Inovação Municipal | Visita Técnica | 30 min |

---

## 15. Compartilhamento

Localização: `components/ShareModal.tsx`  
Ativado via botão "Compartilhar" na página de resultado da apresentação.

### Três modos de acesso

| Modo | Quem usa | Como funciona |
|---|---|---|
| **Administrativo** | Equipe interna | Acesso via login no sistema (RBAC normal) |
| **Apresentador** | Servidor em evento | Token temporário com expiração (24h / 3d / 7d / 30d) |
| **Público** | Público externo | Link permanente + QR Code (apenas conteúdo publicado) |

### Aba Apresentador

- Gera token UUID opaco: `https://apresentacoes.barueri.sp.gov.br/v/{token}`
- QR Code exibido no modal (256×256) para projetar na tela antes do evento
- Botão "Copiar link" e seletor de expiração
- Botão "Revogar token" (desativa imediatamente)

### Aba Público

- Disponível apenas para apresentações com `status === "ready"` ou `"presented"`
- Gera slug público: `https://apresentacoes.barueri.sp.gov.br/p/{publicId}`
- QR Code para fixar em materiais impressos

### Regra de negócio

> Apresentações em rascunho (`"draft"`) ou arquivadas (`"archived"`) **não podem** gerar link público.
> O modal desativa a aba "Público" e exibe aviso quando o status bloqueia.

### Tipos (`types/share.ts`)

```ts
type ShareConfig = {
  presentationId: string
  presenter?: PresenterLink    // token temporário por evento
  public?: PublicShare         // link permanente com slug
  updatedAt: string
}
```

---

## 16. Analytics

Localização: `pages/AdminConsolePage/AnalyticsPage.tsx`  
Rota: `/analytics`  
Acesso: apenas `administrador-geral` e `gestor-institucional`

Dashboard com 13 categorias de métricas institucionais. Todos os dados são **estatísticos e agregados** — nenhum dado pessoal sensível é coletado.

### Filtro por período

| Período | Escala |
|---|---|
| Últimos 7 dias | ~22% do volume base |
| Últimos 30 dias | Base (100%) |
| Últimos 90 dias | ~270% |
| Últimos 12 meses | ~920% |
| Todo o período | ~1150% |

### As 13 métricas

| # | Métrica | O que mede |
|---|---|---|
| 1 | Apresentações mais acessadas | ranking por views + compartilhamentos |
| 2 | Projetos mais usados | quantas apresentações incluíram cada projeto |
| 3 | Categorias mais usadas | distribuição de categorias nas apresentações |
| 4 | Tempo médio por módulo | segundos que o público passa em cada módulo |
| 5 | Idioma utilizado | pt-BR / en-US / es por volume |
| 6 | Dispositivo usado | Desktop / Mobile / Tablet / TV |
| 7 | Acessos por QR Code | volume de scans de QR Code |
| 8 | Acessos por link | volume de acessos via link direto |
| 9 | Versões usadas em eventos | histórico de qual versão foi apresentada em cada evento |
| 10 | Apresentações mais consultadas | ranking de apresentações abertas internamente |
| 11 | Funcionários que mais criaram | ranking de criação de apresentações por servidor |
| 12 | Funcionários que mais revisaram | ranking de revisões por servidor |
| 13 | Templates mais usados | ranking de uso de templates como base |

### Política de privacidade

- Nomes de funcionários exibidos são papéis funcionais públicos da plataforma
- Proibido: localização individual, comportamento fora da plataforma, dados biométricos
- Analytics expõe apenas contagens e rankings agregados

---

## 17. Log de Atividades — Centro de Auditoria

Localização: seção **Log de Atividades** em `pages/AdminConsolePage/AdminAdministrationPage.tsx`  
Rota: `/admin/administracao` (requer Admin)

O Log de Atividades é um centro completo de auditoria do sistema que registra todas as ações relevantes realizadas na plataforma.

### 7 Categorias de eventos

| Categoria | O que registra |
|---|---|
| **Apresentações** | Criação, edição, publicação, arquivamento, exclusão, módulos, idioma, enfoque, QR Code, templates gerados |
| **Projetos** | Criação, edição, exclusão, indicadores, textos, imagens, vídeos, ODS, tecnologias, status |
| **Templates** | Criação, edição, duplicação, compartilhamento, arquivamento, exclusão |
| **Usuários** | Cadastro, remoção, alteração de cargo/permissões, ativação, desativação, login, logout |
| **Integrações** | Sincronizações, importações manuais, atualizações automáticas, erros |
| **Aprovações** | Aprovação/reprovação de projetos e apresentações, revisões concluídas |
| **Compartilhamentos** | Links de apresentador gerados, QR Codes, links públicos, revogações |

### Filtros disponíveis

- **Categoria** — tabs de filtragem rápida (Todos + 7 categorias)
- **Busca por texto** — pesquisa em ação, entidade, usuário, notas
- **Período** — Hoje / Últimos 7 dias / Últimos 30 dias / Todo o período
- **Secretaria** — filtro por departamento

### Informações por registro

| Campo | Descrição |
|---|---|
| `action` | Descrição legível da ação |
| `entityName` | Nome da entidade afetada |
| `userName` + `userRole` | Responsável e seu cargo |
| `department` + `team` | Secretaria e equipe |
| `status` | Concluído (verde) / Atenção (âmbar) / Erro (vermelho) |
| `previousValue` / `newValue` | Valor antes/depois (quando houver alteração de conteúdo) |
| `updateType` | `manual` ou `automatic` |
| `notes` | Observações adicionais |

### Tipo expandido (`types/admin.ts`)

```ts
type ActivityLogCategory = "Apresentações" | "Projetos" | "Templates"
  | "Usuários" | "Integrações" | "Aprovações" | "Compartilhamentos";

type ActivityLogEntry = {
  id, timestamp, source, type, userName, department, team, // campos originais
  category?, action?, entityName?, entityType?, entityId?,
  userRole?, status?, previousValue?, newValue?, updateType?, notes?
};
```

### Preparação para backend

O `AdminConsoleContext.tsx` já cria entradas completas (com os novos campos) ao cadastrar/remover usuários. Para o backend:
- Endpoint sugerido: `GET /api/audit-log?category=&period=&department=&q=`
- Trocar a fonte de dados no contexto ou criar `activityLogService.ts` implementando `getActivityLog(filters)`

---

## 18. Internacionalização (i18n)

Localização: `lib/i18n.ts`, `locales/`, `types/i18n.ts`  
Biblioteca: **i18next + react-i18next**

### Idiomas suportados

| Código | Idioma | Arquivo |
|---|---|---|
| `pt-BR` | Português (BR) — padrão | `locales/pt-BR.ts` |
| `en-US` | English (US) | `locales/en-US.ts` |
| `es` | Español | `locales/es.ts` |

### Arquitetura

```
src/
├── lib/i18n.ts              → configuração do i18next (init, recursos, fallback)
├── locales/
│   ├── pt-BR.ts             → strings em português (fonte de verdade)
│   ├── en-US.ts             → tradução inglês (tipado como I18nTranslations)
│   └── es.ts                → tradução espanhol (tipado como I18nTranslations)
├── types/i18n.ts            → UILanguage = "pt-BR" | "en-US" | "es"
└── context/
    ├── SystemPreferencesContext.tsx  → inclui uiLanguage em SystemPreferences
    └── I18nSyncProvider.tsx          → sincroniza i18next quando uiLanguage muda
```

### Como funciona

1. `SystemPreferences.uiLanguage` armazena o idioma escolhido no localStorage
2. `I18nSyncProvider` (renderizado dentro de `SystemPreferencesProvider`) chama `i18next.changeLanguage()` sempre que `uiLanguage` muda
3. `applySystemPreferencesToDocument()` define `document.documentElement.lang` para leitores de tela e SEO
4. Componentes usam `const { t } = useTranslation()` para todas as strings

### Como usar `useTranslation` em um componente

```tsx
import { useTranslation } from "react-i18next";

function MinhaPagina() {
  const { t } = useTranslation();

  return (
    <h1>{t("pages.projetos.title")}</h1>   // "Minhas Apresentações" | "My Presentations"
    <button>{t("common.salvar")}</button>   // "Salvar" | "Save" | "Guardar"
  );
}
```

### Como o usuário troca o idioma

Na página `/configuracoes` → cartão **Idioma** — 3 botões (PT / EN / ES). A mudança é imediata e pode ser salva clicando em "Salvar configurações".

### Namespaces do arquivo de locale

| Namespace | O que contém |
|---|---|
| `accessibility.*` | Labels ARIA (skip link, menu, sidebar) |
| `nav.*` | Rótulos do menu lateral |
| `common.*` | Botões e rótulos genéricos (salvar, cancelar, criar…) |
| `status.*` | Labels de status (draft, ready, presented…) |
| `languages.*` | Nomes dos idiomas |
| `settings.*` | Toda a página de Configurações |
| `pages.*` | Títulos e subtítulos de cada página |
| `landing.*` | Landing page pública |
| `login.*` | Formulário de login |

### Diferença entre `UILanguage` e `PresentationLanguage`

| | `UILanguage` | `PresentationLanguage` |
|---|---|---|
| Onde | `types/i18n.ts` | `types/institutionalPresentation.ts` |
| O que controla | Idioma da **interface** do sistema | Idioma do **conteúdo** de uma apresentação |
| Exemplo | Usuário usa a UI em inglês | Apresentação foi criada em espanhol |

São conceitos independentes e podem ser diferentes.

### Adicionando um novo idioma

1. Crie `locales/novo-idioma.ts` implementando o tipo `I18nTranslations`
2. Adicione o idioma ao type `UILanguage` em `types/i18n.ts`
3. Registre o recurso em `lib/i18n.ts`
4. Adicione o botão em `AdminSettingsPage.tsx` (array `UI_LANGUAGES`)

### Adicionando novas strings

1. Adicione a chave em `locales/pt-BR.ts` (fonte de verdade)
2. TypeScript vai reclamar de `en-US.ts` e `es.ts` até que você adicione lá também (o tipo `I18nTranslations` garante isso)
3. Use `t("namespace.chave")` no componente

---

## 19. Acessibilidade

O projeto mantém os seguintes recursos de acessibilidade (Fase 21):

### Recursos ativos

| Recurso | Como está implementado |
|---|---|
| **Tema claro/escuro** | `SystemPreferences.theme` + atributo `data-theme` no `<html>` |
| **Alto contraste** | `SystemPreferences.highContrast` + atributo `data-contrast="high"` |
| **Navegação por teclado** | Toggle em Configurações; reforça rings de foco e habilita atalhos Alt+1–5 |
| **Skip-to-main link** | Link "Pular para o conteúdo principal" em todo o layout admin (oculto até foco via Tab) |
| **`lang` no `<html>`** | `applySystemPreferencesToDocument()` atualiza `document.documentElement.lang` com o idioma ativo |
| **Landmark roles** | `<header>`, `<main id="main-content">`, `<aside>`, `<nav>` com `aria-label` |
| **ARIA modal** | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` + foco trap via `useModalAccessibility` |
| **`aria-live`** | Toasts e feedback usam `role="status"` e `aria-live="polite"` |
| **`role="switch"`** | Toggles de alto contraste e navegação por teclado |
| **`role="group"`** | Seletores de tema e idioma (com `aria-label`) |
| **`aria-pressed`** | Botões de toggle (tema claro/escuro, idioma) |
| **`aria-hidden`** | Ícones decorativos |
| **Focus rings** | Tailwind `focus-visible:ring-*` em todos os elementos interativos |
| **Responsividade** | Mobile-first; sidebar colapsável em telas pequenas com `role="dialog"` |

### Atalhos de teclado (quando navegação por teclado está ativa)

| Atalho | Destino |
|---|---|
| `Alt+1` | Projetos |
| `Alt+2` | Minha Conta |
| `Alt+3` | Configurações |
| `Alt+4` | Criar Apresentação |
| `Alt+5` | Dados (API) |

### Hook `useModalAccessibility`

Localização: `hooks/useModalAccessibility.ts`

Gerencia automaticamente:
- Foco inicial no elemento `[data-modal-initial-focus]`
- Trap de Tab dentro do modal
- Fechar com Escape
- Restaurar foco ao elemento anterior ao fechar

```tsx
const modalRef = useModalAccessibility({
  isOpen: isModalOpen,
  onClose: handleClose,
  initialFocusSelector: "[data-modal-initial-focus]",
});
```

### Regras para novos componentes

- Sempre adicionar `aria-hidden="true"` em ícones decorativos
- Botões que contêm apenas ícone devem ter `aria-label`
- Inputs de formulário devem ter `<label>` associado por `htmlFor`
- Modais devem usar `useModalAccessibility` ou implementar manualmente o foco trap
- Textos de status dinâmico devem usar `role="status"` ou `aria-live`

---

## 20. Como Contribuir  

### Antes de começar

1. Leia este documento inteiro
2. Leia `BACKEND_INTEGRATION.md` (raiz do projeto) para os contratos de serviço e guia de integração com backend
3. Rode o projeto: `cd frontend && npm install && npm run dev`
4. Acesse `http://localhost:5174` e faça login com `admin.nivel2` / `barueri123`

### Regras importantes

**NÃO faça:**
- Importar mocks diretamente em componentes ou páginas
- Checar cargos com strings inline (`user.role === "editor"`)
- Criar estados de permissão manualmente — use sempre `usePermissions()`
- Colocar lógica de negócio dentro de componentes visuais

**FAÇA:**
- Usar `usePermissions()` para qualquer verificação de acesso
- Usar services para qualquer leitura/escrita de dados
- Reutilizar `SectionCard`, `TagInput`, `FieldLabel` do `EditorShared.tsx`
- Adicionar rotas novas sempre em `router/paths.ts` e `router/AppRouter.tsx`

### Adicionando um novo projeto mock

Edite `mocks/institutionalProjectsMock.ts` e adicione um objeto seguindo o tipo `InstitutionalProject`. O service já vai carregá-lo automaticamente.

### Adicionando uma nova página

1. Crie a pasta e arquivo em `pages/NomeDaPagina/NomeDaPagina.tsx`
2. Adicione o caminho em `router/paths.ts`
3. Registre a rota em `router/AppRouter.tsx` dentro do `<ProtectedRoute>` ou `<AdminRoute>` adequado

### Adicionando um novo campo ao projeto

1. Edite o tipo `InstitutionalProject` em `types/project.ts`
2. Atualize `NewProjectPayload` se necessário (Omit da entidade principal)
3. Adicione o campo nos projetos mock de `mocks/institutionalProjectsMock.ts`
4. Adicione o campo `emptyDraft()` em `components/ProjectEditor/useProjectEditor.ts`
5. Crie ou edite a seção correspondente em `components/ProjectEditor/sections/`

---

## Status das Fases do TCC

| Fase | Status | Resumo |
|---|---|---|
| **1** | ✅ Concluída | Análise do projeto existente |
| **2** | ✅ Concluída | Estrutura de pastas |
| **3** | ✅ Concluída | Tipagem TypeScript completa |
| **4** | ✅ Concluída | Mocks centralizados com bridges de compatibilidade |
| **5** | ✅ Concluída | 8 services assíncronos com contrato + store em memória |
| **6** | ✅ Concluída | RBAC: 7 cargos, 28 permissões, 20+ guards, hook |
| **7** | ✅ Concluída | Páginas e componentes: wizard 3 etapas, acervo projetos, editor, admin, modo apresentação |
| **8** | ✅ Concluída | Motor de sugestão de módulos (regras sem IA); wizard integrado ao editor de projetos |
| **9** | ✅ Concluída | Modo Apresentador full-screen (InstitutionalPresenterMode) |
| **10** | ✅ Concluída | Templates: listagem, detalhes, duplicar, arquivar, gerar link |
| **11** | ✅ Concluída | Salvar apresentação como template (SaveAsTemplateModal) |
| **12** | ✅ Concluída | Configuração avançada de módulos: ativar/ocultar/duplicar/reordenar |
| **13** | ✅ Concluída | Histórico de versões e auditoria de mudanças |
| **14** | ✅ Concluída | Usar template como base no wizard (pré-preenchimento completo) |
| **15** | ✅ Concluída | Compartilhamento: 3 modos (admin/apresentador/público) com QR Code |
| **16** | ✅ Concluída | Analytics: dashboard com 13 métricas e filtro por período |
| **17** | ✅ Concluída | Log de Atividades: centro de auditoria com 7 categorias, 50 eventos mock, filtros completos |
| **18** | ✅ Concluída | Estrutura i18n: i18next + react-i18next, 3 idiomas (PT/EN/ES), locale files tipados, UILanguage em SystemPreferences, seletor funcional nas Configurações |
| **19** | ✅ Concluída | Acessibilidade: skip-to-main, lang no `<html>`, landmarks ARIA, aria-hidden em ícones, sidebar mobile com role="dialog", aria-label em todos os controles do layout admin |
| **20** | ✅ Concluída | Multi-idioma nas apresentações: campo `language` já estava em `InstitutionalPresentation`; wizard de criação com seletor PT/EN/ES; fase 18 completou a camada de UI |
| **21** | ✅ Concluída | Acessibilidade consolidada: reforço de todos os recursos existentes + novos (ver seção 19) |

> Para contratos de API e guia de integração com backend real, veja `BACKEND_INTEGRATION.md`.
