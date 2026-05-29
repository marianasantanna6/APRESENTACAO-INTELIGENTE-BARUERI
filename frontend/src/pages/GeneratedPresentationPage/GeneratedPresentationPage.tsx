import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaFilter, FaSearch } from "react-icons/fa";
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

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16 text-center">
        <div className="max-w-[480px] rounded-[20px] border border-[#fecaca] bg-[#fff7f7] px-6 py-8 shadow-[0_12px_40px_-24px_rgba(127,29,29,0.28)]">
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
      <main className="mx-auto flex min-h-screen max-w-[1240px] items-center justify-center px-5 py-16">
        <div className="rounded-[20px] border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_12px_40px_-24px_rgba(15,23,42,0.24)]">
          <p className="text-[1rem] font-semibold text-slate-700">
            Carregando dashboard e apresentação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#efefef_100%)] text-[#1e1e1e]">
      <AuthenticatedHeader
        activeItem="create"
        canCreate={canCreate}
        logoTo={canCreate ? ROUTE_PATHS.createPresentation : presentationsRoute}
        onLogout={handleLogout}
        presentationsTo={presentationsRoute}
        showMobilePresentationsShortcut
        user={user}
      />

      <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-16 sm:px-6 lg:px-8">
        <section className="reveal-on-scroll mb-16 space-y-6">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-[62px] w-full rounded-[50px] bg-white pl-24 pr-24 text-[1.05rem] font-light text-[#1e1e1e] shadow-[0_6px_20px_rgba(0,0,0,0.15)] outline-none transition focus:-translate-y-0.5 focus:ring-4 focus:ring-[#1675b8]/15 sm:text-[1.2rem]"
            />
            <div className="pointer-events-none absolute left-11 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#898989]">
              <FaSearch className="h-4.5 w-4.5" />
            </div>
            <button
              type="button"
              aria-label="Abrir filtros"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((value) => !value)}
              className={`absolute right-8 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border transition ${
                showFilters
                  ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_12px_30px_-18px_rgba(59,130,246,0.6)]"
                  : "border-slate-200 bg-white text-[#475569] hover:bg-slate-50"
              }`}
            >
              <FaFilter className="h-5 w-5" />
            </button>
          </div>

          {showFilters ? (
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-32px_rgba(15,23,42,0.32)]">
              <div className="bg-gradient-to-r from-[#eff6ff] via-white to-[#f8fafc] px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Filtros ativos</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Parâmetros mostrados na visualização atual.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                    Ativo
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 px-5 pb-5 pt-4">
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]">
                  Módulo: {activeCategory}
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1e40af]">
                  Ano: {activeYear}
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-16 space-y-8">
          <h2 className="text-[2.45rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[3.5rem]">
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
