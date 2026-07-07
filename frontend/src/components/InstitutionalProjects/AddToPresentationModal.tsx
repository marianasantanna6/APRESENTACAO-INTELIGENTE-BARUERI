/**
 * AddToPresentationModal
 *
 * Abre a partir de um ProjectCard e permite ao usuário adicionar aquele projeto
 * a qualquer uma das suas apresentações existentes — ou ir criar uma nova.
 */

import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiCheck,
  FiLoader,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { presentationService } from "../../services/presentationService";
import type {
  EventType,
  PresentationSummary,
} from "../../types/institutionalPresentation";
import { ROUTE_PATHS } from "../../router/paths";

// ─── Metadados ────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<EventType, string> = {
  "congresso":         "Congresso",
  "visita-tecnica":    "Visita Técnica",
  "premiacao":         "Premiação",
  "reuniao-interna":   "Reunião Interna",
  "feira":             "Feira / Expo",
  "audiencia-publica": "Audiência Pública",
  "outro":             "Outro",
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  projectId: string;
  projectName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function AddToPresentationModal({ projectId, projectName, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  // Fechar com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Carrega apresentações do usuário
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    presentationService
      .getPresentationsByUser(user.id)
      .then((list) => {
        // Exclui as já arquivadas e as que já têm esse projeto
        setPresentations(list.filter((p) => p.status !== "archived"));
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleAdd() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const full = await presentationService.getPresentationById(selectedId);
      if (!full) throw new Error("Apresentação não encontrada.");

      // Evita duplicata
      if (full.selectedProjects.includes(projectId)) {
        onSuccess(`"${projectName}" já está nesta apresentação.`);
        onClose();
        return;
      }

      await presentationService.updatePresentation(selectedId, {
        selectedProjects: [...full.selectedProjects, projectId],
      });

      onSuccess(`"${projectName}" adicionado à apresentação com sucesso.`);
      onClose();
    } catch {
      setError("Não foi possível adicionar o projeto. Tente novamente.");
      setSaving(false);
    }
  }

  const alreadyAdded = (p: PresentationSummary) => p.selectedProjects.includes(projectId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#142133]/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Adicionar ${projectName} a uma apresentação`}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-[520px] -translate-y-1/2 rounded-[24px] border border-[#e5e7eb] bg-white shadow-[0_20px_60px_rgba(20,33,51,0.22)]"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 border-b border-[#f1f5f9] px-6 py-5">
          <div>
            <h2 className="text-[1.05rem] font-bold text-[#1e1e1e]">
              Adicionar a uma apresentação
            </h2>
            <p className="mt-0.5 text-[0.84rem] text-[#6b7280]">
              Projeto: <strong>{projectName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#374151]"
          >
            <FiX className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FiLoader className="h-6 w-6 animate-spin text-[#1675b8]" />
            </div>
          ) : presentations.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[0.92rem] text-[#6b7280]">
                Você ainda não tem apresentações. Crie uma agora para começar.
              </p>
            </div>
          ) : (
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {presentations.map((pres) => {
                const added    = alreadyAdded(pres);
                const selected = selectedId === pres.id;

                return (
                  <button
                    key={pres.id}
                    type="button"
                    onClick={() => !added && setSelectedId(selected ? null : pres.id)}
                    disabled={added}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-[14px] border-2 p-3.5 text-left transition ${
                      added
                        ? "cursor-default border-[#e5e7eb] bg-[#f9fafb] opacity-60"
                        : selected
                          ? "border-[#1675b8] bg-[#eff6ff] shadow-[0_2px_8px_rgba(22,117,184,0.12)]"
                          : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
                    }`}
                  >
                    {/* Selector */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        added
                          ? "border-[#4ade80] bg-[#4ade80]"
                          : selected
                            ? "border-[#1675b8] bg-[#1675b8]"
                            : "border-[#d1d5db]"
                      }`}
                    >
                      {(added || selected) && <FiCheck className="h-3 w-3 text-white" />}
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.92rem] font-bold text-[#1e1e1e]">
                        {pres.title}
                      </p>
                      <p className="flex items-center gap-2 text-[0.78rem] text-[#9ca3af]">
                        <span>{EVENT_LABELS[pres.eventType] ?? pres.eventType}</span>
                        <span>·</span>
                        <span>{pres.selectedProjects.length} projeto{pres.selectedProjects.length !== 1 ? "s" : ""}</span>
                        {added && <span className="ml-auto font-semibold text-[#16a34a]">Já incluído</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-xl bg-[#fef2f2] px-3 py-2 text-[0.84rem] text-[#b91c1c]">
              {error}
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex flex-col gap-3 border-t border-[#f1f5f9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.createPresentation)}
            className="inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-[#1675b8] transition hover:underline"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Criar nova apresentação
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e5e7eb] px-4 py-2 text-[0.86rem] font-semibold text-[#6b7280] transition hover:bg-[#f9fafb]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedId || saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1675b8] px-5 py-2 text-[0.86rem] font-bold text-white shadow-[0_4px_14px_-4px_rgba(22,117,184,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                <FiLoader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FiArrowRight className="h-3.5 w-3.5" />
              )}
              {saving ? "Adicionando…" : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
