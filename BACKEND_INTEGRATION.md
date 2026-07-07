# Guia de Integração com Backend — Apresentação Inteligente Barueri

> **Para desenvolvedores backend.**  
> Este documento descreve todos os contratos de serviço do frontend, os dados simulados
> disponíveis, o padrão de troca mock → API real, e os endpoints sugeridos por domínio.
>
> **Princípio:** Nenhuma página, componente ou hook conhece a origem dos dados.
> Tudo passa pelos `services/`. Trocar um serviço não exige alterar nenhum componente.

---

## Sumário

1. [Padrão de Troca Mock → Backend](#1-padrão-de-troca-mock--backend)
2. [Serviço: Projetos Institucionais](#2-serviço-projetos-institucionais)
3. [Serviço: Apresentações](#3-serviço-apresentações)
4. [Serviço: Templates](#4-serviço-templates)
5. [Serviço: Compartilhamento](#5-serviço-compartilhamento)
6. [Serviço: Analytics](#6-serviço-analytics)
7. [Serviço: Usuários e RBAC](#7-serviço-usuários-e-rbac)
8. [Serviço: Categorias](#8-serviço-categorias)
9. [Serviço: Integrações Externas](#9-serviço-integrações-externas)
10. [Serviço: Permissões](#10-serviço-permissões)
11. [Módulos de Apresentação](#11-módulos-de-apresentação)
12. [Autenticação e Sessão](#12-autenticação-e-sessão)
13. [Tipos Completos por Domínio](#13-tipos-completos-por-domínio)
14. [Mocks Disponíveis](#14-mocks-disponíveis)
15. [Checklist de Integração](#15-checklist-de-integração)

---

## 1. Padrão de Troca Mock → Backend

Todos os serviços seguem **exatamente o mesmo padrão**. Trocar um serviço exige:

### Passo 1 — Criar o serviço real

```ts
// src/services/realProjectService.ts
import type { ProjectServiceContract } from "./projectService";

const realProjectService: ProjectServiceContract = {
  async getProjects(filters) {
    const res = await fetch(`/api/projects?${toQueryString(filters)}`);
    if (!res.ok) throw new Error("Falha ao buscar projetos");
    return res.json();
  },
  // ... demais métodos
};

export { realProjectService };
```

### Passo 2 — Trocar o export (UMA linha)

```ts
// src/services/projectService.ts — alterar apenas esta linha:
export const projectService: ProjectServiceContract = realProjectService;
//                                                    ↑ trocar de mockProjectService
```

### Resultado
Nenhuma página, componente ou hook precisa ser alterado.
O TypeScript garante que a implementação real satisfaz o contrato.

---

## 2. Serviço: Projetos Institucionais

**Arquivo:** `src/services/projectService.ts`  
**Contrato:** `ProjectServiceContract`

```ts
interface ProjectServiceContract {
  getProjects(filters?: ProjectFilters): Promise<ProjectSummary[]>
  getProjectById(id: string): Promise<InstitutionalProject | null>
  createProject(data: NewProjectPayload): Promise<InstitutionalProject>
  updateProject(id: string, data: UpdateProjectPayload): Promise<InstitutionalProject>
  deleteProject(id: string): Promise<void>
  archiveProject(id: string): Promise<void>
  searchProjects(query: string): Promise<ProjectSummary[]>
}
```

### Filtros disponíveis

```ts
type ProjectFilters = {
  query?: string
  category?: ProjectCategory | ""
  status?: ProjectStatus | ""
  governmentArea?: GovernmentArea | ""
  department?: string
}
```

### Endpoints sugeridos

| Método | Contrato | Endpoint sugerido |
|--------|----------|-------------------|
| `getProjects` | Listagem com filtros | `GET /api/projects?category=&status=&q=` |
| `getProjectById` | Projeto completo | `GET /api/projects/:id` |
| `createProject` | Criar projeto | `POST /api/projects` |
| `updateProject` | Editar projeto | `PATCH /api/projects/:id` |
| `deleteProject` | Deletar projeto | `DELETE /api/projects/:id` |
| `archiveProject` | Arquivar projeto | `PATCH /api/projects/:id/archive` |
| `searchProjects` | Busca full-text | `GET /api/projects/search?q=` |

### Tipos principais

```ts
type ProjectStatus = "active" | "draft" | "archived"

type ProjectCategory =
  | "Saúde" | "Educação" | "Inovação" | "Transformação Digital"
  | "Cidades Inteligentes" | "Governo Digital" | "Inteligência Artificial"
  | "Mobilidade Urbana" | "Meio Ambiente" | "Infraestrutura"
  | "Social" | "Economia" | "Cultura e Lazer" | "Habitação"
  | "Saneamento" | "Esporte e Lazer" | "Trabalho e Emprego" | "Segurança"

type InstitutionalProject = {
  id: string
  name: string
  shortDescription: string
  fullDescription: string
  mainDepartment: string
  relatedDepartments: string[]
  governmentArea: GovernmentArea
  categories: ProjectCategory[]
  technologies: string[]
  keywords: string[]
  targetAudience: string[]
  status: ProjectStatus
  implementationDate: string           // ISO date
  indicators: ProjectIndicator[]       // { id, label, value, unit, source, year }
  images: ProjectImage[]               // { id, url, caption, isPrimary, uploadedAt }
  videos: ProjectVideo[]               // { id, url, title, caption, durationSeconds }
  officialLinks: ProjectOfficialLink[] // { id, label, url, type: "portal"|"document"|"report"|"video"|"other" }
  awards: ProjectAward[]               // { id, name, year, organization, description? }
  ods: OdsGoal[]                       // 1–17
  sources: string[]
  lastUpdatedAt: string
  updatedBy: string
  versionHistory: { version, changedAt, changedBy, summary }[]
  createdByUserId: string
  createdAt: string
}

type ProjectSummary = {
  id, name, shortDescription, mainDepartment, categories, status,
  implementationDate, updatedAt, createdByUserId
}
```

---

## 3. Serviço: Apresentações

**Arquivo:** `src/services/presentationService.ts`  
**Contrato:** `PresentationServiceContract`

```ts
interface PresentationServiceContract {
  getPresentations(filters?: PresentationFiltersNew): Promise<PresentationSummary[]>
  getPresentationById(id: string): Promise<InstitutionalPresentation | null>
  getPresentationsByUser(userId: string): Promise<PresentationSummary[]>
  createPresentation(data: NewPresentationPayload): Promise<InstitutionalPresentation>
  updatePresentation(id: string, data: UpdatePresentationPayload): Promise<InstitutionalPresentation>
  deletePresentation(id: string): Promise<void>
  markAsPresented(id: string): Promise<InstitutionalPresentation>
  generatePublicLink(id: string): Promise<{ publicLink: string; qrCode: string }>
}
```

### Filtros disponíveis

```ts
type PresentationFiltersNew = {
  query?: string
  status?: PresentationStatus | ""
  eventType?: EventType | ""
  language?: PresentationLanguage | ""
  createdBy?: string
}
```

### Endpoints sugeridos

| Método | Endpoint sugerido |
|--------|-------------------|
| `getPresentations` | `GET /api/presentations` |
| `getPresentationById` | `GET /api/presentations/:id` |
| `getPresentationsByUser` | `GET /api/presentations?createdBy=:userId` |
| `createPresentation` | `POST /api/presentations` |
| `updatePresentation` | `PATCH /api/presentations/:id` |
| `deletePresentation` | `DELETE /api/presentations/:id` |
| `markAsPresented` | `PATCH /api/presentations/:id/mark-presented` |
| `generatePublicLink` | `POST /api/presentations/:id/public-link` |

### Tipos principais

```ts
type EventType = "congresso" | "visita-tecnica" | "premiacao" | "reuniao-interna" | "feira" | "audiencia-publica" | "outro"
type PresentationStatus = "draft" | "ready" | "presented" | "archived"
type PresentationLanguage = "pt-BR" | "en-US" | "es"

type PresentationModuleId =
  | "capa-institucional" | "dados-gerais-barueri" | "dados-macro"
  | "apresentacao-sit" | "apresentacao-secretario" | "visao-geral-projetos"
  | "projetos-selecionados" | "indicadores" | "premios" | "ods"
  | "videos" | "encerramento" | "agradecimento"

type PresentationModuleConfig = {
  instanceId: string             // UUID único por instância
  moduleId: PresentationModuleId
  enabled: boolean
  hidden: boolean
  duplicatedFrom?: string        // instanceId de origem, quando for cópia
  config?: Record<string, unknown>
}

type InstitutionalPresentation = {
  id: string
  title: string
  eventName: string
  eventType: EventType
  purpose: string
  audience: string
  mainFocus: string
  secondaryFocuses: string[]
  selectedProjects: string[]     // IDs de InstitutionalProject
  moduleConfigs: PresentationModuleConfig[]
  language: PresentationLanguage
  status: PresentationStatus
  createdBy: string              // userId
  createdAt: string
  updatedAt: string
  version: number
  publicLink?: string
  qrCode?: string
  shareConfig?: ShareConfig      // ver seção 5
  notes?: string
}
```

---

## 4. Serviço: Templates

**Arquivo:** `src/services/templateService.ts`  
**Contrato:** `TemplateServiceContract`

```ts
interface TemplateServiceContract {
  getTemplates(filters?: TemplateFilters): Promise<PresentationTemplate[]>
  getTemplateById(id: string): Promise<PresentationTemplate | null>
  getOfficialTemplates(): Promise<PresentationTemplate[]>
  createTemplate(data: NewTemplatePayload): Promise<PresentationTemplate>
  updateTemplate(id: string, data: UpdateTemplatePayload): Promise<PresentationTemplate>
  deleteTemplate(id: string): Promise<void>
  archiveTemplate(id: string): Promise<PresentationTemplate>
  generateShareLink(id: string): Promise<string>
  duplicateTemplate(id: string, createdBy: string, createdByName?: string): Promise<PresentationTemplate>
}
```

### Endpoints sugeridos

| Método | Endpoint sugerido |
|--------|-------------------|
| `getTemplates` | `GET /api/templates` |
| `getOfficialTemplates` | `GET /api/templates?isOfficial=true` |
| `getTemplateById` | `GET /api/templates/:id` |
| `createTemplate` | `POST /api/templates` |
| `updateTemplate` | `PATCH /api/templates/:id` |
| `deleteTemplate` | `DELETE /api/templates/:id` |
| `archiveTemplate` | `PATCH /api/templates/:id/archive` |
| `generateShareLink` | `POST /api/templates/:id/share` |
| `duplicateTemplate` | `POST /api/templates/:id/duplicate` |

### Tipos principais

```ts
type TemplateStatus = "active" | "draft" | "archived"

type PresentationTemplate = {
  id: string
  name: string
  description: string
  eventName?: string
  eventType: EventType
  focus: string
  secondaryFocuses?: string[]
  objective?: string
  audience?: string
  categories: ProjectCategory[]
  projects: string[]               // IDs de projetos sugeridos
  modules: TemplateModule[]        // formato legado
  moduleOrder: string[]
  moduleConfigs?: PresentationModuleConfig[]   // formato novo (Fase 14+)
  language: PresentationLanguage
  status: TemplateStatus
  isOfficial: boolean
  estimatedDurationMinutes: number
  shareLink?: string
  notes?: string
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  usageCount: number
}
```

---

## 5. Serviço: Compartilhamento

**Arquivo:** `src/services/shareService.ts`  
**Contrato:** `ShareServiceContract`

```ts
interface ShareServiceContract {
  getShareConfig(presentationId: string): Promise<ShareConfig | null>
  generatePresenterLink(payload: GeneratePresenterLinkPayload): Promise<PresenterLink>
  generatePublicLink(payload: GeneratePublicLinkPayload): Promise<PublicShare>
  revokePresenterLink(presentationId: string): Promise<void>
  revokePublicLink(presentationId: string): Promise<void>
  validateToken(token: string): Promise<TokenValidation>
  incrementViewCount(presentationId: string, mode: "presenter" | "public"): Promise<void>
}
```

### Três modos de acesso

| Modo | Descrição | Autenticação |
|------|-----------|--------------|
| `admin` | Acesso pela plataforma com login | JWT + RBAC |
| `presenter` | Token temporário para evento | Token opaco com expiração |
| `public` | Link público com QR Code | Nenhuma (apenas conteúdo publicado) |

### Endpoints sugeridos

| Método | Endpoint sugerido |
|--------|-------------------|
| `getShareConfig` | `GET /api/share/:presentationId` |
| `generatePresenterLink` | `POST /api/share/presenter` |
| `generatePublicLink` | `POST /api/share/public` |
| `revokePresenterLink` | `DELETE /api/share/:presentationId/presenter` |
| `revokePublicLink` | `DELETE /api/share/:presentationId/public` |
| `validateToken` | `POST /api/share/validate` |
| `incrementViewCount` | `POST /api/share/:presentationId/view` |

### Tipos principais

```ts
type AccessMode = "admin" | "presenter" | "public"

type PresenterLink = {
  token: string           // UUID opaco — NUNCA validado no frontend
  url: string             // https://dominio/v/:token
  qrCodeUrl: string       // URL da imagem do QR code
  createdAt: string
  expiresAt: string       // ISO — o frontend só exibe, não valida
  createdBy: string       // userId
  isActive: boolean
  viewCount: number
}

type PublicShare = {
  publicId: string        // slug amigável
  url: string             // https://dominio/p/:publicId
  qrCodeUrl: string
  createdAt: string
  createdBy: string
  isActive: boolean
  viewCount: number
}

type ShareConfig = {
  presentationId: string
  presenter?: PresenterLink
  public?: PublicShare
  updatedAt: string
}

// Resposta do endpoint POST /api/share/validate
type TokenValidation = {
  valid: boolean
  presentationId?: string
  mode?: "presenter" | "public"
  expiresAt?: string
  expired?: boolean
  revoked?: boolean
}

type GeneratePresenterLinkPayload = {
  presentationId: string
  createdBy: string
  expiresInHours: number   // 24 | 72 | 168 | 720
}

type GeneratePublicLinkPayload = {
  presentationId: string
  createdBy: string
}
```

### Regra de negócio crítica

> O link público só pode ser gerado para apresentações com `status === "ready"` ou `status === "presented"`.
> O backend deve rejeitar `POST /api/share/public` para apresentações em rascunho ou arquivadas.

---

## 6. Serviço: Analytics

**Arquivo:** `src/services/analyticsService.ts`  
**Contrato:** `AnalyticsServiceContract`

```ts
interface AnalyticsServiceContract {
  getAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsData>
  getAnalyticsEvents(filters?: AnalyticsFilters): Promise<AnalyticsEvent[]>
  trackEvent(event: Omit<AnalyticsEvent, "id">): Promise<void>
}
```

### Filtros disponíveis

```ts
type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m" | "all"

type AnalyticsFilters = {
  period?: AnalyticsPeriod
  startDate?: string
  endDate?: string
  department?: string
  source?: AccessSource
  deviceType?: DeviceType
}
```

### Endpoints sugeridos

| Método | Endpoint sugerido |
|--------|-------------------|
| `getAnalytics` | `GET /api/analytics?period=30d&department=` |
| `getAnalyticsEvents` | `GET /api/analytics/events?source=&device=` |
| `trackEvent` | `POST /api/analytics/track` |

### Estrutura completa de AnalyticsData

```ts
type AnalyticsData = {
  summary: AnalyticsSummary
  projectUsage: ProjectUsageStat[]
  presentationUsage: PresentationUsageEntry[]
  categoryDistribution: CategoryDistribution[]
  moduleTimeStats: ModuleTimeStat[]
  languageDistribution: LanguageDistribution[]
  deviceDistribution: DeviceDistribution[]
  accessSourceStats: AccessSourceStat[]
  versionEventStats: VersionEventStat[]
  userActivityStats: UserActivityStat[]
  templateUsageStats: TemplateUsageStat[]
  activityByMonth: MonthlyActivity[]
}

type AnalyticsSummary = {
  totalPresentations: number
  totalProjectsRegistered: number
  presentationsThisMonth: number
  mostUsedCategory: string
  activeUsers: number
  totalSharedLinks: number
  totalQrCodeScans: number
  totalPublicLinkAccesses: number
  totalDirectAccesses: number
  avgSessionSeconds: number
}
```

### Política de privacidade

> Analytics deve retornar apenas dados **estatísticos e agregados**.
> Nomes de funcionários são papéis funcionais públicos da plataforma — não são dados pessoais sensíveis.
> **Proibido**: localização individual, comportamento fora da plataforma, dados biométricos.

---

## 7. Serviço: Usuários e RBAC

**Arquivo:** `src/services/userService.ts`  
**Contrato:** `UserServiceContract`

```ts
interface UserServiceContract {
  getUsers(department?: string): Promise<PlatformUser[]>
  getUserById(id: string): Promise<PlatformUser | null>
  getUserByEmail(email: string): Promise<PlatformUser | null>
  createUser(data: NewUserPayload): Promise<UserMutationResult>
  updateUser(id: string, data: UpdateUserPayload): Promise<UserMutationResult>
  deleteUser(id: string): Promise<UserMutationResult>
  getOrganization(): Promise<OrganizationDirectoryEntry[]>
}

type UserMutationResult =
  | { success: true; user: PlatformUser }
  | { success: false; error: string }
```

### Endpoints sugeridos

| Método | Endpoint sugerido |
|--------|-------------------|
| `getUsers` | `GET /api/users?department=` |
| `getUserById` | `GET /api/users/:id` |
| `getUserByEmail` | `GET /api/users?email=` |
| `createUser` | `POST /api/users` |
| `updateUser` | `PATCH /api/users/:id` |
| `deleteUser` | `DELETE /api/users/:id` |
| `getOrganization` | `GET /api/organization` |

### Hierarquia de cargos e permissões

```ts
type UserRole =
  | "administrador-geral"    // acesso total
  | "gestor-institucional"   // aprovação e publicação
  | "gestor-secretaria"      // gestão de sua secretaria
  | "editor"                 // criação e edição
  | "revisor"                // revisão e aprovação parcial
  | "apresentador"           // modo apresentador via token
  | "publico-externo"        // acesso público somente

// 28 permissões atômicas
type UserPermission =
  | "view:projects" | "create:projects" | "edit:projects" | "delete:projects" | "archive:projects"
  | "view:presentations" | "create:presentations" | "edit:presentations" | "delete:presentations"
  | "publish:presentations" | "approve:presentations" | "share:presentations"
  | "present:presentations"
  | "view:templates" | "create:templates" | "edit:templates" | "delete:templates"
  | "view:analytics" | "export:analytics"
  | "view:users" | "manage:users"
  | "view:integrations" | "manage:integrations"
  | "view:version-history" | "manage:settings"
  | "access:admin-area" | "approve:content" | "review:content"

type PlatformUser = {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  position: string
  status: "active" | "inactive" | "pending"
  permissions: UserPermission[]
  avatar?: string
  lastAccess?: string
  createdAt: string
}
```

---

## 8. Serviço: Categorias

**Arquivo:** `src/services/categoryService.ts`  
**Contrato:** `CategoryServiceContract`

```ts
interface CategoryServiceContract {
  getCategories(): Promise<CategoryMeta[]>
  getCategoryById(id: ProjectCategory): Promise<CategoryMeta | null>
}

type CategoryMeta = {
  id: ProjectCategory
  label: string
  description: string
  color: string       // classe Tailwind ou hex
  icon?: string
}
```

### Endpoint sugerido

```
GET /api/categories
GET /api/categories/:id
```

---

## 9. Serviço: Integrações Externas

**Arquivo:** `src/services/integrationService.ts`  
**Contrato:** `IntegrationServiceContract`

```ts
interface IntegrationServiceContract {
  getIntegrations(): Promise<IntegrationSource[]>
  getIntegrationById(id: string): Promise<IntegrationSource | null>
  createIntegration(data: NewIntegrationPayload): Promise<IntegrationSource>
  updateIntegration(id: string, data: UpdateIntegrationPayload): Promise<IntegrationSource>
  deleteIntegration(id: string): Promise<void>
  syncIntegration(id: string): Promise<{ syncedAt: string }>
}

type IntegrationSourceType = "api" | "spreadsheet" | "manual" | "internal-system"
type IntegrationStatus = "active" | "inactive" | "maintenance" | "error"

type IntegrationSource = {
  id: string
  name: IntegrationSourceName
  type: IntegrationSourceType
  url?: string
  status: IntegrationStatus
  lastSync?: string
  responsible: string
  description: string
}
```

---

## 10. Serviço: Permissões

**Arquivo:** `src/services/permissionService.ts`  
**Contrato:** `PermissionServiceContract`

```ts
interface PermissionServiceContract {
  // Async (podem vir do backend):
  getPermissions(): Promise<PermissionMeta[]>
  getRoleDefinitions(): Promise<RoleDefinition[]>
  getPermissionsForRole(role: UserRole): Promise<PermissionMeta[]>

  // Guards síncronos (executados no cliente a partir do usuário em sessão):
  canAccessPlatform(user): boolean
  canViewProjects(user): boolean
  canCreateProject(user): boolean
  canEditProject(user, projectDepartment?): boolean
  canArchiveProject(user): boolean
  canApproveContent(user): boolean
  canReviewContent(user): boolean
  canCreatePresentation(user): boolean
  canViewAllPresentations(user): boolean
  canDeletePresentation(user, ownerUserId?): boolean
  canPublishPresentation(user): boolean
  canSharePresentation(user): boolean
  canAccessAdminArea(user): boolean
  canManageUsers(user): boolean
  canManageIntegrations(user): boolean
  canViewAnalytics(user, scope?: "basic" | "full"): boolean
  canExportAnalytics(user): boolean
  canViewVersionHistory(user, scope?: "own" | "full"): boolean
  hasPermission(user, permission: UserPermission): boolean
}
```

> Os guards síncronos são usados no frontend para ocultar/mostrar elementos de UI.
> A **autorização real** deve ser reforçada no backend a cada request.
> O frontend nunca é a última linha de defesa.

---

## 11. Módulos de Apresentação

Os 13 módulos padrão são fixos no frontend (`src/services/suggestionEngine.ts`).
O backend não precisa conhecê-los para o MVP — são configurados no `moduleConfigs[]` da apresentação.

```ts
const CANONICAL_MODULE_ORDER: PresentationModuleId[] = [
  "capa-institucional",
  "dados-gerais-barueri",
  "dados-macro",
  "apresentacao-sit",
  "apresentacao-secretario",
  "visao-geral-projetos",
  "projetos-selecionados",
  "indicadores",
  "premios",
  "ods",
  "videos",
  "encerramento",
  "agradecimento",
]
```

O campo `moduleConfigs: PresentationModuleConfig[]` na entidade `InstitutionalPresentation`
persiste quais módulos estão ativos/ocultos e em qual ordem.

---

## 12. Autenticação e Sessão

O frontend armazena a sessão em `localStorage` com a chave `barueri-inteligente:auth-session`.

```ts
type AuthSessionUser = {
  id: string
  name: string
  cpf: string
  email: string
  username: string
  accessLevel: "admin_level_2" | "admin_level_1" | "employee"
  role: UserRole
  department: string
  team: string
  status: "active" | "inactive"
  avatarDataUrl: string | null
}
```

### Endpoints de autenticação sugeridos

```
POST /api/auth/login          { username, password } → { user: AuthSessionUser, token: string }
POST /api/auth/logout
GET  /api/auth/me             → AuthSessionUser
POST /api/auth/refresh        → { token: string }
POST /api/auth/gov            → redireciona para GOV.BR OAuth
```

### Nível de acesso para funcionalidades

| `accessLevel` | Acesso |
|---|---|
| `admin_level_2` | Administrador geral — tudo |
| `admin_level_1` | Administrador limitado — sem gerenciar usuários |
| `employee` | Funcionário — criação e edição das próprias apresentações |

---

## 13. Tipos Completos por Domínio

Localização de todos os arquivos de tipo:

```
src/types/
├── project.ts              → InstitutionalProject, ProjectSummary, ProjectCategory
├── institutionalPresentation.ts → InstitutionalPresentation, PresentationModuleId
├── template.ts             → PresentationTemplate, TemplateModule, TemplateModuleType
├── share.ts                → ShareConfig, PresenterLink, PublicShare, TokenValidation
├── analytics.ts            → AnalyticsData, AnalyticsEvent, AnalyticsSummary (13 sub-tipos)
├── user.ts                 → PlatformUser, UserRole, UserPermission (28 permissões)
├── auth.ts                 → AuthSessionUser, MockUser
├── integration.ts          → IntegrationSource, IntegrationSourceType
├── versionHistory.ts       → VersionHistoryEntry (auditoria de mudanças)
└── admin.ts                → AdminSummary, ActivityLog, OrganizationDirectoryEntry
```

---

## 14. Mocks Disponíveis

Todos os mocks vivem em `src/mocks/`. São dados realistas prontos para uso em testes e desenvolvimento.

| Arquivo | Export | Descrição |
|---------|--------|-----------|
| `institutionalProjectsMock.ts` | `institutionalProjectsMock` | 7 projetos municipais completos (BI Saúde, App Barueri, Internet Social, etc.) |
| `presentationsMock.ts` | `institutionalPresentationsMock` | 3 apresentações com módulos, projetos e status variados |
| `templatesMock.ts` | `templatesMock` | 4 templates (Saúde, Transformação Digital, Sustentabilidade, Visita Técnica) |
| `usersMock.ts` | `authUsersMock`, `platformUsersMock` | 3 usuários de login + 5 usuários da plataforma com diferentes cargos |
| `analyticsMock.ts` | `analyticsMock`, `analyticsEventsMock` | KPIs + 13 categorias de métricas + eventos atômicos |
| `categoriesMock.ts` | `categoriesMock` | 18 categorias com cor, descrição e ícone |
| `integrationsMock.ts` | `integrationsMock`, `activityLogMock` | 8 fontes externas + log de atividade |
| `permissionsMock.ts` | `permissionsMock`, `roleDefinitionsMock` | 28 permissões + 7 cargos com defaults |
| `shareService.ts` | (embutido no serviço) | Config pré-populada para `inst-pres-01` com token e link público |

Ponto de entrada único para importar todos os mocks:
```ts
import { institutionalProjectsMock, templatesMock, ... } from "../mocks";
```

---

## 15. Checklist de Integração

Use esta lista para acompanhar o progresso da integração backend:

### Infraestrutura base
- [ ] Configurar autenticação JWT + sessão
- [ ] Implementar middleware de RBAC por endpoint
- [ ] Configurar CORS para o domínio do frontend

### Serviços por prioridade

**Prioridade 1 — Fluxo principal**
- [ ] `projectService` → projetos institucionais (leitura e escrita)
- [ ] `presentationService` → criar, listar e visualizar apresentações
- [ ] `userService` → login e perfil de usuário

**Prioridade 2 — Colaboração**
- [ ] `shareService` → geração e validação de tokens/links
  - Endpoint crítico: `POST /api/share/validate` (validado a cada acesso externo)
- [ ] `templateService` → templates reutilizáveis

**Prioridade 3 — Governança**
- [ ] `analyticsService` → métricas agregadas (sem dados pessoais sensíveis)
- [ ] `permissionService` → cargos e permissões dinâmicos
- [ ] `integrationService` → fontes de dados externas

**Prioridade 4 — Utilitários**
- [ ] `categoryService` → pode ser estático ou vir do banco
- [ ] Exportação PDF (único placeholder no frontend)

### Validações de negócio a implementar no backend

- [ ] Link público só para `status === "ready" | "presented"`
- [ ] Token de apresentador expira pelo campo `expiresAt` (nunca prorrogar automaticamente)
- [ ] Edição de projeto limitada à secretaria do usuário (salvo administradores)
- [ ] Analytics não deve expor dados individuais de acesso — apenas agregados
- [ ] Versionamento automático ao salvar apresentação (`version++`)

---

*Documento gerado em: 2026-07-07 | Projeto: Apresentação Inteligente Barueri*  
*Versão da arquitetura frontend: Fase 16 (Analytics Dashboard)*
