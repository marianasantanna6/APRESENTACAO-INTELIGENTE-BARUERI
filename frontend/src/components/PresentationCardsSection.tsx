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

  return (
    <section
      data-presentation-surface="section"
      className="reveal-on-scroll mt-16 space-y-7 sm:mt-20 sm:space-y-8"
      style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
    >
      <h2 className="page-title text-[1.9rem] font-extrabold tracking-[-0.04em] text-[#1e1e1e] sm:text-[2.45rem] lg:text-[3.5rem]">
        APRESENTAÇÃO
      </h2>

      {allowEditing && hasHiddenSlides && onRestoreSlides ? (
        <div className="flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={onRestoreSlides}
            data-presentation-surface="action-button"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1675b8]/15 bg-white px-5 text-[0.92rem] font-semibold text-[#0d5283] shadow-[0_12px_26px_-18px_rgba(13,82,131,0.5)] transition hover:-translate-y-0.5 sm:w-auto"
          >
            Restaurar slides removidos
          </button>
        </div>
      ) : null}

      {hasSlides ? (
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:auto-rows-[440px]">
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

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onOpenDeck}
          disabled={!hasSlides}
          data-presentation-surface="action-button"
          className="inline-flex h-12 w-full items-center justify-center rounded-[50px] bg-[rgba(22,117,184,0.5)] px-6 text-center text-[0.95rem] font-bold uppercase tracking-[0.08em] text-[#f8fafc] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:h-[74px] sm:w-auto sm:px-12 sm:text-[1.2rem]"
        >
          Modo apresentação
        </button>
      </div>
    </section>
  );
}
