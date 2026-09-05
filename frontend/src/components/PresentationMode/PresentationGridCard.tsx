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
    <div className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(20,33,51,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,33,51,0.11)]">
      {/* Preview area — fills available height, clips overflow */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenSolo(card.id)}
        onKeyDown={handleCardKeyDown}
        aria-label={`Abrir slide ${slideNumber}: ${card.title}`}
        className="relative min-h-0 flex-1 cursor-pointer overflow-hidden bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1675b8]/30"
      >
        <div className="pointer-events-none">
          <PresentationSlide card={card} data={data} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#1675b8]/0 opacity-0 transition-all duration-200 group-hover:bg-[#1675b8]/10 group-hover:opacity-100">
          <div className="flex h-10 w-10 translate-y-1 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform duration-200 group-hover:translate-y-0">
            <FiMaximize2 className="h-4 w-4 text-[#1675b8]" />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-center gap-3 border-t border-[#f1f5f9] px-4 py-3">
        <div className="min-w-0 flex-1">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
            Slide {slideNumber}
          </span>
          <p className="mt-0.5 truncate text-[0.82rem] font-semibold leading-tight text-[#1e1e1e]">
            {card.title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenSolo(card.id);
            }}
            aria-label={`Abrir ${card.title} em modo solo`}
            data-presentation-surface="card-action"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff6ff] text-[#1675b8] transition hover:bg-[#dbeafe]"
          >
            <FiMaximize2 className="h-3.5 w-3.5" />
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fef2f2] text-[#b91c1c] transition hover:bg-[#fee2e2]"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
