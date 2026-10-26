import type { PresentationCard, PresentationData } from "../types/presentation";
import { PresentationGridCard } from "./PresentationMode";

type PresentationCardsSectionProps = {
  allowEditing?: boolean;
  data: PresentationData;
  hasHiddenSlides: boolean;
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onOpenDeck?: () => void;
  onOpenSolo: (slideId: PresentationCard["id"]) => void;
  onRestoreSlides?: () => void;
};

export default function PresentationCardsSection({
  allowEditing = true,
  data,
  hasHiddenSlides,
  onDeleteSlide,
  onOpenDeck,
  onOpenSolo,
  onRestoreSlides,
}: PresentationCardsSectionProps) {
  const hasSlides = data.presentationCards.length > 0;
  const slideCountLabel = `${data.presentationCards.length} slides`;

  return (
    <section
      data-presentation-surface="section"
      className="reveal-on-scroll mt-16 sm:mt-20"
      style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
    >
      <div
        data-presentation-surface="section-panel"
        className="relative overflow-hidden rounded-[34px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6"
      >
        <div className="relative z-[1] space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#1675b8,#0d5283)]">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <div>
                <p className="text-[0.63rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Conteúdo</p>
                <h2 className="text-[1.15rem] font-extrabold tracking-[-0.02em] text-[#1e1e1e]">
                  Slides da Apresentação
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasSlides ? (
                <span
                  data-presentation-surface="slide-badge"
                  className="inline-flex h-7 items-center justify-center rounded-full bg-[#eff6ff] px-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1675b8]"
                >
                  {slideCountLabel}
                </span>
              ) : null}

              {allowEditing && hasHiddenSlides && onRestoreSlides ? (
                <button
                  type="button"
                  onClick={onRestoreSlides}
                  data-presentation-surface="action-button"
                  className="inline-flex h-8 items-center justify-center rounded-full border border-[#1675b8]/20 bg-white px-4 text-[0.78rem] font-semibold text-[#0d5283] transition hover:-translate-y-0.5 hover:border-[#1675b8]/40"
                >
                  Restaurar removidos
                </button>
              ) : null}
            </div>
          </div>

          {hasSlides ? (
            <div className="grid gap-5 lg:auto-rows-[500px] lg:grid-cols-2">
              {data.presentationCards.map((card, index) => (
                <PresentationGridCard
                  key={card.id}
                  canDelete={allowEditing}
                  card={card}
                  data={data}
                  slideNumber={index + 1}
                  onDeleteSlide={onDeleteSlide}
                  onOpenSolo={onOpenSolo}
                />
              ))}
            </div>
          ) : (
            <div
              data-presentation-surface="empty-state"
              className="rounded-[28px] border border-dashed border-[#cbd5e1] bg-white/80 px-5 py-10 text-center shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)] sm:px-8 sm:py-14"
            >
              <h3 className="text-[1.2rem] font-bold text-[#1e1e1e] sm:text-[1.35rem]">
                Nenhum slide disponível
              </h3>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#5b6474]">
                {allowEditing
                  ? "Todos os slides foram removidos desta sessão. Use o botão abaixo para restaurar a apresentação."
                  : "Esta apresentação não possui slides disponíveis para visualização."}
              </p>
              {allowEditing && onRestoreSlides ? (
                <button
                  type="button"
                  onClick={onRestoreSlides}
                  data-presentation-surface="action-button"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#0d5283] px-6 text-[0.95rem] font-semibold text-white shadow-[0_14px_28px_rgba(13,82,131,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Restaurar slides
                </button>
              ) : null}
            </div>
          )}

          {onOpenDeck && (
            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={onOpenDeck}
                disabled={!hasSlides}
                data-presentation-surface="action-button"
                className="inline-flex h-12 w-full items-center justify-center rounded-[50px] bg-[#0d5283] px-6 text-center text-[0.95rem] font-bold uppercase tracking-[0.08em] text-[#f8fafc] shadow-[0_18px_34px_-18px_rgba(13,82,131,0.52)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[64px] sm:w-auto sm:px-12 sm:text-[1.05rem]"
              >
                Modo apresentação
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
