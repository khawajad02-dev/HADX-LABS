"use client";

import { useEffect } from "react";

const SURFACE_SELECTOR = ".liquid-ui, .liquid-panel, [data-liquid-surface]";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function surfaceAtPoint(x: number, y: number): HTMLElement | null {
  const element = document.elementFromPoint(x, y);
  return element instanceof HTMLElement ? element.closest<HTMLElement>(SURFACE_SELECTOR) : null;
}

function setPointerPosition(surface: HTMLElement, clientX: number, clientY: number) {
  const rect = surface.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
  surface.style.setProperty("--liquid-pointer-x", `${x}%`);
  surface.style.setProperty("--liquid-pointer-y", `${y}%`);
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
  const progress = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
  const closestX = ax + progress * dx;
  const closestY = ay + progress * dy;
  return Math.hypot(px - closestX, py - closestY);
}

export default function LiquidGlassPhysics() {
  useEffect(() => {
    let raf = 0;
    let springValue = 0;
    let springVelocity = 0;
    let springTarget = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let activeSurface: HTMLElement | null = null;
    let hoveredSurface: HTMLElement | null = null;
    let pendingPointer: { clientX: number; clientY: number } | null = null;
    let rippleId = 0;
    let surfaceRefreshRaf = 0;
    const lightningTimers = new WeakMap<HTMLElement, number>();
    const surfaceCache = new Set<HTMLElement>();

    const refreshSurfaceCache = () => {
      surfaceCache.clear();
      document.querySelectorAll<HTMLElement>(SURFACE_SELECTOR).forEach((surface) => surfaceCache.add(surface));
    };

    const scheduleSurfaceCacheRefresh = () => {
      if (surfaceRefreshRaf !== 0) return;
      surfaceRefreshRaf = window.requestAnimationFrame(() => {
        surfaceRefreshRaf = 0;
        refreshSurfaceCache();
      });
    };

    const schedule = () => {
      if (raf === 0) raf = window.requestAnimationFrame(tick);
    };

    const processPointerMove = (clientX: number, clientY: number) => {
      const surface = surfaceAtPoint(clientX, clientY);
      if (hoveredSurface && hoveredSurface !== surface) {
        hoveredSurface.removeAttribute("data-liquid-near-light");
      }
      if (surface) {
        setPointerPosition(surface, clientX, clientY);
        surface.setAttribute("data-liquid-near-light", "true");
        if (activeSurface && activeSurface !== surface) activeSurface.removeAttribute("data-liquid-active");
        activeSurface = surface;
        hoveredSurface = surface;
      } else {
        hoveredSurface = null;
        if (activeSurface) activeSurface.removeAttribute("data-liquid-near-light");
      }
    };

    const tick = () => {
      raf = 0;
      if (pendingPointer) {
        const { clientX, clientY } = pendingPointer;
        pendingPointer = null;
        processPointerMove(clientX, clientY);
      }
      springVelocity += (springTarget - springValue) * 0.18;
      springVelocity *= 0.78;
      springValue += springVelocity;
      springTarget *= 0.86;

      document.documentElement.style.setProperty("--liquid-global-spring-y", `${springValue.toFixed(2)}px`);

      if (Math.abs(springValue) > 0.05 || Math.abs(springVelocity) > 0.05 || Math.abs(springTarget) > 0.05) {
        schedule();
      } else {
        document.documentElement.style.setProperty("--liquid-global-spring-y", "0px");
      }
    };

    const activateSurface = (surface: HTMLElement, clientX: number, clientY: number) => {
      activeSurface = surface;
      setPointerPosition(surface, clientX, clientY);
      surface.setAttribute("data-liquid-active", "true");

      const rect = surface.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / Math.max(1, rect.height)) * 100, 0, 100);
      surface.style.setProperty("--liquid-ripple-x", `${x}%`);
      surface.style.setProperty("--liquid-ripple-y", `${y}%`);
      const currentRipple = String(++rippleId);
      surface.setAttribute("data-liquid-ripple", currentRipple);
      window.setTimeout(() => {
        if (surface.getAttribute("data-liquid-ripple") === currentRipple) {
          surface.removeAttribute("data-liquid-ripple");
        }
      }, 760);
    };

    const clearActiveSurface = () => {
      if (!activeSurface) return;
      activeSurface.removeAttribute("data-liquid-active");
      activeSurface = null;
    };

    const handleLightning = (event: Event) => {
      const detail = (event as CustomEvent<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        intensity: number;
        radius: number;
      }>).detail;
      if (!detail) return;

      const reach = Math.max(116, detail.radius + 88);
      for (const surface of Array.from(surfaceCache)) {
        if (!surface.isConnected) continue;
        const rect = surface.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const distance = distanceToSegment(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          detail.startX,
          detail.startY,
          detail.endX,
          detail.endY,
        );
        const proximity = clamp(1 - distance / (reach + Math.min(rect.width, rect.height) * 0.28), 0, 1);
        if (proximity <= 0.08) continue;

        setPointerPosition(surface, detail.endX, detail.endY);
        surface.style.setProperty("--liquid-lightning-intensity", (proximity * detail.intensity).toFixed(2));
        surface.setAttribute("data-liquid-lightning", "true");
        const previousTimer = lightningTimers.get(surface);
        if (previousTimer) window.clearTimeout(previousTimer);
        const timer = window.setTimeout(() => {
          surface.removeAttribute("data-liquid-lightning");
          surface.style.removeProperty("--liquid-lightning-intensity");
        }, 560);
        lightningTimers.set(surface, timer);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return;
      const surface = surfaceAtPoint(event.clientX, event.clientY);
      if (surface) activateSurface(surface, event.clientX, event.clientY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pendingPointer = { clientX: event.clientX, clientY: event.clientY };
      schedule();
    };

    const handlePointerUp = () => {
      pendingPointer = null;
      clearActiveSurface();
    };
    const handlePointerCancel = () => {
      pendingPointer = null;
      clearActiveSurface();
    };

    const handleScroll = () => {
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = clamp((delta / elapsed) * 18, -3.5, 3.5);
      springTarget = clamp(springTarget + velocity, -4.5, 4.5);
      lastScrollY = window.scrollY;
      lastScrollTime = now;
      schedule();
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hadx:lightning", handleLightning);

    const surfaceObserver = new MutationObserver(scheduleSurfaceCacheRefresh);
    surfaceObserver.observe(document.body, { childList: true, subtree: true });
    refreshSurfaceCache();

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (surfaceRefreshRaf) window.cancelAnimationFrame(surfaceRefreshRaf);
      surfaceObserver.disconnect();
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hadx:lightning", handleLightning);
      document.documentElement.style.removeProperty("--liquid-global-spring-y");
    };
  }, []);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden"
      style={{ position: "fixed" }}
    >
      <defs>
        <filter id="hadx-liquid-refraction" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="2" seed="11" result="liquidNoise" />
          <feDisplacementMap in="SourceGraphic" in2="liquidNoise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
