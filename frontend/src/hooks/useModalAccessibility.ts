import { useEffect, useEffectEvent, useRef } from "react";

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function useModalAccessibility({
  closeOnEscape = true,
  isOpen,
  onClose,
  initialFocusSelector,
}: {
  closeOnEscape?: boolean;
  isOpen: boolean;
  onClose: () => void;
  initialFocusSelector?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleClose = useEffectEvent(onClose);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen || typeof document === "undefined") {
      return;
    }

    const previouslyFocusedElement = previouslyFocusedElementRef.current;
    previouslyFocusedElementRef.current = null;

    if (!previouslyFocusedElement) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      previouslyFocusedElement.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const modalElement = containerRef.current;

    if (!modalElement) {
      return;
    }

    if (!previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }

    const focusInitialElement = () => {
      if (
        document.activeElement instanceof HTMLElement
        && modalElement.contains(document.activeElement)
      ) {
        return;
      }

      const preferredElement = initialFocusSelector
        ? modalElement.querySelector<HTMLElement>(initialFocusSelector)
        : null;
      const [firstFocusableElement] = getFocusableElements(modalElement);
      const nextFocusedElement = preferredElement ?? firstFocusableElement ?? modalElement;

      nextFocusedElement.focus();
    };

    const animationFrameId = window.requestAnimationFrame(focusInitialElement);

    function handleKeyDown(event: KeyboardEvent) {
      if (closeOnEscape && event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(modalElement);

      if (!focusableElements.length) {
        event.preventDefault();
        modalElement.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstFocusableElement || activeElement === modalElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        }

        return;
      }

      if (activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, initialFocusSelector, isOpen]);

  return containerRef;
}
