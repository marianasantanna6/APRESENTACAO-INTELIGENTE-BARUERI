import { useEffect, useState } from "react";
import type { RefObject } from "react";

export function useFullscreenElement(
  elementRef: RefObject<HTMLElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(document.fullscreenElement === elementRef.current);
    }

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [elementRef]);

  async function enterFullscreen() {
    if (!elementRef.current || document.fullscreenElement === elementRef.current) {
      return;
    }

    await elementRef.current.requestFullscreen();
  }

  async function exitFullscreen() {
    if (!document.fullscreenElement) {
      return;
    }

    await document.exitFullscreen();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement === elementRef.current) {
      await exitFullscreen();
      return;
    }

    await enterFullscreen();
  }

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
