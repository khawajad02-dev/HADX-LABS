"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { ProductMedia } from "@/lib/product-meta";
import GarmentMedia from "./GarmentMedia";

export default function ProductMediaGallery({ title, media }: { title: string; media: ProductMedia[] }) {
  const galleryMedia = useMemo(
    () => media.filter((item) => item && typeof item.url === "string" && item.url.trim()).map((item) => ({ ...item, url: item.url.trim() })),
    [media],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const activeMedia = galleryMedia[activeIndex];

  useEffect(() => {
    setActiveIndex((current) => (galleryMedia.length ? Math.min(current, galleryMedia.length - 1) : 0));
    startX.current = null;
  }, [galleryMedia.length]);

  const move = (direction: 1 | -1) => {
    if (galleryMedia.length < 2) return;
    setActiveIndex((current) => (current + direction + galleryMedia.length) % galleryMedia.length);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const initialX = startX.current;
    startX.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (initialX === null || galleryMedia.length < 2) return;
    const distance = event.clientX - initialX;
    if (Math.abs(distance) >= 36) move(distance < 0 ? 1 : -1);
  };

  const onPointerCancel = () => {
    startX.current = null;
  };

  if (!activeMedia) {
    return <div data-liquid-surface className="liquid-panel relative aspect-[4/5] rounded-2xl bg-black/10"><div className="grid h-full place-items-center text-[10px] font-mono uppercase text-white/35">No preview available</div></div>;
  }

  return (
    <div data-liquid-surface className="liquid-panel relative rounded-2xl bg-black/10 p-2">
      <div
        className="group relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-xl border border-white/10 bg-black/10 [perspective:1200px]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        aria-label={`${title} media gallery`}
      >
        <div key={`${activeMedia.url}-${activeIndex}`} className="h-full w-full animate-[hadx-media-in_320ms_ease-out] [transform-style:preserve-3d]">
          {activeMedia.type === "video" ? (
            <video src={activeMedia.url} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={title} />
          ) : (
            <GarmentMedia src={activeMedia.url} alt={`${title}, image ${activeIndex + 1} of ${galleryMedia.length}`} eager={activeIndex === 0} className="h-full w-full object-contain" />
          )}
        </div>

        {galleryMedia.length > 1 ? (
          <>
            <button type="button" onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label="Previous product media" className="liquid-ui absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-sm text-white/80 transition-transform hover:scale-105 active:scale-95">←</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); move(1); }} aria-label="Next product media" className="liquid-ui absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/20 text-sm text-white/80 transition-transform hover:scale-105 active:scale-95">→</button>
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2" aria-live="polite">
              {galleryMedia.map((item, index) => <span key={`${item.url}-${index}`} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-8 bg-amber-200" : "w-1.5 bg-white/40"}`} />)}
            </div>
            <span className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[8px] font-mono uppercase tracking-[0.18em] text-white/60">Swipe / drag {activeIndex + 1} / {galleryMedia.length}</span>
          </>
        ) : null}
      </div>

      {galleryMedia.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Product media thumbnails">
          {galleryMedia.map((item, index) => (
            <button type="button" key={`${item.url}-${index}`} onClick={() => setActiveIndex(index)} aria-label={`Show ${title} media ${index + 1}`} aria-pressed={index === activeIndex} className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border transition-colors ${index === activeIndex ? "border-amber-200/80" : "border-white/10 hover:border-white/40"}`}>
              {item.type === "video" ? <video src={item.url} muted playsInline preload="none" className="h-full w-full object-cover" aria-hidden="true" /> : <img src={item.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[8px] font-mono text-white/70">{index + 1}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
