"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type PointerEvent } from "react";

export type CylinderProduct = {
  id: string;
  sku: string;
  title: string;
  category?: string | null;
  imageUrl?: string | null;
  media?: Array<{ url: string; type: "image" | "video" }>;
  priceLabel?: string;
  href?: string;
};

type CylinderProductSliderProps = {
  products: CylinderProduct[];
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function mediaFor(product: CylinderProduct) {
  return product.media?.find((item) => item.type === "image") || product.media?.[0] || (product.imageUrl ? { url: product.imageUrl, type: "image" as const } : null);
}

export default function CylinderProductSlider({ products, eyebrow = "CURVED ARCHIVE // LIVE ROTATION", title = "Explore Drops.", description = "Drag through the latest HADX silhouettes. The center signal stays locked while the archive curves around it.", className = "" }: CylinderProductSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const pointer = useRef<{ id: number; x: number; lastX: number; lastAt: number; velocity: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const visibleProducts = useMemo(() => products.slice(0, 6), [products]);

  if (!visibleProducts.length) return null;

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + visibleProducts.length) % visibleProducts.length);
    setDragX(0);
  };

  const snapFromDrag = (velocity: number, distance: number) => {
    if (Math.abs(distance) > 48 || Math.abs(velocity) > 0.35) move(distance < 0 || velocity < 0 ? 1 : -1);
    else setDragX(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, lastX: event.clientX, lastAt: performance.now(), velocity: 0, moved: false };
    suppressClick.current = false;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    const now = performance.now();
    const delta = event.clientX - active.lastX;
    active.velocity = delta / Math.max(1, now - active.lastAt);
    active.lastX = event.clientX;
    active.lastAt = now;
    const distance = event.clientX - active.x;
    if (Math.abs(distance) > 6) {
      active.moved = true;
      suppressClick.current = true;
    }
    setDragX(clamp(distance, -180, 180));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const active = pointer.current;
    pointer.current = null;
    if (!active || active.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    snapFromDrag(active.velocity, event.clientX - active.x);
    window.setTimeout(() => { suppressClick.current = false; }, 80);
  };

  return (
    <section className={`hadx-cylinder-section ${className}`} aria-labelledby="hadx-cylinder-title">
      <div className="hadx-cylinder-heading">
        <div>
          <p className="hadx-cylinder-eyebrow">{eyebrow}</p>
          <h2 id="hadx-cylinder-title">{title}</h2>
          <p>{description}</p>
        </div>
        <div className="hadx-cylinder-controls" aria-label="Product slider controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous product">←</button>
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(visibleProducts.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next product">→</button>
        </div>
      </div>

      <div className="hadx-cylinder-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="hadx-cylinder-halo" aria-hidden="true" />
        {visibleProducts.map((product, index) => {
          let offset = index - activeIndex;
          if (offset > visibleProducts.length / 2) offset -= visibleProducts.length;
          if (offset < -visibleProducts.length / 2) offset += visibleProducts.length;
          const distance = Math.abs(offset);
          const x = offset * 168 + dragX;
          const rotateY = offset * -27 + dragX * -0.08;
          const scale = Math.max(0.58, 1 - distance * 0.16);
          const opacity = Math.max(0.22, 1 - distance * 0.28);
          const media = mediaFor(product);
          const href = product.href || `/product/${product.sku}`;
          return (
            <Link
              key={product.id}
              href={href}
              onClick={(event) => { if (suppressClick.current) event.preventDefault(); }}
              className={`hadx-cylinder-card ${offset === 0 ? "is-active" : ""}`}
              style={{ transform: `translate3d(calc(-50% + ${x}px), -50%, ${-distance * 110}px) rotateY(${rotateY}deg) scale(${scale})`, opacity, zIndex: 20 - distance, transition: pointer.current ? "none" : "transform 520ms cubic-bezier(.22,1,.36,1), opacity 420ms ease" }}
              aria-label={`Open ${product.title}`}
            >
              <div className="hadx-cylinder-media">
                {media?.type === "video" ? <video src={media.url} muted playsInline loop autoPlay={offset === 0} preload={offset === 0 ? "metadata" : "none"} aria-label={product.title} /> : media?.url ? <img src={media.url} alt={product.title} loading={offset === 0 ? "eager" : "lazy"} decoding="async" /> : <span>NO SIGNAL</span>}
                <span className="hadx-cylinder-edge" aria-hidden="true" />
                <span className="hadx-cylinder-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="hadx-cylinder-copy"><strong>{product.title}</strong><span>{product.category || "ATELIER"}</span>{product.priceLabel ? <b>{product.priceLabel}</b> : null}</div>
            </Link>
          );
        })}
        <div className="hadx-cylinder-center-line" aria-hidden="true" />
      </div>
      <div className="hadx-cylinder-dots" aria-label="Product slider position">{visibleProducts.map((product, index) => <button type="button" key={product.id} aria-label={`Select product ${index + 1}`} aria-current={index === activeIndex} onClick={() => { setActiveIndex(index); setDragX(0); }} className={index === activeIndex ? "is-active" : ""} />)}</div>
    </section>
  );
}
