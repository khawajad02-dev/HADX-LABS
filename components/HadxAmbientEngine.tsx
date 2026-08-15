"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

type Particle = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  driftX: number;
  driftY: number;
  phase: number;
};

type StormBolt = {
  origin: Point;
  branches: Point[][];
  born: number;
  ttl: number;
  intensity: number;
  cloudRadius: number;
};

const VEIN_GOLD = "rgba(221, 171, 76,";
const VEIN_HIGHLIGHT = "rgba(255, 222, 139,";

function growVein(origin: Point, angle: number, length: number, segments: number, jitter: number): Point[] {
  const points: Point[] = [{ x: origin.x, y: origin.y }];
  let x = origin.x;
  let y = origin.y;
  let heading = angle;

  for (let index = 1; index <= segments; index += 1) {
    const progress = index / segments;
    heading += (Math.random() - 0.5) * jitter * (1.15 - progress * 0.45);
    const step = (length / segments) * (0.82 + Math.random() * 0.36);
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    points.push({ x, y });
  }

  return points;
}

function createStormBolt(origin: Point, direction: 1 | -1, intensity: number, now: number): StormBolt {
  const branches: Point[][] = [];
  const primaryAngle = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  const branchCount = 3 + Math.floor(intensity * 3);

  for (let index = 0; index < branchCount; index += 1) {
    const angle = primaryAngle + (Math.random() - 0.5) * (1.15 + intensity * 0.55);
    const branchOrigin = {
      x: origin.x + (Math.random() - 0.5) * 16,
      y: origin.y + (Math.random() - 0.5) * 16,
    };
    const vein = growVein(
      branchOrigin,
      angle,
      54 + intensity * 175 * (0.76 + Math.random() * 0.4),
      5 + Math.floor(intensity * 4),
      0.7 + intensity * 0.25,
    );
    branches.push(vein);

    if (intensity > 0.46 && index % 2 === 0 && vein.length > 3) {
      const fork = vein[Math.max(2, Math.floor(vein.length * (0.4 + Math.random() * 0.26)))];
      branches.push(
        growVein(
          fork,
          angle + (Math.random() > 0.5 ? 0.72 : -0.72),
          22 + intensity * 66,
          3 + Math.floor(intensity * 3),
          0.9,
        ),
      );
    }
  }

  return {
    origin,
    branches,
    born: now,
    ttl: 260 + intensity * 270,
    intensity,
    cloudRadius: 18 + intensity * 38,
  };
}

function createGestureBolt(start: Point, end: Point, intensity: number, now: number): StormBolt {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(24, Math.sqrt(dx * dx + dy * dy));
  const direction = Math.atan2(dy, dx);
  const normal = { x: -Math.sin(direction), y: Math.cos(direction) };
  const steps = Math.min(18, Math.max(7, Math.round(distance / 34)));
  const main: Point[] = [start];

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const wave = Math.sin(progress * Math.PI) * (Math.random() - 0.5) * (10 + intensity * 22);
    main.push({
      x: start.x + dx * progress + normal.x * wave,
      y: start.y + dy * progress + normal.y * wave,
    });
  }

  main.push(end);
  const branches: Point[][] = [main];
  const branchCount = intensity > 0.62 ? 3 : 2;
  for (let index = 0; index < branchCount; index += 1) {
    const point = main[Math.max(1, Math.floor(main.length * (0.32 + Math.random() * 0.42)))];
    const branchAngle = direction + (Math.random() > 0.5 ? 0.78 : -0.78);
    branches.push(growVein(point, branchAngle, 18 + intensity * 54, 3 + Math.floor(intensity * 2), 0.8));
  }

  return {
    origin: start,
    branches,
    born: now,
    ttl: 360 + intensity * 260,
    intensity,
    cloudRadius: 24 + intensity * 42,
  };
}

