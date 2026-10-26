/**
 * Domínio: Compartilhamento de Apresentações
 *
 * Três modos de acesso:
 *   - admin      → acesso restrito ao sistema (login + permissão)
 *   - presenter  → token temporário para modo apresentador em evento
 *   - public     → link/QR público (apenas conteúdo aprovado e publicado)
 *
 * Preparado para validação backend: o token é opaco no frontend.
 * O endpoint de validação receberá o token e retornará os metadados.
 */

// ─── Modos de acesso ─────────────────────────────────────────────────────────

export type AccessMode = "admin" | "presenter" | "public";

// ─── Sub-entidades ────────────────────────────────────────────────────────────

/** Link de acesso para apresentador em evento — expira em X horas. */
export type PresenterLink = {
  token: string;                  // token opaco (UUID) — validado pelo backend
  url: string;                    // URL completa com token: /v/{token}
  qrCodeUrl: string;              // URL da imagem do QR code
  createdAt: string;
  expiresAt: string;              // ISO — o frontend não valida, só exibe
  createdBy: string;              // userId
  isActive: boolean;
  viewCount: number;
};

/** Link público — somente apresentações com status "ready" ou "presented". */
export type PublicShare = {
  publicId: string;               // slug curto para URL amigável
  url: string;                    // URL pública: /p/{publicId}
  qrCodeUrl: string;              // URL da imagem do QR code
  createdAt: string;
  createdBy: string;              // userId
  isActive: boolean;
  viewCount: number;
};

/** Configuração de compartilhamento de uma apresentação. */
export type ShareConfig = {
  presentationId: string;
  presenter?: PresenterLink;
  public?: PublicShare;
  updatedAt: string;
};

// ─── Resposta de validação de token (futuro backend) ─────────────────────────

/**
 * Estrutura retornada pelo endpoint POST /api/share/validate.
 * O frontend monta a UI com base nessa resposta — nunca valida o token localmente.
 */
export type TokenValidation = {
  valid: boolean;
  presentationId?: string;
  mode?: "presenter" | "public";
  expiresAt?: string;
  expired?: boolean;
  revoked?: boolean;
};

// ─── Payloads de criação ─────────────────────────────────────────────────────

export type GeneratePresenterLinkPayload = {
  presentationId: string;
  createdBy: string;
  expiresInHours: number;        // 24 | 72 | 168 | custom
};

export type GeneratePublicLinkPayload = {
  presentationId: string;
  createdBy: string;
};
