import type {
  PresentationCardId,
  PresentationMockData,
} from "../../types/presentation";

export type { PresentationCardId, PresentationMockData };

export type DashboardSlideAction = {
  onOpenSlide?: (slideId: PresentationCardId) => void;
};
