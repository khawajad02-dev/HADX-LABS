'use client';

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { motion, type PanInfo } from "framer-motion";

import CurrencySwitcher from "@/components/CurrencySwitcher";
import StorefrontSearch from "@/components/StorefrontSearch";
import GarmentMedia from "./GarmentMedia";

export type Product = {
  id: string;
  sku?: string;
  title: string;
  price: number;
  currency?: "USD" | "PKR" | "INR";
  prices?: { USD?: number; PKR?: number; INR?: number };
  imageUrl: string | null;
  media?: Array<{ url: string; type: "image" | "video"; fileName?: string }>;
  category?: string | null;
  availableSizes?: string[];
};

type DisplayCurrency = "USD" | "PKR" | "INR";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const GOLD = "#d8a94f";

function formatMoney(product: Product) {
  const prefix = product.currency === "PKR" ? "PKR" : product.currency === "INR" ? "₹" : "$";
  return `${prefix} ${Number(product.price).toLocaleString()}`;
}

function mediaFor(product: Product) {
  return product.media?.[0] || (product.imageUrl ? { url: product.imageUrl, type: "image" as const } : null);
}

function ProductMedia({ product, active }: { product: Product; active: boolean }) {
  const media = mediaFor(product);
  if (!media) return <span className="reference-empty-media">NO MEDIA</span>;
  if (media.type === "video") {
    return <video src={media.url} muted playsInline loop autoPlay={active} preload={active ? "metadata" : "none"} className="reference-product-media" aria-label={product.title} />;
  }
  return <GarmentMedia src={media.url} alt={product.title} eager={active} className="reference-product-media" />;
}

function productPath(product: Product, size?: string) {
  const params = new URLSearchParams({ currency: product.currency || "USD" });
  if (size) params.set("size", size);
  return `/product/${product.sku || product.id}?${params.toString()}`;
}

function checkoutPath(product: Product, size: string) {
  const params = new URLSearchParams({ productId: product.id, currency: product.currency || "USD", size });
  return `/checkout?${params.toString()}`;
}

function relativeOffset(index: number, activeIndex: number, count: number, direction: 1 | -1) {
  if (index === activeIndex) return 0;
  if (count === 2) return direction === 1 ? -1 : 1;
  let offset = (index - activeIndex + count) % count;
  if (offset > count / 2) offset -= count;
  return offset;
}

function stagePosition(offset: number) {
  const distance = Math.abs(offset);
  const side = offset < 0 ? -1 : 1;
  if (offset === 0) {
    return { x: 0, y: -18, z: 120, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1 };
  }
  return {
    x: side * (distance === 1 ? 250 : 390),
    y: 28 + distance * 16,
    z: -120 - (distance - 1) * 120,
    rotateY: side * -34,
    rotateZ: side * (distance === 1 ? 3 : 7),
    scale: Math.max(0.42, 0.72 - (distance - 1) * 0.14),
    opacity: distance === 1 ? 0.24 : 0.06,
  };
}

