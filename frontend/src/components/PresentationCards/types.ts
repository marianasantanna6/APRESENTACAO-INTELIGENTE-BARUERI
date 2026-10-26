import type {
  PresentationCard,
  PresentationData,
} from "../../types/presentation";

export type PresentationCardVariant = "grid" | "stage" | "thumbnail";

export type PresentationCardComponentProps = {
  card: PresentationCard;
  data: PresentationData;
  variant?: PresentationCardVariant;
};