function drawStormBolt(ctx: CanvasRenderingContext2D, bolt: StormBolt, now: number) {
  const age = now - bolt.born;
  const life = Math.max(0, 1 - age / bolt.ttl);
  if (life <= 0) return;

  const flicker = 0.58 + Math.max(0, Math.sin(now * 0.052 + bolt.born * 0.01)) * 0.42;
  const alpha = life * bolt.intensity * flicker;
  const { x, y } = bolt.origin;

  const cloud = ctx.createRadialGradient(x, y, 0, x, y, bolt.cloudRadius * 2.7);
  cloud.addColorStop(0, `rgba(255, 205, 96, ${Math.min(0.16, alpha * 0.14)})`);
  cloud.addColorStop(0.36, `rgba(203, 143, 38, ${Math.min(0.075, alpha * 0.07)})`);
  cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = cloud;
  ctx.beginPath();
  ctx.arc(x, y, bolt.cloudRadius * 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // One grouped path per pass keeps the animation smooth on mobile GPUs.
  ctx.beginPath();
  for (const branch of bolt.branches) {
    branch.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
  }
  ctx.strokeStyle = `${VEIN_GOLD}${Math.min(0.28, alpha * 0.22)})`;
  ctx.lineWidth = 2.2 + bolt.intensity * 2;
  ctx.shadowBlur = 12 + bolt.intensity * 8;
  ctx.shadowColor = `${VEIN_GOLD}${Math.min(0.3, alpha * 0.3)})`;
  ctx.stroke();

  ctx.beginPath();
  for (const branch of bolt.branches) {
    branch.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
  }
  ctx.strokeStyle = `${VEIN_HIGHLIGHT}${Math.min(0.7, alpha * 0.58)})`;
  ctx.lineWidth = 0.42 + bolt.intensity * 0.7;
  ctx.shadowBlur = 4;
  ctx.shadowColor = `${VEIN_HIGHLIGHT}${Math.min(0.32, alpha * 0.28)})`;
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
    const particleCount = reducedMotion ? 24 : isSmallScreen ? 42 : 72;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastFrame = performance.now();
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollEnergy = 0;
    let lastBoltAt = 0;
    let pointerStart: Point | null = null;
    let pointerMoved = false;
    const particles: Particle[] = [];
    const bolts: StormBolt[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0) {
        for (let index = 0; index < particleCount; index += 1) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.25 + 0.35,
            alpha: Math.random() * 0.52 + 0.2,
            driftX: (Math.random() - 0.5) * 0.16,
            driftY: -(Math.random() * 0.25 + 0.05),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const pickDustCloud = (): Point => {
      const candidates = particles.filter((particle) => particle.y > height * 0.1 && particle.y < height * 0.9);
      const seed = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] || {
        x: width * (0.2 + Math.random() * 0.6),
        y: height * (0.24 + Math.random() * 0.48),
      };
      return {
        x: Math.min(width - 24, Math.max(24, seed.x + (Math.random() - 0.5) * 42)),
        y: Math.min(height - 28, Math.max(72, seed.y + (Math.random() - 0.5) * 42)),
      };
    };

    const addBolt = (bolt: StormBolt) => {
      bolts.push(bolt);
      if (bolts.length > 6) bolts.splice(0, bolts.length - 6);
    };

    const spawnScrollLightning = (energy: number, direction: 1 | -1, now: number) => {
      if (reducedMotion || now - lastBoltAt < 190) return;
      lastBoltAt = now;
      addBolt(createStormBolt(pickDustCloud(), direction, Math.max(0.34, energy), now));
    };

    const handleScroll = () => {
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = Math.min(1, (Math.abs(delta) / elapsed) * 7);
      if (Math.abs(delta) > 0.25) {
        scrollEnergy = Math.max(scrollEnergy, velocity);
        spawnScrollLightning(velocity, delta >= 0 ? 1 : -1, now);
      }
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerMoved = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerMoved = pointerMoved || Math.sqrt(dx * dx + dy * dy) > 14;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerStart) return;
      const start = pointerStart;
      pointerStart = null;
      if (!pointerMoved) return;

      const end = { x: event.clientX, y: event.clientY };
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const intensity = Math.min(1, Math.max(0.34, distance / Math.max(160, Math.min(width, height) * 0.75)));
      const now = performance.now();
      scrollEnergy = Math.max(scrollEnergy, intensity);
      addBolt(createGestureBolt(start, end, intensity, now));

      // A small secondary spark lands exactly where the finger was released.
      if (distance > 90) {
        addBolt(createStormBolt(end, dy >= 0 ? 1 : -1, intensity * 0.62, now + 16));
      }
    };

    const handlePointerCancel = () => {
      pointerStart = null;
      pointerMoved = false;
    };

    const render = (now: number) => {
      const dt = Math.min(32, now - lastFrame);
      lastFrame = now;
      const seconds = now / 1000;
      scrollEnergy += (0 - scrollEnergy) * Math.min(1, dt / (reducedMotion ? 150 : 460));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const haze = ctx.createRadialGradient(width * 0.18, height * 0.68, 0, width * 0.18, height * 0.68, Math.max(width, height) * 0.68);
      haze.addColorStop(0, `rgba(176, 109, 18, ${0.12 + scrollEnergy * 0.08})`);
      haze.addColorStop(0.42, `rgba(112, 66, 10, ${0.055 + scrollEnergy * 0.04})`);
      haze.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      const speedMultiplier = reducedMotion ? 0.45 : 1 + scrollEnergy * 2.7;
      ctx.shadowBlur = 0;
      for (const particle of particles) {
        particle.x += (particle.driftX + Math.sin(seconds * 0.55 + particle.phase) * 0.065) * speedMultiplier * dt;
        particle.y += particle.driftY * speedMultiplier * dt;

        if (particle.y < -8) particle.y = height + 8;
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;

        const pulse = 0.72 + Math.sin(seconds * 0.8 + particle.phase) * 0.28;
        const alpha = particle.alpha * pulse * (0.82 + scrollEnergy * 0.62);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius + scrollEnergy * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `${VEIN_GOLD}${Math.min(0.82, alpha)})`;
        ctx.fill();
      }

      for (let index = bolts.length - 1; index >= 0; index -= 1) {
        if (now - bolts[index].born > bolts[index].ttl) bolts.splice(index, 1);
        else drawStormBolt(ctx, bolts[index], now);
      }

      raf = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerCancel, { passive: true });
    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="ambient-nebula-cloud ambient-nebula-cloud-one" />
      <div className="ambient-nebula-cloud ambient-nebula-cloud-two" />
      <div className="ambient-nebula-cloud ambient-nebula-cloud-three" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-90" />
    </div>
  );
}