export default function FeaturedShowcase({ products = [], initialCurrency = "USD" }: { products: Product[]; initialCurrency?: DisplayCurrency }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [direction, setDirection] = useState<1 | -1>(1);
  const active = products[activeIndex] || products[0];
  const sizes = active?.availableSizes?.length ? active.availableSizes : DEFAULT_SIZES;
  const displayCurrency = active?.currency || initialCurrency;

  const stageProducts = useMemo(() => products.map((product, index) => ({
    product,
    offset: relativeOffset(index, activeIndex, products.length, direction),
    position: stagePosition(relativeOffset(index, activeIndex, products.length, direction)),
  })).filter(({ offset }) => Math.abs(offset) <= 1), [activeIndex, direction, products]);

  if (!active) return null;

  const move = (nextDirection: 1 | -1) => {
    if (products.length < 2) return;
    setSelectedSize("");
    setDirection(nextDirection);
    setActiveIndex((current) => (current + nextDirection + products.length) % products.length);
  };

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 36 || Math.abs(info.velocity.x) > 280) move(info.offset.x < 0 ? 1 : -1);
  };

  const selectProduct = (index: number) => {
    setSelectedSize("");
    setDirection(index >= activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  const stageStyle = {
    "--reference-accent": GOLD,
    "--reference-index": activeIndex,
  } as CSSProperties;

  return (
    <section className="reference-hero-shell" style={stageStyle} aria-label="HADX LABS featured collection">
      <div className="reference-hero-canvas">
        <div className="reference-ambient-noise" aria-hidden="true" />
        <div className="reference-light-orb reference-light-orb-left" aria-hidden="true" />
        <div className="reference-light-orb reference-light-orb-right" aria-hidden="true" />

        <header className="reference-nav">
          <Link href="/" className="reference-brand-mark" aria-label="HADX LABS home">
            <span className="reference-brand-icon">H</span>
            <span className="reference-brand-wordmark">HADX <b>LABS</b></span>
          </Link>
          <nav className="reference-nav-links" aria-label="Primary navigation">
            <Link href="#catalog">HOME</Link>
            <Link href="#catalog">SHOP</Link>
            <Link href="#catalog">ATELIER</Link>
            <Link href="#catalog">ABOUT</Link>
            <Link href="#catalog">JOURNAL</Link>
          </nav>
          <div className="reference-nav-tools">
            <StorefrontSearch />
            <CurrencySwitcher />
            <Link href="/favorites" className="reference-nav-tool">ACCOUNT</Link>
            <Link href={selectedSize ? checkoutPath(active, selectedSize) : productPath(active)} className="reference-nav-tool reference-nav-cart">CART [ {selectedSize ? 1 : 0} ]</Link>
          </div>
        </header>

        <div className="reference-hero-divider" aria-hidden="true" />

        <div className="reference-main-grid">
          <motion.aside className="reference-glass-panel reference-copy-panel" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.42 }}>
            <span className="reference-eyebrow">LUXURY DIGITAL</span>
            <h2>STREETWEAR<br /><em>ATELIER</em></h2>
            <p>A collectible garment system for people who move with intent. Heavyweight fabric, custom graphics, and a limited HADX production run.</p>
            <Link href="#catalog" className="reference-round-link" aria-label="Explore collection"><span>↗</span><small>PLAY SHOWREEL</small></Link>
          </motion.aside>

          <div className="reference-product-stage">
            <div className="reference-halo" aria-hidden="true" />
            <motion.div className="reference-stage-track" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0} onDragEnd={onDragEnd} style={{ perspective: "1200px", transformStyle: "preserve-3d" }}>
              {stageProducts.map(({ product, offset, position }) => {
                const isActive = offset === 0;
                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    aria-label={`Show ${product.title}`}
                    className={`reference-product-layer ${isActive ? "is-active" : "is-secondary"}`}
                    initial={false}
                    animate={position}
                    transition={{
                      x: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      y: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      z: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      rotateY: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      rotateZ: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.42, ease: "easeOut" },
                    }}
                    onClick={() => selectProduct(products.findIndex((candidate) => candidate.id === product.id))}
                    style={{ zIndex: isActive ? 20 : 10, transformStyle: "preserve-3d" }}
                  >
                    <ProductMedia product={product} active={isActive} />
                  </motion.button>
                );
              })}
            </motion.div>
            <div className="reference-pedestal" aria-hidden="true"><span className="reference-pedestal-top" /><span className="reference-pedestal-base" /></div>
            <div className="reference-stage-caption"><span>SELECTED DROP</span><strong>{String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</strong></div>
          </div>

          <motion.aside className="reference-glass-panel reference-order-panel" key={active.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.42 }}>
            <div className="reference-order-heading"><span className="reference-eyebrow">LIMITED DROP</span><span className="reference-sku">{active.sku || "HADX DROP"}</span></div>
            <h3>{active.title}</h3>
            <p className="reference-color-line">{active.category || "ATELIER"} / {displayCurrency} PRICING</p>
            <div className="reference-price-row"><strong>{formatMoney(active)}</strong><span>WORLDWIDE SHIPPING</span></div>
            <div className="reference-size-block"><span className="reference-label">CHOOSE SIZE</span><div className="reference-size-row">{sizes.map((size) => <button key={size} type="button" onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size} className={selectedSize === size ? "is-selected" : ""}>{size}</button>)}</div></div>
            <Link href={selectedSize ? checkoutPath(active, selectedSize) : productPath(active)} className="reference-gold-cta"><span>{selectedSize ? "ADD TO CART" : "SELECT SIZE"}</span><b>↗</b></Link>
            <div className="reference-order-meta"><div><span>EDITION</span><b>LIMITED / {activeIndex + 1}</b></div><div><span>MEDIA</span><b>{active.media?.length || 1} ASSETS</b></div><div><span>STATUS</span><b>AVAILABLE NOW</b></div></div>
          </motion.aside>
        </div>

        <div className="reference-explore-row"><span className="reference-explore-arrow">↘</span><span>SCROLL TO EXPLORE</span><div className="reference-explore-line" /></div>

        <div className="reference-bottom-strip">
          <div className="reference-feature"><span>◈</span><div><b>LIMITED EDITIONS</b><small>Exclusive drops / numbered runs</small></div></div>
          <div className="reference-feature"><span>♢</span><div><b>PREMIUM QUALITY</b><small>Heavyweight cotton / built to last</small></div></div>
          <div className="reference-bottom-emblem">H</div>
          <div className="reference-feature"><span>✧</span><div><b>GLOBAL SHIPPING</b><small>Worldwide delivery / tracked</small></div></div>
          <div className="reference-feature"><span>◇</span><div><b>SECURE PAYMENTS</b><small>Protected checkout / regional rates</small></div></div>
        </div>

        <div className="reference-controls"><div><button type="button" onClick={() => move(-1)} aria-label="Previous featured product">←</button><span>SWIPE / DRAG TO ROTATE</span><button type="button" onClick={() => move(1)} aria-label="Next featured product">→</button></div><div className="reference-dots">{products.map((product, index) => <button key={product.id} type="button" onClick={() => selectProduct(index)} aria-label={`Select ${product.title}`} className={index === activeIndex ? "is-active" : ""} />)}</div></div>
      </div>
    </section>
  );
}
