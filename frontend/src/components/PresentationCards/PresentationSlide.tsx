import type { PresentationCardComponentProps } from "./types";
import { presentationCardComponents } from "./registry";

const THUMBNAIL_BASE_WIDTH = 560;

export function PresentationSlide({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  const CardComponent = presentationCardComponents[card.id];

  if (variant === "thumbnail") {
    return (
      <div
        data-presentation-surface="thumbnail-frame"
        className="h-[132px] w-[196px] overflow-hidden rounded-[18px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] sm:h-[150px] sm:w-[224px]"
      >
        <div
          className="origin-top-left [--thumbnail-scale:0.35] sm:[--thumbnail-scale:0.4]"
          style={{
            transform: "scale(var(--thumbnail-scale))",
            width: `${THUMBNAIL_BASE_WIDTH}px`,
          }}
        >
          <CardComponent card={card} data={data} variant="grid" />
        </div>
      </div>
    );
  }

  return <CardComponent card={card} data={data} variant={variant} />;
}
