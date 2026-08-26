"use client";

import { useEffect } from "react";

/**
 * Locks background scroll while a full-screen/bottom-sheet overlay is open.
 * Plain `overflow: hidden` on <body> stops desktop wheel-scroll but not touch
 * scroll on iOS Safari, which keeps rubber-banding the page underneath a
 * fixed-position overlay. Taking the body out of flow (`position: fixed`)
 * blocks that too; the scroll position is restored on unlock.
 */
export function useLockBodyScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [enabled]);
}
