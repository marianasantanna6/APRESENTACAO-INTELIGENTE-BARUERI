import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaFilter, FaSearch } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { DEFAULT_PRESENTATION_FILTERS } from "../../api/presentation";
import AuthenticatedHeader from "../../components/AuthenticatedHeader";
import DashboardSection from "../../components/DashboardSection";
import { PresentationModeOverlay } from "../../components/PresentationMode";
import PresentationCardsSection from "../../components/PresentationCardsSection";
import { useAuth } from "../../context";
import { usePresentationData, usePresentationDeck } from "../../hooks";
import { canCreatePresentations } from "../../lib/accessControl";
import { getPresentationsRouteForUser } from "../../lib/authRouting";
import type { PresentationCard } from "../../types/presentation";
import { ROUTE_PATHS } from "../../router/paths";
import { readPresentationFiltersFromSearchParams } from "../../router/presentationSearchParams";

type ToastState = {
  message: string;
};

function FeedbackToast({ message }: ToastState) {
  return (
    <div
      data-toast-surface="info"
      className="fixed left-4 right-4 top-4 z-[70] flex max-w-[360px] items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_40px_rgba(20,33,51,0.18)] backdrop-blur-[6px] sm:left-auto sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      <FiFileText className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-[0.9rem] font-semibold leading-6">{message}</p>
    </div>
  );
}

