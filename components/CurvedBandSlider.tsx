"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import GarmentMedia from "./GarmentMedia";

export type SliderProduct = {
  id: string;
  title: string;
  imageUrl: string | null;
  media?: Array<{ url: string; type: "image" | "video"; fileName?: string }>;
  category?: string | null;
  price?: number;
  currency?: string;
  href?: string;
};

const SPRING = { type: "spring", stiffness: 260, damping: 32 } as const;

function mediaFor(product: SliderProduct) {
  return (
    product.media?.[0] ||
    (product.imageUrl ? { url: product.imageUrl, type: "image" as const } : null)
  );
}

export default function CurvedBandSlider({
  products,
  activeIndex,
  onSelect,
}: {
  products: SliderProduct[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const placed = useRef(false);
  const dragged = useRef(false);
  const [m, setM] = useState({ base: 0, step: 0 });

  const last = Math.max(0, products.length - 1);
  const index = Math.min(Math.max(0, activeIndex), last);
  const indexRef = useRef(index);
  indexRef.current = index;

  // Card width + gap are measured from the real DOM, so CSS is the single
  // source of truth. No hardcoded numbers that can drift out of sync.
  const measure = useCallback(() => {
    const frame = frameRef.current;
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>(".curved-band-card");
    if (!frame || !track || !card) return;
    const gap = parseFloat(getComputedStyle(card).marginRight) || 0;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const step = card.offsetWidth + gap;
    const base = (frame.clientWidth - card.offsetWidth) / 2 - pad;
    if (!placed.current) {
      x.set(base - indexRef.current * step);
      placed.current = true;
    }
    setM((prev) => (prev.base === base && prev.step === step ? prev : { base, step }));
  }, [x]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (frameRef.current) ro.observe(frameRef.current);
    const card = trackRef.current?.querySelector(".curved-band-card");
    if (card) ro.observe(card);
    return () => ro.disconnect();
  }, [measure, products.length]);

  // Active card is always centered in the frame.
  const target = m.base - index * m.step;
  useEffect(() => {
    if (!m.step) return;
    const controls = animate(x, target, SPRING);
    return () => controls.stop();
  }, [target, m.step, x]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    if (clamped !== index) onSelect(clamped);
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const moved = info.offset.x;
    const speed = info.velocity.x;
    let dir = 0;
    if (Math.abs(speed) > 500) dir = speed < 0 ? 1 : -1;
    else if (Math.abs(moved) > m.step / 3) dir = moved < 0 ? 1 : -1;
    const next = Math.max(0, Math.min(last, index + dir));
    if (next !== index) onSelect(next);
    animate(x, m.base - next * m.step, SPRING);
    setTimeout(() => {
      dragged.current = false;
    }, 0);
  };

  if (!products.length) return null;

  return (
    <div className="curved-band-wrap" aria-label="Product gallery slider">
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="curved-band-clip" clipPathUnits="objectBoundingBox">
            <path d="M0,0 Q0.5,0.12 1,0 L1,1 Q0.5,0.88 0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div ref={frameRef} className="curved-band-frame">
        <motion.div
          ref={trackRef}
          className="curved-band-track"
          style={{ x, opacity: m.step ? 1 : 0 }}
          drag="x"
          dragElastic={0.15}
          dragMomentum={false}
          dragConstraints={{ left: m.base - last * m.step, right: m.base }}
          onDragStart={() => {
            dragged.current = true;
          }}
          onDragEnd={onDragEnd}
        >
          {products.map((product, i) => {
            const media = mediaFor(product);
            const isActive = i === index;
            return (
              <motion.button
                key={product.id}
                type="button"
                className={`curved-band-card${isActive ? " is-active" : ""}`}
                animate={{
                  scale: isActive ? 1 : 0.92,
                  opacity: Math.abs(i - index) > 2 ? 0 : isActive ? 1 : 0.55,
                }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                onClick={() => {
                  if (!dragged.current) {
                    go(i);
                    if (product.href) window.location.assign(product.href);
                  }
                }}
                aria-label={`Show ${product.title}`}
              >
                {media?.type === "video" ? (
                  <video
                    src={media.url}
                    muted
                    playsInline
                    loop
                    autoPlay={isActive}
                    preload={isActive ? "metadata" : "none"}
                    className="curved-band-media"
                  />
                ) : media ? (
                  <GarmentMedia
                    src={media.url}
                    alt={product.title}
                    eager={isActive}
                    className="curved-band-media"
                  />
                ) : (
                  <span className="curved-band-empty">NO MEDIA</span>
                )}
                <span className="curved-band-caption">
                  <b>{product.title}</b>
                  {typeof product.price === "number" && (
                    <small>
                      {product.category || "ATELIER"} // {product.currency || "PKR"} {product.price.toLocaleString()}
                    </small>
                  )}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      <div className="curved-band-controls">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous">
          ←
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next">
          →
        </button>
      </div>
    </div>
  );
}
