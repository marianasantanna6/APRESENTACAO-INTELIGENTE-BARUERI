/**
 * Domínio: Usuários, Cargos e Permissões
 *
 * PlatformUser representa qualquer pessoa com acesso à plataforma.
 * Separado de AuthSessionUser (auth.ts), usado pelo fluxo de autenticação.
 *
 * O sistema de permissões é baseado em cargos (RBAC). Cada cargo
 * tem um conjunto de permissões atômicas padrão que podem ser
 * expandidas individualmente quando necessário.
 */

// ─── Cargos ──────────────────────────────────────────────────────────────────

export type UserRole =
  | "administrador-geral"    // acesso total; gerencia usuários e integrações
  | "gestor-institucional"   // aprova conteúdos estratégicos e publica apresentações
  | "gestor-secretaria"      // gerencia projetos e conteúdos da própria secretaria
  | "editor"                 // cria e edita projetos e apresentações
  | "revisor"                // revisa, aprova ou devolve conteúdos
  | "apresentador"           // monta e exibe apresentações com conteúdos aprovados
  | "publico-externo";       // acesso somente a apresentações publicadas via link

// ─── Permissões atômicas ─────────────────────────────────────────────────────

export type UserPermission =
  // ── Projetos
  | "view:projects"
  | "create:projects"
  | "edit:projects"
  | "archive:projects"
  | "approve:projects"          // aprovar/devolver projetos para publicação
  | "validate:projects"         // validar informações e conferir fontes
  // ── Apresentações
  | "view:presentations"
  | "create:presentations"
  | "edit:presentations"
  | "delete:presentations"
  | "publish:presentations"     // publicar apresentações (tornar públicas)
  | "share:presentations"       // gerar link público e QR Code
  | "present:presentations"     // modo de apresentação em tela cheia
  // ── Templates
  | "view:templates"
  | "create:templates"
  | "edit:templates"
  | "configure:templates"       // configurações avançadas de templates
  // ── Conteúdo
  | "approve:content"           // aprovar conteúdos estratégicos e indicadores
  | "review:content"            // revisar e devolver conteúdos para ajuste
  // ── Analytics
  | "view:analytics"            // analytics da própria secretaria
  | "view:analytics:full"       // analytics institucional completo
  | "export:analytics"
  // ── Histórico e versionamento
  | "view:history"              // histórico da própria área
  | "view:history:full"         // histórico completo de todas as entidades
  // ── Administração
  | "manage:users"
  | "manage:permissions"
  | "manage:integrations"
  | "manage:roles";

// ─── Entidade PlatformUser ───────────────────────────────────────────────────

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  status: "active" | "inactive";
  permissions: UserPermission[];
  avatar?: string | null;
  lastAccess?: string;
  createdAt: string;
};

export type NewUserPayload = Omit<PlatformUser, "id" | "createdAt" | "lastAccess">;
export type UpdateUserPayload = Partial<Omit<PlatformUser, "id" | "createdAt" | "email">>;

// ─── Rótulos de cargo ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  "administrador-geral":  "Administrador Geral",
  "gestor-institucional": "Gestor Institucional",
  "gestor-secretaria":    "Gestor de Secretaria",
  "editor":               "Editor",
  "revisor":              "Revisor",
  "apresentador":         "Apresentador",
  "publico-externo":      "Público Externo",
};

// ─── Definições de cargo com permissões padrão ───────────────────────────────

