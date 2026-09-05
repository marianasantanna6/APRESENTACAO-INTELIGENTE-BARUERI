import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import type { PresentationViewerMode } from "../../hooks";

const baseButtonClass =
  "inline-flex h-10.5 items-center justify-center gap-2 rounded-full bg-white px-4.5 text-[0.88rem] font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40";
const defaultButtonClass = `${baseButtonClass} text-[#1e1e1e]`;
const accentButtonClass = `${baseButtonClass} text-[#0d5283]`;
const dangerButtonClass = `${baseButtonClass} text-[#b91c1c]`;
const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40";

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
  onExportPdfRequest,
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
  onExportPdfRequest: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onRestoreSlides: () => void;
  onToggleFullscreen: () => void;
}) {
  const titleLabel =
    viewerMode === "solo" ? "MODO APRESENTAÇÃO SOLO" : "MODO APRESENTAÇÃO";

  return (
    <div data-presentation-surface="toolbar" className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="order-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start xl:order-1">
          <button
            type="button"
            onClick={onClose}
            data-presentation-control="default"
            className={defaultButtonClass}
          >
            <FiArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          {hasSlides ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={onGoPrevious}
                disabled={!canGoPrevious}
                data-presentation-control="icon"
                aria-label="Slide anterior"
                className={iconButtonClass}
              >
                <FiChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={onGoNext}
                data-presentation-control="icon"
                disabled={!canGoNext}
                aria-label="Próximo slide"
                className={iconButtonClass}
              >
                <FiChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="order-1 min-w-0 flex-1 text-center xl:order-2">
          <h1 className="page-title text-[1.45rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[1.9rem] lg:text-[2.6rem]">
            {titleLabel}
          </h1>
          {hasSlides ? (
            <p className="page-subtitle mx-auto mt-1.5 max-w-[46rem] text-[0.84rem] text-[#5b6474] sm:text-[0.92rem]">
              {currentSlideTitle} - {slideCounterLabel}
            </p>
          ) : (
            <p className="page-subtitle mx-auto mt-1.5 max-w-[46rem] text-[0.84rem] text-[#5b6474] sm:text-[0.92rem]">
              Nenhum slide disponível no momento.
            </p>
          )}
        </div>

        <div className="order-3 flex flex-wrap items-center justify-center gap-2 xl:justify-end">
          {hasHiddenSlides ? (
            <button
              type="button"
              onClick={onRestoreSlides}
              data-presentation-control="accent"
              className={accentButtonClass}
            >
              <FiRotateCcw className="h-4 w-4" />
              Restaurar slides
            </button>
          ) : null}

          {canDeleteSlides && hasSlides ? (
            <button
              type="button"
              onClick={onDeleteSlide}
              data-presentation-control="danger"
              className={dangerButtonClass}
            >
              <FiTrash2 className="h-4 w-4" />
              Excluir slide
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExportPdfRequest}
            disabled={!hasSlides}
            data-presentation-control="accent"
            className={accentButtonClass}
          >
            <FiFileText className="h-4 w-4" />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            data-presentation-control="default"
            className={defaultButtonClass}
          >
            {isFullscreen ? (
              <FiMinimize2 className="h-4 w-4" />
            ) : (
              <FiMaximize2 className="h-4 w-4" />
            )}
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>

          <button
            type="button"
            onClick={onClose}
            data-presentation-control="icon"
            className="inline-flex h-10.5 w-10.5 items-center justify-center rounded-full bg-white text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
            aria-label="Fechar modo apresentação"
          >
            <FiX className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {hasSlides ? (
        <div className="flex items-center justify-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onGoPrevious}
            disabled={!canGoPrevious}
            data-presentation-control="icon"
            aria-label="Slide anterior"
            className={iconButtonClass}
          >
            <FiChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onGoNext}
            disabled={!canGoNext}
            data-presentation-control="icon"
            aria-label="Próximo slide"
            className={iconButtonClass}
          >
            <FiChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
