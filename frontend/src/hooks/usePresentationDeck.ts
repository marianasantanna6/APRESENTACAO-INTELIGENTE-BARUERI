import { useEffect, useState } from "react";
import type { PresentationCard, PresentationCardId } from "../types/presentation";

export type PresentationViewerMode = "closed" | "deck" | "solo";

function readHiddenSlideIds(storageKey: string) {
  if (typeof window === "undefined") {
    return [] as PresentationCardId[];
  }

  const rawValue = window.sessionStorage.getItem(storageKey);

  if (!rawValue) {
    return [] as PresentationCardId[];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as PresentationCardId[]) : [];
  } catch {
    return [] as PresentationCardId[];
  }
}

export function usePresentationDeck({
  cards,
  storageKey,
}: {
  cards: PresentationCard[];
  storageKey: string;
}) {
  const [hiddenSlideIds, setHiddenSlideIds] = useState<PresentationCardId[]>(
    () => readHiddenSlideIds(storageKey),
  );
  const [syncedStorageKey, setSyncedStorageKey] = useState(storageKey);
  const [activeSlideId, setActiveSlideId] = useState<PresentationCardId | null>(
    cards[0]?.id ?? null,
  );
  const [viewerMode, setViewerMode] = useState<PresentationViewerMode>("closed");
  const visibleSlides = cards.filter((card) => !hiddenSlideIds.includes(card.id));
  const activeSlide =
    visibleSlides.find((card) => card.id === activeSlideId) ?? visibleSlides[0] ?? null;
  const activeSlideIndex = activeSlide
    ? visibleSlides.findIndex((card) => card.id === activeSlide.id)
    : -1;

  useEffect(() => {
    setHiddenSlideIds(readHiddenSlideIds(storageKey));
    setSyncedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || syncedStorageKey !== storageKey) {
      return;
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(hiddenSlideIds));
  }, [hiddenSlideIds, storageKey, syncedStorageKey]);

  useEffect(() => {
    if (!visibleSlides.length) {
      setActiveSlideId(null);
      setViewerMode("closed");
      return;
    }

    if (!activeSlide) {
      setActiveSlideId(visibleSlides[0].id);
    }
  }, [activeSlide, visibleSlides]);

  function selectSlide(slideId: PresentationCardId) {
    if (!visibleSlides.some((card) => card.id === slideId)) {
      return;
    }

    setActiveSlideId(slideId);
  }

  function openDeck(slideId?: PresentationCardId) {
    const nextSlideId = slideId ?? activeSlide?.id ?? visibleSlides[0]?.id;

    if (!nextSlideId) {
      return;
    }

    setActiveSlideId(nextSlideId);
    setViewerMode("deck");
  }

  function openSolo(slideId?: PresentationCardId) {
    const nextSlideId = slideId ?? activeSlide?.id ?? visibleSlides[0]?.id;

    if (!nextSlideId) {
      return;
    }

    setActiveSlideId(nextSlideId);
    setViewerMode("solo");
  }

  function closeViewer() {
    setViewerMode("closed");
  }

  function openPreviousSlide() {
    if (activeSlideIndex <= 0) {
      return;
    }

    setActiveSlideId(visibleSlides[activeSlideIndex - 1].id);
  }

  function openNextSlide() {
    if (activeSlideIndex < 0 || activeSlideIndex >= visibleSlides.length - 1) {
      return;
    }

    setActiveSlideId(visibleSlides[activeSlideIndex + 1].id);
  }

  function deleteSlide(slideId: PresentationCardId) {
    if (!visibleSlides.some((card) => card.id === slideId)) {
      return;
    }

    const remainingSlides = visibleSlides.filter((card) => card.id !== slideId);

    setHiddenSlideIds((currentIds) =>
      currentIds.includes(slideId) ? currentIds : [...currentIds, slideId],
    );

    if (!remainingSlides.length) {
      setActiveSlideId(null);
      setViewerMode("closed");
      return;
    }

    if (slideId === activeSlideId) {
      const nextIndex = Math.min(activeSlideIndex, remainingSlides.length - 1);
      setActiveSlideId(remainingSlides[nextIndex].id);
    }
  }

  function restoreSlides() {
    setHiddenSlideIds([]);

    if (!activeSlideId && cards[0]) {
      setActiveSlideId(cards[0].id);
    }
  }

  return {
    activeSlide,
    activeSlideId,
    activeSlideIndex,
    closeViewer,
    deleteSlide,
    hasHiddenSlides: hiddenSlideIds.length > 0,
    hiddenSlideIds,
    openDeck,
    openNextSlide,
    openPreviousSlide,
    openSolo,
    restoreSlides,
    selectSlide,
    viewerMode,
    visibleSlides,
  };
}