export type RoleDefinition = {
  role: UserRole;
  label: string;
  description: string;
  capabilities: string[];       // lista legível para exibição na UI
  defaultPermissions: UserPermission[];
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "administrador-geral",
    label: ROLE_LABELS["administrador-geral"],
    description: "Acesso total à plataforma. Gerencia usuários, permissões, templates, integrações e histórico completo.",
    capabilities: [
      "Ver tudo na plataforma",
      "Editar qualquer conteúdo",
      "Gerenciar usuários e permissões",
      "Ver analytics geral",
      "Configurar templates",
      "Configurar integrações de dados",
      "Acessar histórico completo",
    ],
    defaultPermissions: [
      "view:projects", "create:projects", "edit:projects", "archive:projects", "approve:projects", "validate:projects",
      "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
      "publish:presentations", "share:presentations", "present:presentations",
      "view:templates", "create:templates", "edit:templates", "configure:templates",
      "approve:content", "review:content",
      "view:analytics", "view:analytics:full", "export:analytics",
      "view:history", "view:history:full",
      "manage:users", "manage:permissions", "manage:integrations", "manage:roles",
    ],
  },
  {
    role: "gestor-institucional",
    label: ROLE_LABELS["gestor-institucional"],
    description: "Aprova conteúdos estratégicos, publica apresentações e acessa analytics institucional.",
    capabilities: [
      "Aprovar conteúdos estratégicos",
      "Aprovar indicadores",
      "Publicar apresentações",
      "Ver analytics institucional",
      "Revisar versões finais",
      "Acessar histórico completo",
    ],
    defaultPermissions: [
      "view:projects", "create:projects", "edit:projects", "approve:projects", "validate:projects",
      "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
      "publish:presentations", "share:presentations", "present:presentations",
      "view:templates", "create:templates", "edit:templates",
      "approve:content", "review:content",
      "view:analytics", "view:analytics:full", "export:analytics",
      "view:history", "view:history:full",
    ],
  },
  {
    role: "gestor-secretaria",
    label: ROLE_LABELS["gestor-secretaria"],
    description: "Gerencia projetos e conteúdos da própria secretaria. Aprova publicações da sua área.",
    capabilities: [
      "Gerenciar projetos da própria secretaria",
      "Visualizar apresentações da secretaria",
      "Aprovar conteúdos da sua área",
      "Acompanhar analytics da secretaria",
    ],
    defaultPermissions: [
      "view:projects", "create:projects", "edit:projects", "approve:projects", "validate:projects",
      "view:presentations", "create:presentations", "edit:presentations", "delete:presentations",
      "share:presentations", "present:presentations",
      "view:templates", "create:templates", "edit:templates",
      "approve:content", "review:content",
      "view:analytics", "export:analytics",
      "view:history",
    ],
  },
  {
    role: "editor",
    label: ROLE_LABELS["editor"],
    description: "Cadastra e edita projetos, imagens, vídeos e indicadores. Monta apresentações.",
    capabilities: [
      "Cadastrar projetos",
      "Editar textos, imagens e vídeos",
      "Atualizar indicadores",
      "Montar apresentações",
    ],
    defaultPermissions: [
      "view:projects", "create:projects", "edit:projects",
      "view:presentations", "create:presentations", "edit:presentations",
      "share:presentations", "present:presentations",
      "view:templates", "create:templates",
    ],
  },
  {
    role: "revisor",
    label: ROLE_LABELS["revisor"],
    description: "Revisa conteúdos, valida informações e aprova ou devolve projetos.",
    capabilities: [
      "Revisar conteúdos",
      "Aprovar ou devolver projetos",
      "Validar informações",
      "Conferir fontes",
    ],
    defaultPermissions: [
      "view:projects", "approve:projects", "validate:projects",
      "view:presentations", "present:presentations",
      "view:templates",
      "review:content",
      "view:analytics",
      "view:history",
    ],
  },
  {
    role: "apresentador",
    label: ROLE_LABELS["apresentador"],
    description: "Monta e exibe apresentações com conteúdos aprovados. Gera links e QR Codes.",
    capabilities: [
      "Montar apresentações com conteúdos aprovados",
      "Salvar templates",
      "Gerar link público",
      "Gerar QR Code",
      "Usar modo de apresentação",
    ],
    defaultPermissions: [
      "view:projects",
      "view:presentations", "create:presentations", "edit:presentations",
      "share:presentations", "present:presentations",
      "view:templates", "create:templates",
    ],
  },
  {
    role: "publico-externo",
    label: ROLE_LABELS["publico-externo"],
    description: "Acessa apenas apresentações publicadas via link público. Não pode editar nada.",
    capabilities: [
      "Acessar apresentações publicadas via link",
      "Visualizar conteúdo por link",
    ],
    defaultPermissions: [
      "view:presentations",
    ],
  },
];
