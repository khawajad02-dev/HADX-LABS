"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, animate, type PanInfo } from "framer-motion";
import GarmentMedia from "./GarmentMedia";

export type SliderProduct = {
  id: string;
  title: string;
  imageUrl: string | null;
  media?: Array<{ url: string; type: "image" | "video"; fileName?: string }>;
};

function mediaFor(product: SliderProduct) {
  return (
    product.media?.[0] ||
    (product.imageUrl ? { url: product.imageUrl, type: "image" as const } : null)
  );
}

const CARD_WIDTH = 340;
const CARD_GAP = 24;

export default function CurvedBandSlider({
  products,
  activeIndex,
  onSelect,
}: {
  products: SliderProduct[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [dragging, setDragging] = useState(false);
  const step = CARD_WIDTH + CARD_GAP;

  const settleTo = (index: number) => {
    const clamped = Math.max(0, Math.min(products.length - 1, index));
    onSelect(clamped);
    animate(x, -clamped * step, { type: "spring", stiffness: 260, damping: 32 });
  };

  const onDragEnd = (_e: MouseEvent | TouchEvent | ReactPointerEvent, info: PanInfo) => {
    setDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    let target = activeIndex;
    if (Math.abs(velocity) > 500) target = activeIndex - (velocity > 0 ? 1 : -1);
    else if (Math.abs(offset) > step / 3) target = activeIndex - (offset > 0 ? 1 : -1);
    settleTo(target);
  };

  const alignedX = -activeIndex * step;
  if (!dragging && x.get() !== alignedX) x.set(alignedX);

  return (
    <div className="curved-band-wrap" aria-label="Product gallery slider">
      <div className="curved-band-frame">
        <div className="curved-band-edge curved-band-edge-top" aria-hidden="true" />
        <motion.div
          ref={trackRef}
          className="curved-band-track"
          style={{ x }}
          drag="x"
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
        >
          {products.map((product, index) => {
            const media = mediaFor(product);
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);
            return (
              <motion.button
                key={product.id}
                type="button"
                className={`curved-band-card ${isActive ? "is-active" : ""}`}
                style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
                animate={{ scale: isActive ? 1 : 0.92, opacity: distance > 2 ? 0 : isActive ? 1 : 0.55 }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                onClick={() => settleTo(index)}
                aria-label={`Show ${product.title}`}
              >
                {media?.type === "video" ? (
                  <video src={media.url} muted playsInline loop autoPlay={isActive} preload={isActive ? "metadata" : "none"} className="curved-band-media" />
                ) : media ? (
                  <GarmentMedia src={media.url} alt={product.title} eager={isActive} className="curved-band-media" />
                ) : (
                  <span className="curved-band-empty">NO MEDIA</span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
        <div className="curved-band-edge curved-band-edge-bottom" aria-hidden="true" />
      </div>
      <div className="curved-band-controls">
        <button type="button" onClick={() => settleTo(activeIndex - 1)} aria-label="Previous">←</button>
        <button type="button" onClick={() => settleTo(activeIndex + 1)} aria-label="Next">→</button>
      </div>
    </div>
  );
}
