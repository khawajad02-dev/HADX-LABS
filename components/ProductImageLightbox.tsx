"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";

const MIN_ZOOM = 1;
const DOUBLE_TAP_ZOOM = 3;
const MAX_ZOOM = 5;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

type Point = { x: number; y: number };
type Offset = { x: number; y: number };
type Gesture =
  | { mode: "pan"; startPoint: Point; startOffset: Offset }
  | { mode: "pinch"; startDistance: number; startZoom: number; startOffset: Offset };

type ProductImageLightboxProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

const distanceBetween = (first: Point, second: Point) => Math.hypot(second.x - first.x, second.y - first.y);

export default function ProductImageLightbox({ src, alt, open, onClose }: ProductImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    const activePointers = pointers.current;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      activePointers.clear();
      gesture.current = null;
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      lastTap.current = 0;
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const changeZoom = (delta: number) => {
    setZoom((current) => {
      const next = clampZoom(current + delta);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.35 : -0.35);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2) {
      const [first, second] = Array.from(pointers.current.values());
      gesture.current = {
        mode: "pinch",
        startDistance: distanceBetween(first, second),
        startZoom: zoom,
        startOffset: offset,
      };
      return;
    }

    gesture.current = {
      mode: "pan",
      startPoint: { x: event.clientX, y: event.clientY },
      startOffset: offset,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const activeGesture = gesture.current;

    if (pointers.current.size >= 2 && activeGesture?.mode === "pinch") {
      const [first, second] = Array.from(pointers.current.values());
      const nextZoom = clampZoom(activeGesture.startZoom * (distanceBetween(first, second) / activeGesture.startDistance));
      setZoom(nextZoom);
      if (nextZoom === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return;
    }

    if (pointers.current.size === 1 && activeGesture?.mode === "pan" && zoom > MIN_ZOOM) {
      setOffset({
        x: activeGesture.startOffset.x + event.clientX - activeGesture.startPoint.x,
        y: activeGesture.startOffset.y + event.clientY - activeGesture.startPoint.y,
      });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasSinglePointer = pointers.current.size === 1;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    if (pointers.current.size === 1) {
      const [remaining] = Array.from(pointers.current.values());
      gesture.current = {
        mode: "pan",
        startPoint: remaining,
        startOffset: offset,
      };
      return;
    }

    gesture.current = null;
    if (!wasSinglePointer) return;

    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (zoom > MIN_ZOOM) resetZoom();
      else {
        setZoom(DOUBLE_TAP_ZOOM);
        setOffset({ x: 0, y: 0 });
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    gesture.current = null;
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} full-screen image viewer`}
      className="fixed inset-0 z-[20000] flex h-[100dvh] w-full flex-col overflow-hidden bg-black/98 text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08),transparent_58%)]" />
      <header className="relative z-[2] flex items-center justify-end px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/45 text-2xl font-light text-white/85 transition-colors hover:border-amber-200/70 hover:text-amber-100 active:scale-95"
          aria-label="Close image viewer"
        >
          ×
        </button>
      </header>

      <div
        className="relative z-[1] flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden px-3 pb-3 sm:px-8"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label="Zoomable product image"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="pointer-events-none max-h-full max-w-full select-none object-contain transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      </div>

      <footer className="relative z-[2] flex items-center justify-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={() => changeZoom(-0.5)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-xl font-light text-amber-100 transition-colors hover:border-amber-200/70 active:scale-95"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="min-w-16 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[10px] font-mono tracking-[0.18em] text-white/70 transition-colors hover:border-amber-200/60 hover:text-amber-100"
          aria-label="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => changeZoom(0.5)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/45 text-xl font-light text-amber-100 transition-colors hover:border-amber-200/70 active:scale-95"
          aria-label="Zoom in"
        >
          +
        </button>
      </footer>
    </div>,
    document.body,
  );
}
