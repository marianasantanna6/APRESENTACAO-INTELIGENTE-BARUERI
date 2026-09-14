/**
 * Mock canônico: Usuários
 *
 * Apenas usuários que NÃO existem no backend real.
 * Usuários reais (funcionários, approvers) autenticam direto pelo backend.
 */

import type { MockUser } from "../types/auth";
import type { PlatformUser } from "../types/user";

// ─── Usuários de autenticação (formato legado, mantido por compatibilidade) ──

export const authUsersMock: MockUser[] = [
  {
    // Perfil de demo para o master_admin do backend.
    // Quando o backend retorna master_admin=true, o AuthContext redireciona para este perfil.
    id: "admin-marina",
    name: "Marina Justus",
    cpf: "12345678909",
    email: "marina.justus@barueri.sp.gov.br",
    username: "admin.nivel2",
    password: "barueri123",
    accessLevel: "admin_level_2",
    role: "administrador-geral",
    department: "Gabinete de Dados",
    team: "Plataforma Analítica",
    status: "active",
    avatarDataUrl: null,
    master_admin: true,
  },
];

// ─── Usuários da plataforma (novo modelo completo) ───────────────────────────

export const platformUsersMock: PlatformUser[] = [
  {
    id: "admin-marina",
    name: "Marina Justus",
    email: "marina.justus@barueri.sp.gov.br",
    role: "administrador-geral",
    department: "Gabinete de Dados",
    position: "Coordenadora de Dados e Inovação",
    status: "active",
    permissions: [
      "view:projects", "create:projects", "edit:projects", "archive:projects",
      "view:presentations", "create:presentations", "edit:presentations",
      "delete:presentations", "share:presentations", "present:presentations",
      "view:templates", "create:templates", "edit:templates",
      "view:analytics", "export:analytics",
      "manage:users", "manage:integrations", "manage:roles",
    ],
    avatar: null,
    lastAccess: "2026-06-30T10:00:00",
    createdAt: "2024-01-15T08:00:00",
  },
];
