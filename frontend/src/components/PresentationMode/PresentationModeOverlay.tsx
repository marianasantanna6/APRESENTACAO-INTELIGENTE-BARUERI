import { useEffect, useRef } from "react";
import { FiHelpCircle, FiUser } from "react-icons/fi";
import createLogo from "../../assets/images/create-logo.png";
import { useFullscreenElement } from "../../hooks";
import type { PresentationViewerMode } from "../../hooks";
import type { PresentationCard, PresentationData } from "../../types/presentation";
import { PresentationSlide } from "../PresentationCards";
import { PresentationModeToolbar } from "./PresentationModeToolbar";
import { PresentationThumbnailRail } from "./PresentationThumbnailRail";

export function PresentationModeOverlay({
  activeSlide,
  activeSlideIndex,
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
  canGoNext: boolean;
  canGoPrevious: boolean;
  data: PresentationData;
  hasHiddenSlides: boolean;
  isOpen: boolean;
  requestFullscreenOnOpen?: boolean;
  slides: PresentationCard[];
  viewerMode: PresentationViewerMode;
  onClose: () => void;
  onDeleteSlide: (slideId: PresentationCard["id"]) => void;
  onFullscreenRequestHandled?: () => void;
  onGoNext: () => void;
  onGoPrevious: () => void;
  onOpenDeck: (slideId?: PresentationCard["id"]) => void;
  onOpenSolo: (slideId: PresentationCard["id"]) => void;
  onRestoreSlides: () => void;
  onSelectSlide: (slideId: PresentationCard["id"]) => void;
}) {
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const {
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    toggleFullscreen,
  } = useFullscreenElement(fullscreenRef);

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
    if (!isOpen || !requestFullscreenOnOpen) {
      return;
    }

    void enterFullscreen().finally(() => {
      onFullscreenRequestHandled?.();
    });
  }, [enterFullscreen, isOpen, onFullscreenRequestHandled, requestFullscreenOnOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isFullscreen) {
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

  async function handleCloseViewer() {
    if (isFullscreen) {
      await exitFullscreen();
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)] text-[#1e1e1e]">
      <div ref={fullscreenRef} className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)]">
        <header className="border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
            <div className="shrink-0">
              <img
                src={createLogo}
                alt="Logo Barueri"
                className="h-auto w-[118px] sm:w-[170px]"
              />
            </div>

            <nav className="hidden items-center gap-3 text-[15px] font-semibold text-white md:flex lg:text-[16px]">
              <div className="flex h-10 items-center justify-center rounded-[50px] px-4 text-[1rem] font-semibold !text-white lg:h-11 lg:px-5 lg:text-[1.05rem]">
                Criar
              </div>
              <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
              <div className="flex h-10 items-center justify-center rounded-[50px] border border-[#1675b8] bg-[rgba(22,117,184,0.5)] px-4 text-[1rem] font-semibold !text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] lg:h-11 lg:px-5 lg:text-[1.05rem]">
                Minhas apresentações
              </div>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Conta"
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[8px] px-3 text-[1rem] font-bold !text-white sm:px-4 lg:text-[1.08rem]"
              >
                <FiUser className="h-5.5 w-5.5 text-white" />
              </button>
              <button
                type="button"
                aria-label="Ajuda"
                className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[8px] px-3 text-[1rem] font-bold !text-white sm:px-4 lg:text-[1.08rem]"
              >
                <FiHelpCircle className="h-5.5 w-5.5 text-white" />
                <span className="hidden text-white sm:inline">Ajuda</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-8 pt-7 sm:px-6 lg:px-8">
          <PresentationModeToolbar
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            currentSlideTitle={activeSlide?.title ?? "Sem slide ativo"}
            hasHiddenSlides={hasHiddenSlides}
            hasSlides={Boolean(activeSlide)}
            isFullscreen={isFullscreen}
            slideCounterLabel={
              activeSlide ? `Slide ${activeSlideIndex + 1} de ${slides.length}` : "0 slides"
            }
            viewerMode={viewerMode}
            onClose={() => {
              void handleCloseViewer();
            }}
            onDeleteSlide={() => {
              if (activeSlide) {
                onDeleteSlide(activeSlide.id);
              }
            }}
            onGoNext={onGoNext}
            onGoPrevious={onGoPrevious}
            onRestoreSlides={onRestoreSlides}
            onReturnToDeck={() => onOpenDeck(activeSlide?.id)}
            onToggleFullscreen={() => {
              void toggleFullscreen();
            }}
          />

          <section className="mt-8">
            {activeSlide ? (
              <div className="space-y-5">
                <div
                  className={`mx-auto ${viewerMode === "solo" ? "max-w-[1240px]" : "max-w-[1080px]"}`}
                >
                  <div
                    role={viewerMode === "deck" ? "button" : undefined}
                    tabIndex={viewerMode === "deck" ? 0 : undefined}
                    onClick={() => {
                      if (viewerMode === "deck") {
                        onOpenSolo(activeSlide.id);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (viewerMode !== "deck") {
                        return;
                      }

                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }

                      event.preventDefault();
                      onOpenSolo(activeSlide.id);
                    }}
                    className={`rounded-[28px] bg-white/0 ${
                      viewerMode === "deck"
                        ? "cursor-pointer transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
                        : ""
                    }`}
                  >
                    <PresentationSlide card={activeSlide} data={data} variant="stage" />
                  </div>
                </div>

                {viewerMode === "deck" ? (
                  <p className="text-center text-[0.92rem] text-[#5b6474]">
                    Clique no slide principal para abrir o modo solo em tela cheia.
                  </p>
                ) : (
                  <p className="text-center text-[0.92rem] text-[#5b6474]">
                    Pressione Esc para sair da tela cheia ou voltar para a visão em grade.
                  </p>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-[760px] rounded-[28px] border border-dashed border-[#cbd5e1] bg-white/80 px-8 py-16 text-center shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]">
                <h2 className="text-[1.5rem] font-bold text-[#1e1e1e]">
                  Todos os slides foram removidos
                </h2>
                <p className="mt-3 text-[1rem] leading-7 text-[#5b6474]">
                  Restaure os slides para voltar ao modo apresentação ou retorne para a tela anterior.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onRestoreSlides}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#0d5283] px-6 text-[0.95rem] font-semibold text-white shadow-[0_14px_28px_rgba(13,82,131,0.28)] transition hover:-translate-y-0.5"
                  >
                    Restaurar slides
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCloseViewer();
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[0.95rem] font-semibold text-[#1e1e1e] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
                  >
                    Fechar viewer
                  </button>
                </div>
              </div>
            )}
          </section>

          {viewerMode === "deck" && slides.length ? (
            <div className="mt-8">
              <PresentationThumbnailRail
                activeSlideId={activeSlide?.id ?? null}
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
