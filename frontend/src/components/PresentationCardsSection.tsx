import type { PresentationCard, PresentationData } from "../types/presentation";
import { PresentationGridCard } from "./PresentationMode";

type PresentationCardsSectionProps = {
  allowEditing?: boolean;
  data: PresentationData;
  hasHiddenSlides: boolean;
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onOpenDeck: () => void;
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="page-title text-[1.9rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.45rem] lg:text-[3.5rem]">
                APRESENTAÇÃO
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {hasSlides ? (
                <span
                  data-presentation-surface="slide-badge"
                  className="inline-flex h-11 items-center justify-center rounded-full px-4 text-[0.84rem] font-semibold uppercase tracking-[0.1em]"
                >
                  {slideCountLabel}
                </span>
              ) : null}

              {allowEditing && hasHiddenSlides && onRestoreSlides ? (
                <button
                  type="button"
                  onClick={onRestoreSlides}
                  data-presentation-surface="action-button"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1675b8]/15 bg-white px-5 text-[0.92rem] font-semibold text-[#0d5283] shadow-[0_12px_26px_-18px_rgba(13,82,131,0.5)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Restaurar slides removidos
                </button>
              ) : null}
            </div>
          </div>

          {hasSlides ? (
            <div className="grid gap-4 lg:auto-rows-[560px] lg:grid-cols-2">
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
        </div>
      </div>
    </section>
  );
}
