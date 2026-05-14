import type { PresentationCardComponentProps } from "./types";
import { presentationCardComponents } from "./registry";

const THUMBNAIL_BASE_WIDTH = 560;
const THUMBNAIL_SCALE = 0.44;

export function PresentationSlide({
  card,
  data,
  variant = "grid",
}: PresentationCardComponentProps) {
  const CardComponent = presentationCardComponents[card.id];

  if (variant === "thumbnail") {
    return (
      <div className="h-[166px] w-[248px] overflow-hidden rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
        <div
          className="origin-top-left"
          style={{
            transform: `scale(${THUMBNAIL_SCALE})`,
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
