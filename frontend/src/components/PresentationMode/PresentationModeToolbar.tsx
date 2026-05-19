import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type { PresentationViewerMode } from "../../hooks";

export function PresentationModeToolbar({
  canDeleteSlides = true,
  canGoNext,
  canGoPrevious,
  currentSlideTitle,
  hasHiddenSlides,
  hasSlides,
  isFullscreen,
  slideCounterLabel,
  viewerMode,
  onClose,
  onDeleteSlide,
  onGoNext,
  onGoPrevious,
  onRestoreSlides,
  onToggleFullscreen,
}: {
  canDeleteSlides?: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentSlideTitle: string;
  hasHiddenSlides: boolean;
  hasSlides: boolean;
  isFullscreen: boolean;
  slideCounterLabel: string;
  viewerMode: PresentationViewerMode;
  onClose: () => void;
  onDeleteSlide: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onRestoreSlides: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[0.94rem] font-semibold text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
          >
            <FiArrowLeft className="h-4.5 w-4.5" />
            Voltar
          </button>

          {hasSlides ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={onGoPrevious}
                disabled={!canGoPrevious}
                aria-label="Slide anterior"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onGoNext}
                disabled={!canGoNext}
                aria-label="Próximo slide"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-w-[280px] flex-1 text-center">
          <h1 className="text-[2.2rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[3.25rem]">
            MODO APRESENTAÇÃO
          </h1>
          {hasSlides ? (
            <p className="mt-2 text-[0.95rem] text-[#5b6474]">
              {currentSlideTitle} • {slideCounterLabel}
            </p>
          ) : (
            <p className="mt-2 text-[0.95rem] text-[#5b6474]">
              Nenhum slide disponível no momento.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasHiddenSlides ? (
            <button
              type="button"
              onClick={onRestoreSlides}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[0.94rem] font-semibold text-[#0d5283] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
            >
              <FiRotateCcw className="h-4.5 w-4.5" />
              Restaurar slides
            </button>
          ) : null}

          {canDeleteSlides && hasSlides ? (
            <button
              type="button"
              onClick={onDeleteSlide}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[0.94rem] font-semibold text-[#b91c1c] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
            >
              <FiTrash2 className="h-4.5 w-4.5" />
              Excluir slide
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[0.94rem] font-semibold text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
          >
            {isFullscreen ? (
              <FiMinimize2 className="h-4.5 w-4.5" />
            ) : (
              <FiMaximize2 className="h-4.5 w-4.5" />
            )}
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
            aria-label="Fechar modo apresentação"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
