"use client";

import { useEffect } from "react";
import { pulseHaptic } from "@/lib/interaction-feedback";

const INTERACTIVE_SELECTOR = "button, a, [role=button], [role=option], input, select, textarea";

export default function InteractionFeedback() {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    let touchActive = false;
    let lastScrollY = window.scrollY;
    let lastPulseAt = 0;
    let lastTouchY = 0;
    let accumulatedDrag = 0;

    const onTouchStart = (event: TouchEvent) => {
      touchActive = true;
      lastTouchY = event.touches[0]?.clientY ?? 0;
      lastScrollY = window.scrollY;
      accumulatedDrag = 0;
      pulseHaptic(5);
    };
    const onScroll = () => {
      if (!touchActive) return;
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      accumulatedDrag += Math.abs(delta);
      if (accumulatedDrag < 72 || now - lastPulseAt < 105) return;
      accumulatedDrag = 0;
      lastPulseAt = now;
      pulseHaptic(4);
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastTouchY;
      if (Math.abs(y - lastTouchY) > 8) lastTouchY = y;
    };
    const onTouchEnd = () => {
      if (!touchActive) return;
      touchActive = false;
      pulseHaptic(7);
    };
    const onPointerUp = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(INTERACTIVE_SELECTOR)) pulseHaptic(7);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return null;
}
