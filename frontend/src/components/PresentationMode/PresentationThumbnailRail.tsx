import { FiMaximize2, FiTrash2 } from "react-icons/fi";
import type { PresentationCard, PresentationData } from "../../types/presentation";
import { PresentationSlide } from "../PresentationCards";

type PresentationThumbnailRailProps = {
  activeSlideId: PresentationCard["id"] | null;
  canDelete?: boolean;
  data: PresentationData;
  slides: PresentationCard[];
  onDeleteSlide?: (slideId: PresentationCard["id"]) => void;
  onOpenSolo: (slideId: PresentationCard["id"]) => void;
  onSelectSlide: (slideId: PresentationCard["id"]) => void;
};

export function PresentationThumbnailRail({
  activeSlideId,
  canDelete = true,
  data,
  slides,
  onDeleteSlide,
  onOpenSolo,
  onSelectSlide,
}: PresentationThumbnailRailProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(98deg,#ffffff_0.9%,#ececec_100%)] px-4 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[1rem] font-bold text-[#1e1e1e]">Slides da apresentação</h2>
          <p className="mt-1 text-[0.82rem] text-[#5b6474]">
            Clique para selecionar. Use o botão de ampliar para abrir solo.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#0d5283] shadow-[0_8px_20px_rgba(13,82,131,0.12)]">
          {slides.length} slides
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;

          return (
            <div
              key={slide.id}
              className={`shrink-0 rounded-[24px] p-2 transition ${
                isActive
                  ? "bg-white shadow-[0_14px_28px_rgba(13,82,131,0.16)]"
                  : "bg-white/80 shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectSlide(slide.id)}
                className="block text-left"
                aria-label={`Selecionar slide ${index + 1}: ${slide.title}`}
              >
                <PresentationSlide card={slide} data={data} variant="thumbnail" />
              </button>

              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#0d5283]">
                    Slide {index + 1}
                  </p>
                  <p className="mt-1 max-w-[150px] truncate text-[0.78rem] text-[#4b5563]">
                    {slide.title}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenSolo(slide.id)}
                    aria-label={`Abrir ${slide.title} em modo solo`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff] text-[#0d5283] transition hover:-translate-y-0.5"
                  >
                    <FiMaximize2 className="h-4 w-4" />
                  </button>

                  {canDelete && onDeleteSlide ? (
                    <button
                      type="button"
                      onClick={() => onDeleteSlide(slide.id)}
                      aria-label={`Excluir ${slide.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1f2] text-[#b91c1c] transition hover:-translate-y-0.5"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
