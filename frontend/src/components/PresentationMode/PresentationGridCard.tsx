import type { KeyboardEvent } from "react";
import { FiMaximize2, FiTrash2 } from "react-icons/fi";
import type { PresentationCard, PresentationData } from "../../types/presentation";
import { PresentationSlide } from "../PresentationCards";

type PresentationGridCardProps = {
  canDelete?: boolean;
  card: PresentationCard;
  data: PresentationData;
  slideNumber: number;
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onOpenSolo: (slideId: PresentationCard["id"]) => void;
};

export function PresentationGridCard({
  canDelete = true,
  card,
  data,
  slideNumber,
  onDeleteSlide,
  onOpenSolo,
}: PresentationGridCardProps) {
  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onOpenSolo(card.id);
  }

  return (
    <div className="group flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div
          data-presentation-surface="slide-badge"
          className="inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] shadow-[0_12px_24px_rgba(13,82,131,0.12)]"
        >
          Slide {slideNumber}
        </div>

        <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenSolo(card.id);
            }}
            aria-label={`Abrir ${card.title} em modo solo`}
            data-presentation-surface="card-action"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#0d5283] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white sm:h-10 sm:w-10"
          >
            <FiMaximize2 className="h-4.5 w-4.5" />
          </button>

          {canDelete && onDeleteSlide ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteSlide(card.id);
              }}
              aria-label={`Excluir ${card.title}`}
              data-presentation-surface="card-action"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#b91c1c] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white sm:h-10 sm:w-10"
            >
              <FiTrash2 className="h-4.5 w-4.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenSolo(card.id)}
        onKeyDown={handleCardKeyDown}
        aria-label={`Abrir slide ${slideNumber}: ${card.title}`}
        className="relative min-h-0 flex-1 cursor-pointer rounded-[24px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-28px_rgba(13,82,131,0.46)] focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
      >
        <PresentationSlide card={card} data={data} />
      </div>
    </div>
  );
}
