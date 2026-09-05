/**
 * ShareModal — Fase 15: Compartilhamento de Apresentações
 *
 * Três modos:
 *   Administrativo → acesso restrito ao sistema (login + RBAC)
 *   Apresentador   → token temporário para uso em evento
 *   Público        → link/QR aberto (apenas apresentações publicadas)
 */

import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiEye,
  FiGlobe,
  FiLink,
  FiLoader,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { shareService } from "../services/shareService";
import type { PresenterLink, PublicShare, ShareConfig } from "../types/share";
import type { PresentationStatus } from "../types/institutionalPresentation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isExpired(iso: string) {
  return new Date(iso) < new Date();
}

const EXPIRY_OPTIONS = [
  { label: "24 horas",  hours: 24  },
  { label: "3 dias",    hours: 72  },
  { label: "7 dias",    hours: 168 },
  { label: "30 dias",   hours: 720 },
];

// ─── Tipos das props ──────────────────────────────────────────────────────────

type ShareModalProps = {
  presentationId: string;
  presentationTitle: string;
  presentationStatus: PresentationStatus;
  userId: string;
  onClose: () => void;
};

// ─── Painel: Administrativo ───────────────────────────────────────────────────

function PanelAdmin() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-4">
        <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-[#1d4ed8]" />
        <div>
          <p className="text-[0.86rem] font-bold text-[#1d4ed8]">Acesso restrito ao sistema</p>
          <p className="mt-0.5 text-[0.8rem] leading-5 text-[#1e40af]">
            Este conteúdo está disponível apenas para membros da equipe autenticados
            na plataforma com as permissões adequadas.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[0.78rem] font-bold uppercase tracking-wider text-[#9ca3af]">
          Perfis com acesso
        </p>
        <div className="space-y-2">
          {[
            { role: "Administrador",  desc: "Acesso total — leitura, edição e publicação",    color: "text-[#991b1b] bg-[#fef2f2]" },
            { role: "Gestor",         desc: "Leitura completa e aprovação de conteúdo",        color: "text-[#92400e] bg-[#fffbeb]" },
            { role: "Analista",       desc: "Leitura e criação de apresentações próprias",     color: "text-[#166534] bg-[#f0fdf4]" },
            { role: "Comunicador",    desc: "Leitura e criação de apresentações próprias",     color: "text-[#1e40af] bg-[#eff6ff]" },
            { role: "Colaborador",    desc: "Leitura de apresentações publicadas",             color: "text-[#374151] bg-[#f3f4f6]" },
          ].map((item) => (
            <div key={item.role} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${item.color}`}>
              <FiUsers className="h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-[0.8rem] font-bold">{item.role}</span>
                <span className="ml-2 text-[0.74rem] opacity-80">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[0.74rem] text-[#9ca3af]">
        Para gerenciar permissões, acesse <strong className="text-[#374151]">Configurações → Administração → Usuários</strong>.
      </p>
    </div>
  );
}

// ─── Painel: Apresentador ─────────────────────────────────────────────────────

function PanelPresenter({
  presentationId,
  userId,
  initial,
  onUpdated,
}: {
  presentationId: string;
  userId: string;
  initial?: PresenterLink;
  onUpdated: (link: PresenterLink | undefined) => void;
}) {
  const [link, setLink]           = useState<PresenterLink | undefined>(initial);
  const [expiryHours, setExpiry]  = useState(24);
  const [loading, setLoading]     = useState(false);
  const [revoking, setRevoking]   = useState(false);
  const [copied, setCopied]       = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const newLink = await shareService.generatePresenterLink({
        presentationId,
        createdBy: userId,
        expiresInHours: expiryHours,
      });
      setLink(newLink);
      onUpdated(newLink);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      await shareService.revokePresenterLink(presentationId);
      const revoked = link ? { ...link, isActive: false } : undefined;
      setLink(revoked);
      onUpdated(revoked);
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const expired = link ? isExpired(link.expiresAt) : false;
  const active  = link?.isActive && !expired;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-4">
        <FiPlay className="mt-0.5 h-5 w-5 shrink-0 text-[#7c3aed]" />
        <div>
          <p className="text-[0.86rem] font-bold text-[#7c3aed]">Acesso para modo apresentador</p>
          <p className="mt-0.5 text-[0.8rem] leading-5 text-[#6d28d9]">
            Gere um link temporário com token único. Qualquer pessoa com o link pode
            abrir a apresentação em modo apresentador durante o evento — sem necessidade de login.
          </p>
        </div>
      </div>

      {/* Link atual */}
      {link ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {active ? (
                <FiCheckCircle className="h-4 w-4 text-[#166534]" />
              ) : (
                <FiXCircle className="h-4 w-4 text-[#b91c1c]" />
              )}
              <span className={`text-[0.8rem] font-bold ${active ? "text-[#166534]" : "text-[#b91c1c]"}`}>
                {expired ? "Expirado" : link.isActive ? "Ativo" : "Revogado"}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[0.72rem] text-[#9ca3af]">
              <FiEye className="h-3 w-3" /> {link.viewCount} visualização{link.viewCount !== 1 ? "ões" : ""}
            </span>
          </div>

          {/* URL */}
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white border border-[#e5e7eb] px-3 py-2 text-[0.76rem] text-[#374151]">
              {link.url}
            </code>
            <button type="button" onClick={handleCopy}
              className="shrink-0 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#6b7280] transition hover:bg-[#f3f4f6]">
              {copied ? <FiCheck className="h-4 w-4 text-[#166534]" /> : <FiCopy className="h-4 w-4" />}
            </button>
          </div>

          {/* QR Code */}
          {active && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-3">
              <img
                src={link.qrCodeUrl}
                alt="QR Code do link de apresentador"
                className="h-36 w-36 rounded-lg"
              />
              <p className="text-[0.7rem] text-[#9ca3af]">Escaneie para abrir no modo apresentador</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-[0.72rem] text-[#9ca3af]">
            <span className="flex items-center gap-1">
              <FiClock className="h-3 w-3" />
              Criado: {formatDate(link.createdAt)}
            </span>
            <span className={`flex items-center gap-1 ${expired ? "text-[#b91c1c]" : ""}`}>
              <FiClock className="h-3 w-3" />
              Expira: {formatDate(link.expiresAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#f9fafb] py-8 text-center">
          <FiLink className="mx-auto h-8 w-8 text-[#d1d5db]" />
          <p className="mt-2 text-[0.84rem] text-[#9ca3af]">Nenhum link de apresentador gerado.</p>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[0.78rem] font-semibold text-[#374151]">Validade:</label>
          <select
            value={expiryHours}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-1.5 text-[0.82rem] text-[#374151] focus:border-[#7c3aed] focus:outline-none"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.hours} value={o.hours}>{o.label}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={handleGenerate} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-4 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_12px_-4px_rgba(124,58,237,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50">
          {loading ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiRefreshCw className="h-3.5 w-3.5" />}
          {link ? "Regenerar" : "Gerar link"}
        </button>

        {link?.isActive && !expired && (
          <button type="button" onClick={handleRevoke} disabled={revoking}
            className="inline-flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2 text-[0.82rem] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2] disabled:opacity-50">
            {revoking ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
            Revogar
          </button>
        )}
      </div>

      <p className="text-[0.72rem] text-[#9ca3af]">
        O token é validado pelo servidor a cada acesso. Ao revogar, o link deixa de funcionar imediatamente.
      </p>
    </div>
  );
}

// ─── Painel: Público ──────────────────────────────────────────────────────────

function PanelPublic({
  presentationId,
  userId,
  presentationStatus,
  initial,
  onUpdated,
}: {
  presentationId: string;
  userId: string;
  presentationStatus: PresentationStatus;
  initial?: PublicShare;
  onUpdated: (share: PublicShare | undefined) => void;
}) {
  const [share, setShare]       = useState<PublicShare | undefined>(initial);
  const [loading, setLoading]   = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied]     = useState(false);

  const canPublish = presentationStatus === "ready" || presentationStatus === "presented";

  async function handleGenerate() {
    setLoading(true);
    try {
      const newShare = await shareService.generatePublicLink({ presentationId, createdBy: userId });
      setShare(newShare);
      onUpdated(newShare);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      await shareService.revokePublicLink(presentationId);
      const revoked = share ? { ...share, isActive: false } : undefined;
      setShare(revoked);
      onUpdated(revoked);
    } finally {
      setRevoking(false);
    }
  }

  async function handleCopy() {
    if (!share) return;
    await navigator.clipboard.writeText(share.url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!canPublish) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-4">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#c2410c]" />
          <div>
            <p className="text-[0.86rem] font-bold text-[#c2410c]">Apresentação não publicada</p>
            <p className="mt-0.5 text-[0.8rem] leading-5 text-[#9a3412]">
              O link público só pode ser gerado para apresentações com status
              <strong> "Pronto"</strong> ou <strong>"Apresentado"</strong>. Solicite a aprovação de um
              gestor ou administrador para publicar este conteúdo.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
          <FiLock className="mt-0.5 h-4 w-4 shrink-0 text-[#9ca3af]" />
          <p className="text-[0.78rem] text-[#6b7280]">
            Isso garante que apenas conteúdo aprovado e revisado seja visível ao público externo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4">
        <FiGlobe className="mt-0.5 h-5 w-5 shrink-0 text-[#15803d]" />
        <div>
          <p className="text-[0.86rem] font-bold text-[#15803d]">Acesso público via link ou QR Code</p>
          <p className="mt-0.5 text-[0.8rem] leading-5 text-[#166534]">
            Qualquer pessoa com o link pode visualizar esta apresentação — sem login.
            Apenas conteúdo aprovado e publicado é exibido.
          </p>
        </div>
      </div>

      {share ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {share.isActive
                ? <FiToggleRight className="h-5 w-5 text-[#166534]" />
                : <FiToggleLeft  className="h-5 w-5 text-[#b91c1c]" />}
              <span className={`text-[0.8rem] font-bold ${share.isActive ? "text-[#166534]" : "text-[#b91c1c]"}`}>
                {share.isActive ? "Público — ativo" : "Revogado"}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[0.72rem] text-[#9ca3af]">
              <FiEye className="h-3 w-3" /> {share.viewCount} visualização{share.viewCount !== 1 ? "ões" : ""}
            </span>
          </div>

          {/* URL */}
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white border border-[#e5e7eb] px-3 py-2 text-[0.76rem] text-[#374151]">
              {share.url}
            </code>
            <button type="button" onClick={handleCopy}
              className="shrink-0 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#6b7280] transition hover:bg-[#f3f4f6]">
              {copied ? <FiCheck className="h-4 w-4 text-[#166534]" /> : <FiCopy className="h-4 w-4" />}
            </button>
          </div>

          {/* QR Code */}
          {share.isActive && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white p-4">
              <img
                src={share.qrCodeUrl}
                alt="QR Code do link público"
                className="h-44 w-44 rounded-lg"
              />
              <p className="text-[0.72rem] text-[#9ca3af]">
                Escaneie ou mostre na tela — acesso direto ao conteúdo publicado
              </p>
              <a
                href={share.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[0.76rem] font-semibold text-[#1675b8] hover:underline"
              >
                <FiGlobe className="h-3 w-3" /> Abrir link público
              </a>
            </div>
          )}

          <p className="text-[0.72rem] text-[#9ca3af]">
            Criado em {formatDate(share.createdAt)} · por {share.createdBy}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#f9fafb] py-8 text-center">
          <FiGlobe className="mx-auto h-8 w-8 text-[#d1d5db]" />
          <p className="mt-2 text-[0.84rem] text-[#9ca3af]">Nenhum link público gerado ainda.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleGenerate} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] px-4 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_12px_-4px_rgba(21,128,61,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50">
          {loading ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiRefreshCw className="h-3.5 w-3.5" />}
          {share ? "Regenerar link" : "Gerar link público"}
        </button>

        {share?.isActive && (
          <button type="button" onClick={handleRevoke} disabled={revoking}
            className="inline-flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2 text-[0.82rem] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2] disabled:opacity-50">
            {revoking ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiToggleLeft className="h-3.5 w-3.5" />}
            Revogar acesso público
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

type Tab = "admin" | "presenter" | "public";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: "admin",     label: "Administrativo", icon: FiShield,  color: "text-[#1d4ed8]" },
  { id: "presenter", label: "Apresentador",   icon: FiPlay,    color: "text-[#7c3aed]" },
  { id: "public",    label: "Público",        icon: FiGlobe,   color: "text-[#15803d]" },
];

export function ShareModal({ presentationId, presentationTitle, presentationStatus, userId, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab]     = useState<Tab>("admin");
  const [config, setConfig]           = useState<ShareConfig | null>(null);
  const [loadingConfig, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    shareService
      .getShareConfig(presentationId)
      .then(setConfig)
      .finally(() => setLoading(false));
  }, [presentationId]);

  function handlePresenterUpdated(link: PresenterLink | undefined) {
    setConfig((prev) => prev
      ? { ...prev, presenter: link }
      : { presentationId, presenter: link, updatedAt: new Date().toISOString() },
    );
  }

  function handlePublicUpdated(share: PublicShare | undefined) {
    setConfig((prev) => prev
      ? { ...prev, public: share }
      : { presentationId, public: share, updatedAt: new Date().toISOString() },
    );
  }

  // Badge por aba
  const presenterBadge = config?.presenter?.isActive && !isExpired(config.presenter.expiresAt);
  const publicBadge    = config?.public?.isActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Compartilhar apresentação">
      <div className="absolute inset-0 bg-[#142133]/50 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-[0_32px_80px_rgba(20,33,51,0.28)] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f1f5] px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[1rem] font-bold text-[#1e1e1e]">Compartilhar Apresentação</h2>
            <p className="mt-0.5 text-[0.78rem] text-[#9ca3af] truncate max-w-[320px]">{presentationTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#f0f1f5] shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasBadge = (tab.id === "presenter" && presenterBadge) || (tab.id === "public" && publicBadge);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 flex-col items-center gap-1 px-3 py-3 text-[0.74rem] font-semibold transition ${
                  isActive
                    ? `border-b-2 border-current ${tab.color}`
                    : "border-b-2 border-transparent text-[#9ca3af] hover:text-[#374151]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasBadge && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#16a34a]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          {loadingConfig ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="h-6 w-6 animate-spin text-[#9ca3af]" />
            </div>
          ) : (
            <>
              {activeTab === "admin" && <PanelAdmin />}
              {activeTab === "presenter" && (
                <PanelPresenter
                  presentationId={presentationId}
                  userId={userId}
                  initial={config?.presenter}
                  onUpdated={handlePresenterUpdated}
                />
              )}
              {activeTab === "public" && (
                <PanelPublic
                  presentationId={presentationId}
                  userId={userId}
                  presentationStatus={presentationStatus}
                  initial={config?.public}
                  onUpdated={handlePublicUpdated}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f1f5] px-6 py-3 shrink-0">
          <p className="text-[0.72rem] text-[#9ca3af]">
            Links são validados pelo servidor a cada acesso. Conteúdo externo exibe apenas o que foi aprovado.
          </p>
        </div>
      </div>
    </div>
  );
}
