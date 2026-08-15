"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  driftX: number;
  driftY: number;
  phase: number;
};

type Bolt = {
  points: Array<{ x: number; y: number }>;
  born: number;
  ttl: number;
  intensity: number;
};

const GOLD = "rgba(231, 174, 67,";

function createBolt(originX: number, originY: number, direction: 1 | -1, intensity: number, now: number): Bolt {
  const points: Array<{ x: number; y: number }> = [{ x: originX, y: originY }];
  const travel = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  const length = 120 + intensity * 360;
  const segments = 7 + Math.floor(intensity * 5);
  let x = originX;
  let y = originY;

  for (let i = 1; i <= segments; i += 1) {
    const progress = i / segments;
    const step = length / segments;
    const spread = (Math.random() - 0.5) * (18 + intensity * 42) * (1 - progress * 0.35);
    x += Math.cos(travel) * step + spread;
    y += Math.sin(travel) * step;
    points.push({ x, y });
  }

  return {
    points,
    born: now,
    ttl: 270 + intensity * 260,
    intensity,
  };
}

function drawBolt(ctx: CanvasRenderingContext2D, bolt: Bolt, now: number, dpr: number) {
  const age = now - bolt.born;
  const life = Math.max(0, 1 - age / bolt.ttl);
  if (life <= 0) return;

  const flicker = 0.72 + Math.sin(now * 0.045 + bolt.born) * 0.18;
  const alpha = life * bolt.intensity * flicker;
  const points = bolt.points;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = `${GOLD}${Math.min(0.42, alpha * 0.4)})`;
  ctx.lineWidth = 8 + bolt.intensity * 7;
  ctx.shadowBlur = 26;
  ctx.shadowColor = `${GOLD}${Math.min(0.55, alpha)})`;
  ctx.stroke();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = `${GOLD}${Math.min(0.95, alpha)})`;
  ctx.lineWidth = 0.75 + bolt.intensity * 1.35;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.restore();
}

export default function HadxAmbientEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallScreen = window.innerWidth < 700;
    const particleCount = reducedMotion ? 28 : isSmallScreen ? 54 : 92;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastFrame = performance.now();
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollEnergy = 0;
    let scrollDirection: 1 | -1 = 1;
    let lastBoltAt = 0;
    const particles: Particle[] = [];
    const bolts: Bolt[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0) {
        for (let i = 0; i < particleCount; i += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.4 + 0.35,
            alpha: Math.random() * 0.6 + 0.2,
            driftX: (Math.random() - 0.5) * 0.2,
            driftY: -(Math.random() * 0.32 + 0.06),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const spawnLightning = (energy: number, direction: 1 | -1, now: number) => {
      if (reducedMotion || now - lastBoltAt < 110) return;
      lastBoltAt = now;

      // The origin sits beside the fixed HADX LABS mark in the header.
      const originX = Math.min(Math.max(width * 0.18, 58), 220);
      const originY = 76;
      bolts.push(createBolt(originX, originY, direction, energy, now));
      if (energy > 0.72 && Math.random() > 0.35) {
        bolts.push(createBolt(originX + (Math.random() - 0.5) * 22, originY + 3, direction, energy * 0.72, now + 12));
      }
      if (bolts.length > 8) bolts.splice(0, bolts.length - 8);
    };

    const handleScroll = () => {
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = Math.min(1, Math.abs(delta) / elapsed * 7);
      if (Math.abs(delta) > 0.25) {
        scrollDirection = delta >= 0 ? 1 : -1;
        scrollEnergy = Math.max(scrollEnergy, velocity);
        spawnLightning(scrollEnergy, scrollDirection, now);
      }
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    };

    const render = (now: number) => {
      const dt = Math.min(34, now - lastFrame);
      lastFrame = now;
      const seconds = now / 1000;
      scrollEnergy += (0 - scrollEnergy) * Math.min(1, dt / (reducedMotion ? 160 : 520));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // A soft haze keeps the ambient field visible even when the catalog is empty.
      const haze = ctx.createRadialGradient(width * 0.18, height * 0.68, 0, width * 0.18, height * 0.68, Math.max(width, height) * 0.68);
      haze.addColorStop(0, `rgba(176, 109, 18, ${0.13 + scrollEnergy * 0.08})`);
      haze.addColorStop(0.42, `rgba(112, 66, 10, ${0.06 + scrollEnergy * 0.04})`);
      haze.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      const speedMultiplier = reducedMotion ? 0.45 : 1 + scrollEnergy * 3.2;
      for (const particle of particles) {
        particle.x += (particle.driftX + Math.sin(seconds * 0.55 + particle.phase) * 0.08) * speedMultiplier * dt;
        particle.y += particle.driftY * speedMultiplier * dt;

        if (particle.y < -8) particle.y = height + 8;
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;

        const pulse = 0.7 + Math.sin(seconds * 0.8 + particle.phase) * 0.3;
        const alpha = particle.alpha * pulse * (0.82 + scrollEnergy * 0.55);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius + scrollEnergy * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `${GOLD}${Math.min(0.92, alpha)})`;
        ctx.shadowBlur = 8 + scrollEnergy * 12;
        ctx.shadowColor = `${GOLD}${Math.min(0.55, alpha)})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      for (let i = bolts.length - 1; i >= 0; i -= 1) {
        if (now - bolts[i].born > bolts[i].ttl) bolts.splice(i, 1);
        else drawBolt(ctx, bolts[i], now, 1);
      }

      raf = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-90"
    />
  );
}
