import { useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiMinimize2 } from "react-icons/fi";
import AuthenticatedHeader from "../AuthenticatedHeader";
import { useAuth } from "../../context";
import { useFullscreenElement, useModalAccessibility } from "../../hooks";
import type { PresentationViewerMode } from "../../hooks";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import { ROUTE_PATHS } from "../../router/paths";
import type { PresentationCard, PresentationData } from "../../types/presentation";
import { PresentationSlide } from "../PresentationCards";
import { PresentationModeToolbar } from "./PresentationModeToolbar";
import { PresentationThumbnailRail } from "./PresentationThumbnailRail";

export function PresentationModeOverlay({
  activeSlide,
  activeSlideIndex,
  allowEditing = true,
  canGoNext,
  canGoPrevious,
  data,
  hasHiddenSlides,
  isOpen,
  requestFullscreenOnOpen = false,
  slides,
  viewerMode,
  onClose,
  onDeleteSlide,
  onFullscreenRequestHandled,
  onGoNext,
  onGoPrevious,
  onOpenDeck,
  onOpenSolo,
  onRestoreSlides,
  onSelectSlide,
}: {
  activeSlide: PresentationCard | null;
  activeSlideIndex: number;
  allowEditing?: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  data: PresentationData;
  hasHiddenSlides: boolean;
  isOpen: boolean;
  requestFullscreenOnOpen?: boolean;
  slides: PresentationCard[];
  viewerMode: PresentationViewerMode;
  onClose: () => void;
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onFullscreenRequestHandled?: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onOpenDeck: (slideId?: PresentationCard["id"]) => void;
  onOpenSolo: (slideId: PresentationCard["id"]) => void;
  onRestoreSlides?: () => void;
  onSelectSlide: (slideId: PresentationCard["id"]) => void;
}) {
  const { user } = useAuth();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const previousViewerModeRef = useRef<PresentationViewerMode>("closed");
  const wasOpenRef = useRef(false);
  const {
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    toggleFullscreen,
  } = useFullscreenElement(fullscreenRef);
  const showFullscreenSlideOnly =
    viewerMode === "solo" && isFullscreen && Boolean(activeSlide);
  const isInteractiveDeckStage = viewerMode === "deck" && !showFullscreenSlideOnly;
  const canCreate = canCreatePresentations(user);
  const presentationsRoute = getPresentationsRouteForUser(user);

  async function handleExitSoloFullscreen() {
    if (isFullscreen) {
      await exitFullscreen();
    }

    if (activeSlide) {
      onOpenDeck(activeSlide.id);
      return;
    }

    onClose();
  }

  async function handleCloseViewer() {
    if (isFullscreen) {
      await exitFullscreen();
    }

    onClose();
  }

  const overlayRef = useModalAccessibility({
    closeOnEscape: false,
    isOpen,
    onClose: () => {
      void handleCloseViewer();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !requestFullscreenOnOpen || viewerMode !== "solo") {
      return;
    }

    void enterFullscreen().finally(() => {
      onFullscreenRequestHandled?.();
    });
  }, [
    enterFullscreen,
    isOpen,
    onFullscreenRequestHandled,
    requestFullscreenOnOpen,
    viewerMode,
  ]);

  useEffect(() => {
    const isEnteringDeck =
      isOpen && viewerMode === "deck" && (!wasOpenRef.current || previousViewerModeRef.current !== "deck");

    if (isEnteringDeck && (document.fullscreenElement || isFullscreen)) {
      void exitFullscreen();
    }

    wasOpenRef.current = isOpen;
    previousViewerModeRef.current = viewerMode;
  }, [exitFullscreen, isFullscreen, isOpen, viewerMode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isFullscreen) {
          if (viewerMode === "solo" && activeSlide) {
            await handleExitSoloFullscreen();
            return;
          }

          await exitFullscreen();
          return;
        }

        if (viewerMode === "solo" && activeSlide) {
          onOpenDeck(activeSlide.id);
          return;
        }

        onClose();
        return;
      }

      if (event.key === "ArrowLeft") {
        onGoPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        onGoNext();
      }
    }

    const listener = (event: KeyboardEvent) => {
      void handleKeyDown(event);
    };

    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [
    activeSlide,
    exitFullscreen,
    isFullscreen,
    isOpen,
    onClose,
    onGoNext,
    onGoPrevious,
    onOpenDeck,
    viewerMode,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de apresentacao"
      tabIndex={-1}
      data-page-theme="viewer"
      data-presentation-mode={showFullscreenSlideOnly ? "fullscreen" : viewerMode}
      className={`fixed inset-0 z-50 text-[#1e1e1e] ${
        showFullscreenSlideOnly
          ? "overflow-hidden"
          : "overflow-y-auto"
      }`}
    >
      <div
        ref={fullscreenRef}
        data-presentation-surface={showFullscreenSlideOnly ? "fullscreen-shell" : undefined}
        className="min-h-screen"
      >
        {!showFullscreenSlideOnly ? (
          <AuthenticatedHeader
            activeItem="create"
            canCreate={canCreate}
            logoTo={canCreate ? ROUTE_PATHS.createPresentation : presentationsRoute}
            presentationsTo={presentationsRoute}
            showMobilePresentationsShortcut
            user={user}
          />
        ) : null}

        <main
          className={
            showFullscreenSlideOnly
              ? "flex min-h-screen items-center justify-center px-4 py-4 sm:px-8"
              : "mx-auto max-w-[1360px] px-4 pb-7 pt-5 sm:px-6 lg:px-8"
          }
        >
          {!showFullscreenSlideOnly ? (
            <PresentationModeToolbar
              canDeleteSlides={allowEditing}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              currentSlideTitle={activeSlide?.title ?? "Sem slide ativo"}
              hasHiddenSlides={allowEditing && hasHiddenSlides}
              hasSlides={Boolean(activeSlide)}
              isFullscreen={showFullscreenSlideOnly}
              slideCounterLabel={
                activeSlide ? `Slide ${activeSlideIndex + 1} de ${slides.length}` : "0 slides"
              }
              viewerMode={viewerMode}
              onClose={() => {
                void handleCloseViewer();
              }}
              onDeleteSlide={() => {
                if (allowEditing && activeSlide && onDeleteSlide) {
                  onDeleteSlide(activeSlide.id);
                }
              }}
              onGoNext={onGoNext}
              onGoPrevious={onGoPrevious}
              onRestoreSlides={onRestoreSlides ?? (() => undefined)}
              onToggleFullscreen={() => {
                if (!activeSlide) {
                  return;
                }

                if (viewerMode === "deck") {
                  onOpenSolo(activeSlide.id);
                  return;
                }

                void toggleFullscreen();
              }}
            />
          ) : null}

          {showFullscreenSlideOnly ? (
            <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex justify-end px-4 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  void handleExitSoloFullscreen();
                }}
                data-presentation-control="default"
                className="pointer-events-auto inline-flex h-10.5 items-center gap-2 rounded-full bg-white/96 px-4.5 text-[0.88rem] font-semibold text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
              >
                <FiMinimize2 className="h-4 w-4" />
                Sair da tela cheia
              </button>
            </div>
          ) : null}

          {showFullscreenSlideOnly && activeSlide ? (
            <>
              <div className="pointer-events-none fixed inset-y-0 left-0 z-10 flex items-center px-3 sm:px-5">
                <button
                  type="button"
                  onClick={onGoPrevious}
                  disabled={!canGoPrevious}
                  data-presentation-control="icon"
                  aria-label="Slide anterior"
                  className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/96 text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronLeft className="h-5.5 w-5.5" />
                </button>
              </div>

              <div className="pointer-events-none fixed inset-y-0 right-0 z-10 flex items-center px-3 sm:px-5">
                <button
                  type="button"
                  onClick={onGoNext}
                  data-presentation-control="icon"
                  disabled={!canGoNext}
                  aria-label="Próximo slide"
                  className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/96 text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronRight className="h-5.5 w-5.5" />
                </button>
              </div>
            </>
          ) : null}

          <section className={showFullscreenSlideOnly ? "w-full" : "mt-6"}>
            {activeSlide ? (
              <div className={showFullscreenSlideOnly ? "" : "space-y-4"}>
                <div
                  className={`mx-auto w-full ${
                    showFullscreenSlideOnly
                      ? "max-w-[1320px]"
                      : viewerMode === "solo"
                        ? "max-w-[1180px]"
                        : "max-w-[1020px]"
                  }`}
                >
                  <div
                    role={isInteractiveDeckStage ? "button" : undefined}
                    tabIndex={isInteractiveDeckStage ? 0 : undefined}
                    onClick={() => {
                      if (isInteractiveDeckStage) {
                        onOpenSolo(activeSlide.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (!isInteractiveDeckStage) {
                        return;
                      }

                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onOpenSolo(activeSlide.id);
                    }}
                    className={`rounded-[28px] bg-transparent ${
                      isInteractiveDeckStage
                        ? "cursor-pointer transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
                        : ""
                    }`}
                  >
                    <PresentationSlide card={activeSlide} data={data} variant="stage" />
                  </div>
                </div>

                {!showFullscreenSlideOnly && viewerMode === "deck" ? (
                  <p className="text-center text-[0.86rem] text-[#5b6474]">
                    Clique no slide principal para abrir o modo solo em tela cheia.
                  </p>
                ) : !showFullscreenSlideOnly ? (
                  <p className="text-center text-[0.86rem] text-[#5b6474]">
                    Pressione Esc para sair da tela cheia ou voltar para a visão em grade.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mx-auto max-w-[700px] rounded-[24px] border border-dashed border-[#cbd5e1] bg-white/80 px-7 py-12 text-center shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]">
                <h2 className="text-[1.35rem] font-bold text-[#1e1e1e]">
                  Todos os slides foram removidos
                </h2>
                <p className="mt-3 text-[0.94rem] leading-6 text-[#5b6474]">
                  Restaure os slides para voltar ao modo apresentação ou retorne para a tela anterior.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {allowEditing && onRestoreSlides ? (
                    <button
                      type="button"
                      onClick={onRestoreSlides}
                      data-presentation-control="primary"
                      className="inline-flex h-10.5 items-center justify-center rounded-full bg-[#0d5283] px-5 text-[0.9rem] font-semibold text-white shadow-[0_14px_28px_rgba(13,82,131,0.28)] transition hover:-translate-y-0.5"
                    >
                      Restaurar slides
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void handleCloseViewer();
                    }}
                    data-presentation-control="default"
                    className="inline-flex h-10.5 items-center justify-center rounded-full bg-white px-5 text-[0.9rem] font-semibold text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
                  >
                    Fechar viewer
                  </button>
                </div>
              </div>
            )}
          </section>

          {!showFullscreenSlideOnly && viewerMode === "deck" && slides.length ? (
            <div className="mt-6">
              <PresentationThumbnailRail
                activeSlideId={activeSlide?.id ?? null}
                canDelete={allowEditing}
                data={data}
                slides={slides}
                onDeleteSlide={onDeleteSlide}
                onOpenSolo={onOpenSolo}
                onSelectSlide={onSelectSlide}
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