export default function GeneratedPresentationPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canCreate = canCreatePresentations(user);
  const presentationsRoute = getPresentationsRouteForUser(user);
  const [searchParams] = useSearchParams();
  const filters = readPresentationFiltersFromSearchParams(
    searchParams,
    DEFAULT_PRESENTATION_FILTERS,
  );
  const { data: presentationData, error, isLoading } = usePresentationData(filters);
  const presentationDeck = usePresentationDeck({
    cards: presentationData?.presentationCards ?? [],
    storageKey: `presentation-deck:${filters.query}:${filters.category}:${filters.year}`,
  });
  const [query, setQuery] = useState(filters.query);
  const [showFilters, setShowFilters] = useState(false);
  const [requestFullscreenOnOpen, setRequestFullscreenOnOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeCategory = filters.category;
  const activeYear = filters.year;
  const presentationViewData = presentationData
    ? {
        ...presentationData,
        presentationCards: presentationDeck.visibleSlides,
      }
    : null;
  const canGoPrevious = presentationDeck.activeSlideIndex > 0;
  const canGoNext =
    presentationDeck.activeSlideIndex > -1
    && presentationDeck.activeSlideIndex < presentationDeck.visibleSlides.length - 1;

  useEffect(() => {
    if (presentationDeck.viewerMode !== "closed") {
      return;
    }

    setRequestFullscreenOnOpen(false);
  }, [presentationDeck.viewerMode]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  function handleOpenDeck() {
    setRequestFullscreenOnOpen(false);
    presentationDeck.openDeck();
  }

  function handleOpenSolo(slideId: PresentationCard["id"]) {
    setRequestFullscreenOnOpen(true);
    presentationDeck.openSolo(slideId);
  }

  function handleLogout() {
    logout();
    navigate(ROUTE_PATHS.login);
  }

  function handleExportPdfRequest() {
    setToast({
      message: "A exportacao em PDF sera conectada aqui em breve.",
    });
  }

  if (error) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        data-page-theme="generated"
        className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16 text-center"
      >
        <div
          data-generated-surface="feedback-card"
          className="max-w-[480px] rounded-[20px] border border-[#fecaca] bg-[#fff7f7] px-6 py-8 shadow-[0_12px_40px_-24px_rgba(127,29,29,0.28)]"
        >
          <h1 className="text-[1.5rem] font-extrabold text-[#991b1b]">
            Falha ao carregar os dados
          </h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#7f1d1d]">
            Verifique a implementação da camada de API em{" "}
            <code>src/api/presentation</code> e tente novamente.
          </p>
        </div>
      </main>
    );
  }

  if (isLoading || !presentationData || !presentationViewData) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        data-page-theme="generated"
        className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16"
      >
        <div
          data-generated-surface="feedback-card"
          className="rounded-[20px] border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_12px_40px_-24px_rgba(15,23,42,0.24)]"
        >
          <p className="text-[1rem] font-semibold text-slate-700">
            Carregando dashboard e apresentação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      data-page-theme="generated"
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)] text-[#1e1e1e]"
    >
      {toast ? <FeedbackToast message={toast.message} /> : null}

      <AuthenticatedHeader
        activeItem="create"
        canCreate={canCreate}
        logoTo={canCreate ? ROUTE_PATHS.createPresentation : presentationsRoute}
        onLogout={handleLogout}
        presentationsTo={presentationsRoute}
        showMobilePresentationsShortcut
        user={user}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8"
      >
        <section className="reveal-on-scroll mb-16 space-y-6">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              data-generated-surface="search-input"
              className="h-14 w-full rounded-[50px] bg-white pl-14 pr-16 text-[0.96rem] font-light text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15 sm:h-[62px] sm:pl-24 sm:pr-24 sm:text-[1.2rem]"
            />
            <div className="pointer-events-none absolute left-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#898989] sm:left-11">
              <FaSearch className="h-4.5 w-4.5" />
            </div>
            <button
              type="button"
              aria-label="Abrir filtros"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((value) => !value)}
              data-generated-surface="filter-toggle"
              className={`absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition sm:right-8 sm:h-11 sm:w-11 ${
                showFilters
                  ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_12px_30px_-18px_rgba(59,130,246,0.6)]"
                  : "border-slate-200 bg-white text-[#475569] hover:bg-slate-50"
              }`}
            >
              <FaFilter className="h-5 w-5" />
            </button>
          </div>

          {showFilters ? (
            <div
              data-generated-surface="filter-panel"
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-32px_rgba(15,23,42,0.32)]"
            >
              <div className="bg-gradient-to-r from-[#eff6ff] via-white to-[#f8fafc] px-5 py-4">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Filtros ativos</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Parâmetros mostrados na visualização atual.
                    </p>
                  </div>
                  <span
                    data-generated-surface="filter-chip"
                    className="inline-flex items-center rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]"
                  >
                    Ativo
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 px-5 pb-5 pt-4">
                <span
                  data-generated-surface="filter-chip"
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]"
                >
                  Módulo: {activeCategory}
                </span>
                <span
                  data-generated-surface="filter-chip"
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]"
                >
                  Ano: {activeYear}
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-16 space-y-8">
          <h2 className="page-title text-[2.45rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[3.5rem]">
            DASHBOARD
          </h2>
          <DashboardSection data={presentationData} />
        </section>

        <PresentationCardsSection
          allowEditing={canCreate}
          data={presentationViewData}
          hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
          onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
          onOpenDeck={handleOpenDeck}
          onOpenSolo={handleOpenSolo}
          onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
        />
      </main>

      <PresentationModeOverlay
        activeSlide={presentationDeck.activeSlide}
        activeSlideIndex={presentationDeck.activeSlideIndex}
        allowEditing={canCreate}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        data={presentationViewData}
        hasHiddenSlides={canCreate && presentationDeck.hasHiddenSlides}
        isOpen={presentationDeck.viewerMode !== "closed"}
        requestFullscreenOnOpen={requestFullscreenOnOpen}
        slides={presentationDeck.visibleSlides}
        viewerMode={presentationDeck.viewerMode}
        onClose={presentationDeck.closeViewer}
        onDeleteSlide={canCreate ? presentationDeck.deleteSlide : undefined}
        onExportPdfRequest={handleExportPdfRequest}
        onFullscreenRequestHandled={() => setRequestFullscreenOnOpen(false)}
        onGoNext={presentationDeck.openNextSlide}
        onGoPrevious={presentationDeck.openPreviousSlide}
        onOpenDeck={presentationDeck.openDeck}
        onOpenSolo={handleOpenSolo}
        onRestoreSlides={canCreate ? presentationDeck.restoreSlides : undefined}
        onSelectSlide={presentationDeck.selectSlide}
      />
    </div>
  );
}
