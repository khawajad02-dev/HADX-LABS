"use client";

import { useEffect } from "react";
import { pulseHaptic } from "@/lib/interaction-feedback";

const MAX_PULL = 88;
const RESISTANCE = 0.28;

function setPull(amount: number, settling = false) {
  const surface = document.getElementById("hadx-scroll-surface");
  if (!surface) return;
  surface.classList.toggle("hadx-edge-settling", settling);
  surface.style.setProperty("--hadx-edge-pull", `${amount}px`);
}

export default function EdgeOverscroll() {
  useEffect(() => {
    const surface = document.getElementById("hadx-scroll-surface");
    if (!surface) return;

    let startY = 0;
    let lastY = 0;
    let activeEdge: "top" | "bottom" | null = null;
    let notified = false;

    const atTop = () => window.scrollY <= 1;
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    const begin = (y: number) => {
      startY = y;
      lastY = y;
      activeEdge = null;
      notified = false;
      surface.classList.remove("hadx-edge-settling");
    };

    const move = (y: number, event?: TouchEvent) => {
      const totalDelta = y - startY;
      const delta = y - lastY;
      lastY = y;

      if (!activeEdge) {
        if (atTop() && totalDelta > 0) activeEdge = "top";
        else if (atBottom() && totalDelta < 0) activeEdge = "bottom";
      }

      if (!activeEdge) return;
      const rawPull = activeEdge === "top" ? totalDelta : -totalDelta;
      const pull = Math.min(MAX_PULL, Math.sqrt(Math.max(0, rawPull) * 22) * RESISTANCE + Math.max(0, rawPull) * 0.16);
      if (pull <= 0) return;
      event?.preventDefault();
      setPull(activeEdge === "top" ? pull : -pull);
      if (!notified && Math.abs(delta) > 0) {
        notified = true;
        pulseHaptic(6);
      }
    };

    const settle = () => {
      if (!activeEdge) return;
      setPull(0, true);
      window.setTimeout(() => setPull(0), 460);
      activeEdge = null;
      notified = false;
    };

    const onTouchStart = (event: TouchEvent) => begin(event.touches[0]?.clientY ?? 0);
    const onTouchMove = (event: TouchEvent) => move(event.touches[0]?.clientY ?? lastY, event);
    const onWheel = (event: WheelEvent) => {
      if (activeEdge) return;
      if (atTop() && event.deltaY < 0) activeEdge = "top";
      else if (atBottom() && event.deltaY > 0) activeEdge = "bottom";
      else return;
      const pull = Math.min(MAX_PULL, Math.max(8, Math.abs(event.deltaY) * 0.24));
      event.preventDefault();
      setPull(activeEdge === "top" ? pull : -pull);
      pulseHaptic(4);
      window.clearTimeout((onWheel as typeof onWheel & { timer?: number }).timer);
      (onWheel as typeof onWheel & { timer?: number }).timer = window.setTimeout(settle, 130);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", settle, { passive: true });
    window.addEventListener("touchcancel", settle, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", settle);
      window.removeEventListener("touchcancel", settle);
      window.removeEventListener("wheel", onWheel);
      setPull(0);
    };
  }, []);

  return null;
}
