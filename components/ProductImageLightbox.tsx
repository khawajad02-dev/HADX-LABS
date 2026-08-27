"use client";

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

type ProductImageLightboxProps = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export default function ProductImageLightbox({ src, alt, open, onClose }: ProductImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);

  if (!open) return null;

  const changeZoom = (delta: number) => {
    setZoom((current) => {
      const next = clampZoom(current + delta);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || zoom <= 1) return;
    setOffset({
      x: dragStart.current.offsetX + event.clientX - dragStart.current.x,
      y: dragStart.current.offsetY + event.clientY - dragStart.current.y,
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
  };

  const onImageClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (zoom > 1) resetZoom();
      else setZoom(2);
    }
    lastTap.current = now;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} full-screen image viewer`}
      className="fixed inset-0 z-[20000] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { dragStart.current = null; }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_55%)]" />
      <img
        src={src}
        alt={alt}
        onClick={onImageClick}
        draggable={false}
        className="relative z-[1] max-h-[92dvh] max-w-[94vw] select-none object-contain transition-transform duration-150 ease-out"
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`, transformOrigin: "center center", cursor: zoom > 1 ? "grab" : "zoom-in" }}
      />
      <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-3 p-5 sm:p-8">
        <span className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/70">Tap twice or use zoom</span>
        <button type="button" onClick={onClose} className="liquid-ui rounded-full border border-white/20 bg-black/40 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-100 hover:border-amber-200/70">Close ×</button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-center gap-2 p-5 sm:p-8">
        <button type="button" onClick={() => changeZoom(-0.25)} className="liquid-ui rounded-full border border-white/20 bg-black/40 px-4 py-3 text-lg leading-none text-amber-100" aria-label="Zoom out">−</button>
        <button type="button" onClick={resetZoom} className="liquid-ui rounded-full border border-white/20 bg-black/40 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-white/80" aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
        <button type="button" onClick={() => changeZoom(0.25)} className="liquid-ui rounded-full border border-white/20 bg-black/40 px-4 py-3 text-lg leading-none text-amber-100" aria-label="Zoom in">+</button>
      </div>
    </div>
  );
}
