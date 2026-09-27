"use client";

import { useRef, useState } from "react";
import { pulseHaptic } from "@/lib/interaction-feedback";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ScrollEngine() {
  const [active, setActive] = useState(false);
  const [turn, setTurn] = useState(0);
  const pointerId = useRef<number | null>(null);
  const lastY = useRef(0);
  const accumulated = useRef(0);

  const release = () => {
    pointerId.current = null;
    setActive(false);
    document.documentElement.style.setProperty("--hadx-scroll-tilt", "0deg");
    document.documentElement.style.setProperty("--hadx-scroll-roll", "0deg");
  };

  return (
    <button
      type="button"
      aria-label="Hold and drag to rotate-scroll the page"
      className={`hadx-scroll-engine ${active ? "is-active" : ""}`}
      onPointerDown={(event) => {
        pointerId.current = event.pointerId;
        lastY.current = event.clientY;
        accumulated.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
        setActive(true);
        pulseHaptic(10);
      }}
      onPointerMove={(event) => {
        if (pointerId.current !== event.pointerId) return;
        const delta = event.clientY - lastY.current;
        lastY.current = event.clientY;
        if (!delta) return;
        accumulated.current += Math.abs(delta);
        window.scrollBy({ top: -delta * 1.35, behavior: "auto" });
        setTurn((current) => current + delta * 1.65);
        document.documentElement.style.setProperty("--hadx-scroll-tilt", `${clamp(delta * -0.22, -9, 9)}deg`);
        document.documentElement.style.setProperty("--hadx-scroll-roll", `${clamp(delta * 0.18, -7, 7)}deg`);
        if (accumulated.current >= 52) {
          accumulated.current = 0;
          pulseHaptic(5);
        }
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      style={{ "--hadx-engine-turn": `${turn}deg` } as React.CSSProperties}
    >
      <span className="hadx-scroll-engine-core" aria-hidden="true"><span /></span>
      <span className="hadx-scroll-engine-label">GRAB / SCROLL</span>
    </button>
  );
}
