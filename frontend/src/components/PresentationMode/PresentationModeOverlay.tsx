import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiHelpCircle, FiMinimize2, FiUser } from "react-icons/fi";
import createLogo from "../../assets/images/create-logo.png";
import { useAuth } from "../../context";
import { useFullscreenElement } from "../../hooks";
import type { PresentationViewerMode } from "../../hooks";
import {
  canCreatePresentations,
  getAccessLevelLabel,
} from "../../lib/accessControl";
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

  return (
    <div
      className={`fixed inset-0 z-50 text-[#1e1e1e] ${
        showFullscreenSlideOnly
          ? "overflow-hidden bg-[#111827]"
          : "overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)]"
      }`}
    >
      <div
        ref={fullscreenRef}
        className={`min-h-screen ${
          showFullscreenSlideOnly
            ? "bg-[#111827]"
            : "bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)]"
        }`}
      >
        {!showFullscreenSlideOnly ? (
          <header className="border-b border-white/20 bg-[linear-gradient(90deg,#ffffff_8.654%,#1675b8_100%)]">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
              <Link
                to={canCreate ? ROUTE_PATHS.createPresentation : presentationsRoute}
                aria-label={
                  canCreate
                    ? "Voltar para criar apresentação"
                    : "Voltar para minhas apresentações"
                }
                className="shrink-0"
              >
                <img
                  src={createLogo}
                  alt="Logo Barueri"
                  className="h-auto w-[118px] sm:w-[170px]"
                />
              </Link>

              <nav className="hidden items-center gap-3 text-[15px] font-semibold text-white md:flex lg:text-[16px]">
                {canCreate ? (
                  <>
                    <Link
                      to={ROUTE_PATHS.createPresentation}
                      className="flex h-10 items-center justify-center rounded-[50px] border border-[#1675b8] bg-[rgba(22,117,184,0.5)] px-4 text-[1rem] font-semibold !text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-5 lg:text-[1.05rem]"
                    >
                      Criar
                    </Link>
                    <div aria-hidden="true" className="h-6 w-0.5 bg-white/30" />
                  </>
                ) : null}
                <Link
                  to={presentationsRoute}
                  className="flex h-10 items-center justify-center rounded-[50px] border border-transparent px-4 text-[1rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:border-[#1675b8] hover:bg-[rgba(22,117,184,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-4 focus:ring-white/25 lg:h-11 lg:px-5 lg:text-[1.05rem]"
                >
                  Minhas apresentações
                </Link>
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={presentationsRoute}
                  className="inline-flex h-11 items-center justify-center rounded-[8px] px-3 text-[0.94rem] font-semibold !text-white transition-all hover:-translate-y-0.5 hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/25 md:hidden"
                >
                  Minhas apresentações
                </Link>
                {user ? (
                  <div className="flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-white">
                    <FiUser className="h-4.5 w-4.5 shrink-0" />
                    <div className="max-w-[170px] leading-tight">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-[0.73rem] text-white/78">
                        {getAccessLevelLabel(user.accessLevel)}
                      </p>
                    </div>
                  </div>
                ) : null}
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
        ) : null}

        <main
          className={
            showFullscreenSlideOnly
              ? "flex min-h-screen items-center justify-center px-4 py-4 sm:px-8"
              : "mx-auto max-w-[1440px] px-4 pb-8 pt-7 sm:px-6 lg:px-8"
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
                className="pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full bg-white/96 px-5 text-[0.94rem] font-semibold text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
              >
                <FiMinimize2 className="h-4.5 w-4.5" />
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
                  aria-label="Slide anterior"
                  className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/96 text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
              </div>

              <div className="pointer-events-none fixed inset-y-0 right-0 z-10 flex items-center px-3 sm:px-5">
                <button
                  type="button"
                  onClick={onGoNext}
                  disabled={!canGoNext}
                  aria-label="Próximo slide"
                  className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/96 text-[#1e1e1e] shadow-[0_14px_32px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </div>
            </>
          ) : null}

          <section className={showFullscreenSlideOnly ? "w-full" : "mt-8"}>
            {activeSlide ? (
              <div className={showFullscreenSlideOnly ? "" : "space-y-5"}>
                <div
                  className={`mx-auto w-full ${
                    showFullscreenSlideOnly
                      ? "max-w-[1360px]"
                      : viewerMode === "solo"
                        ? "max-w-[1240px]"
                        : "max-w-[1080px]"
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
                    className={`rounded-[28px] bg-white/0 ${
                      isInteractiveDeckStage
                        ? "cursor-pointer transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
                        : ""
                    }`}
                  >
                    <PresentationSlide card={activeSlide} data={data} variant="stage" />
                  </div>
                </div>

                {!showFullscreenSlideOnly && viewerMode === "deck" ? (
                  <p className="text-center text-[0.92rem] text-[#5b6474]">
                    Clique no slide principal para abrir o modo solo em tela cheia.
                  </p>
                ) : !showFullscreenSlideOnly ? (
                  <p className="text-center text-[0.92rem] text-[#5b6474]">
                    Pressione Esc para sair da tela cheia ou voltar para a visão em grade.
                  </p>
                ) : null}
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
                  {allowEditing && onRestoreSlides ? (
                    <button
                      type="button"
                      onClick={onRestoreSlides}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-[#0d5283] px-6 text-[0.95rem] font-semibold text-white shadow-[0_14px_28px_rgba(13,82,131,0.28)] transition hover:-translate-y-0.5"
                    >
                      Restaurar slides
                    </button>
                  ) : null}
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

          {!showFullscreenSlideOnly && viewerMode === "deck" && slides.length ? (
            <div className="mt-8">
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
