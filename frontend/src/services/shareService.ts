/**
 * shareService — Compartilhamento de Apresentações (Fase 15)
 *
 * Três modos de acesso:
 *   admin     → sem token, controlado por login + RBAC
 *   presenter → token temporário (expira em X horas)
 *   public    → link/QR público, só para apresentações publicadas
 *
 * Mock em memória. Para conectar ao backend:
 *   1. Crie realShareService.ts implementando ShareServiceContract
 *   2. Substitua o export `shareService` no final deste arquivo
 *
 * Endpoint futuro: POST /api/share/validate { token } → TokenValidation
 */

import type {
  GeneratePresenterLinkPayload,
  GeneratePublicLinkPayload,
  PresenterLink,
  PublicShare,
  ShareConfig,
  TokenValidation,
} from "../types/share";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function slugify(id: string): string {
  return id.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 24);
}

const BASE_URL = "https://apresentacoes.barueri.sp.gov.br";

function presenterUrl(token: string)  { return `${BASE_URL}/v/${token}`; }
function publicUrl(publicId: string)  { return `${BASE_URL}/p/${publicId}`; }
function qrFor(url: string)           {
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&ecc=M&data=${encodeURIComponent(url)}`;
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Contrato ────────────────────────────────────────────────────────────────

export interface ShareServiceContract {
  /** Retorna a configuração de compartilhamento atual de uma apresentação. */
  getShareConfig(presentationId: string): Promise<ShareConfig | null>;

  /** Gera (ou regenera) um token de acesso para modo apresentador. */
  generatePresenterLink(payload: GeneratePresenterLinkPayload): Promise<PresenterLink>;

  /** Gera (ou regenera) o link público. Requer status ready|presented. */
  generatePublicLink(payload: GeneratePublicLinkPayload): Promise<PublicShare>;

  /** Desativa o link de apresentador. */
  revokePresenterLink(presentationId: string): Promise<void>;

  /** Desativa o link público. */
  revokePublicLink(presentationId: string): Promise<void>;

  /**
   * Valida um token (stub — no backend real fará POST /api/share/validate).
   * No mock, verifica o store em memória.
   */
  validateToken(token: string): Promise<TokenValidation>;

  /** Incrementa o contador de visualizações (chamado ao abrir o link). */
  incrementViewCount(presentationId: string, mode: "presenter" | "public"): Promise<void>;
}

// ─── Store em memória ────────────────────────────────────────────────────────

const configStore = new Map<string, ShareConfig>();

// Pré-popula com dados mock para a apresentação inst-pres-01
const _presToken = "tk-abc123def456ghi7";
const _presUrl   = presenterUrl(_presToken);
const _pubId     = "inovacao-saude-2026";
const _pubUrl    = publicUrl(_pubId);

configStore.set("inst-pres-01", {
  presentationId: "inst-pres-01",
  presenter: {
    token:      _presToken,
    url:        _presUrl,
    qrCodeUrl:  qrFor(_presUrl),
    createdAt:  "2026-03-20T10:00:00",
    expiresAt:  "2026-03-21T10:00:00",
    createdBy:  "admin-marina",
    isActive:   true,
    viewCount:  12,
  },
  public: {
    publicId:   _pubId,
    url:        _pubUrl,
    qrCodeUrl:  qrFor(_pubUrl),
    createdAt:  "2026-03-20T10:00:00",
    createdBy:  "admin-marina",
    isActive:   true,
    viewCount:  47,
  },
  updatedAt: "2026-03-20T10:00:00",
});

// ─── Implementação mock ──────────────────────────────────────────────────────

const mockShareService: ShareServiceContract = {
  async getShareConfig(presentationId) {
    await delay(200);
    return configStore.get(presentationId) ?? null;
  },

  async generatePresenterLink({ presentationId, createdBy, expiresInHours }) {
    await delay(400);
    const token = uuid();
    const url   = presenterUrl(token);
    const now   = new Date();
    const link: PresenterLink = {
      token,
      url,
      qrCodeUrl:  qrFor(url),
      createdAt:  now.toISOString(),
      expiresAt:  new Date(now.getTime() + expiresInHours * 3_600_000).toISOString(),
      createdBy,
      isActive:   true,
      viewCount:  0,
    };
    const existing = configStore.get(presentationId);
    configStore.set(presentationId, {
      presentationId,
      ...existing,
      presenter: link,
      updatedAt: now.toISOString(),
    });
    return link;
  },

  async generatePublicLink({ presentationId, createdBy }) {
    await delay(400);
    const publicId = `${slugify(presentationId)}-${Date.now().toString(36)}`;
    const url      = publicUrl(publicId);
    const now      = new Date();
    const share: PublicShare = {
      publicId,
      url,
      qrCodeUrl:  qrFor(url),
      createdAt:  now.toISOString(),
      createdBy,
      isActive:   true,
      viewCount:  0,
    };
    const existing = configStore.get(presentationId);
    configStore.set(presentationId, {
      presentationId,
      ...existing,
      public: share,
      updatedAt: now.toISOString(),
    });
    return share;
  },

  async revokePresenterLink(presentationId) {
    await delay(250);
    const cfg = configStore.get(presentationId);
    if (!cfg?.presenter) return;
    configStore.set(presentationId, {
      ...cfg,
      presenter: { ...cfg.presenter, isActive: false },
      updatedAt: new Date().toISOString(),
    });
  },

  async revokePublicLink(presentationId) {
    await delay(250);
    const cfg = configStore.get(presentationId);
    if (!cfg?.public) return;
    configStore.set(presentationId, {
      ...cfg,
      public: { ...cfg.public, isActive: false },
      updatedAt: new Date().toISOString(),
    });
  },

  async validateToken(token) {
    await delay(200);
    for (const [presentationId, cfg] of configStore.entries()) {
      if (cfg.presenter?.token === token) {
        const expired = new Date(cfg.presenter.expiresAt) < new Date();
        return {
          valid:          cfg.presenter.isActive && !expired,
          presentationId,
          mode:           "presenter",
          expiresAt:      cfg.presenter.expiresAt,
          expired,
          revoked:        !cfg.presenter.isActive,
        };
      }
      if (cfg.public?.publicId === token) {
        return {
          valid:          cfg.public.isActive,
          presentationId,
          mode:           "public",
          revoked:        !cfg.public.isActive,
        };
      }
    }
    return { valid: false };
  },

  async incrementViewCount(presentationId, mode) {
    await delay(100);
    const cfg = configStore.get(presentationId);
    if (!cfg) return;
    if (mode === "presenter" && cfg.presenter) {
      configStore.set(presentationId, {
        ...cfg,
        presenter: { ...cfg.presenter, viewCount: cfg.presenter.viewCount + 1 },
      });
    }
    if (mode === "public" && cfg.public) {
      configStore.set(presentationId, {
        ...cfg,
        public: { ...cfg.public, viewCount: cfg.public.viewCount + 1 },
      });
    }
  },
};

export const shareService: ShareServiceContract = mockShareService;
