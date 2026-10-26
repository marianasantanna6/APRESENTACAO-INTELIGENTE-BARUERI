import { useEffect } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

type Props = {
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({ projectName, onConfirm, onCancel }: Props) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmar exclusão"
    >
      <div
        className="absolute inset-0 bg-[#142133]/50 backdrop-blur-[3px]"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_32px_80px_rgba(20,33,51,0.28)]">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6]"
        >
          <FiX className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef2f2]">
            <FiAlertTriangle className="h-5 w-5 text-[#b91c1c]" />
          </div>
          <div>
            <h3 className="text-[1rem] font-bold text-[#1e1e1e]">Excluir projeto?</h3>
            <p className="text-[0.82rem] text-[#6b7280]">Essa ação não pode ser desfeita.</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-[#f8f9fc] px-4 py-3 text-[0.84rem] text-[#374151]">
          Você está prestes a excluir permanentemente o projeto{" "}
          <strong>"{projectName}"</strong>. Todos os dados associados serão perdidos.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 text-[0.88rem] font-medium text-[#374151] transition hover:bg-[#f9fafb]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#b91c1c] px-4 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#991b1b]"
          >
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  );
}
