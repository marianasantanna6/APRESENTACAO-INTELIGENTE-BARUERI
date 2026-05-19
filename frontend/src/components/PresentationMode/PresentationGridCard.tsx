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
    <div className="group relative h-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenSolo(card.id)}
        onKeyDown={handleCardKeyDown}
        aria-label={`Abrir slide ${slideNumber}: ${card.title}`}
        className="h-full cursor-pointer rounded-[18px] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_-28px_rgba(13,82,131,0.6)] focus:outline-none focus:ring-4 focus:ring-[#1675b8]/15"
      >
        <PresentationSlide card={card} data={data} />
      </div>

      <div className="absolute left-4 top-4 rounded-full bg-[#0d5283] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(13,82,131,0.28)]">
        Slide {slideNumber}
      </div>

      <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSolo(card.id);
          }}
          aria-label={`Abrir ${card.title} em modo solo`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[#0d5283] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[#b91c1c] shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            <FiTrash2 className="h-4.5 w-4.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
