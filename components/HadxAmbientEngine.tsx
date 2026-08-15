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
    const step = length / segments * (0.78 + Math.random() * 0.42);
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
    points.push({ x, y });
  }

  return points;
}

function createStormBolt(origin: Point, direction: 1 | -1, intensity: number, now: number): StormBolt {
  const branches: Point[][] = [];
  const primaryAngle = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  const branchCount = 4 + Math.floor(intensity * 4);

  for (let index = 0; index < branchCount; index += 1) {
    const angleBias = (Math.random() - 0.5) * (1.35 + intensity * 0.65);
    const angle = primaryAngle + angleBias;
    const branchOrigin = {
      x: origin.x + (Math.random() - 0.5) * 18,
      y: origin.y + (Math.random() - 0.5) * 18,
    };
    const vein = growVein(
      branchOrigin,
      angle,
      60 + intensity * 210 * (0.7 + Math.random() * 0.5),
      6 + Math.floor(intensity * 5),
      0.72 + intensity * 0.32,
    );
    branches.push(vein);

    // Fine secondary cracks make it resemble the natural gold veins in the logo,
    // rather than one thick geometric line.
    if (intensity > 0.38 && index % 2 === 0 && vein.length > 4) {
      const forkIndex = Math.max(2, Math.floor(vein.length * (0.42 + Math.random() * 0.28)));
      const fork = vein[forkIndex];
      branches.push(
        growVein(
          fork,
          angle + (Math.random() > 0.5 ? 0.72 : -0.72),
          26 + intensity * 90,
          4 + Math.floor(intensity * 3),
          0.95,
        ),
      );
    }
  }

  return {
    origin,
    branches,
    born: now,
    ttl: 300 + intensity * 300,
    intensity,
    cloudRadius: 22 + intensity * 42,
  };
}

function drawStormBolt(ctx: CanvasRenderingContext2D, bolt: StormBolt, now: number) {
  const age = now - bolt.born;
  const life = Math.max(0, 1 - age / bolt.ttl);
  if (life <= 0) return;

  const flicker = 0.56 + Math.max(0, Math.sin(now * 0.055 + bolt.born * 0.01)) * 0.44;
  const alpha = life * bolt.intensity * flicker;
  const { x, y } = bolt.origin;

  // A brief cloud-like glow makes the current feel born inside the dust field.
  const cloud = ctx.createRadialGradient(x, y, 0, x, y, bolt.cloudRadius * 2.8);
  cloud.addColorStop(0, `rgba(255, 205, 96, ${Math.min(0.18, alpha * 0.16)})`);
  cloud.addColorStop(0.32, `rgba(203, 143, 38, ${Math.min(0.09, alpha * 0.08)})`);
  cloud.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = cloud;
  ctx.beginPath();
  ctx.arc(x, y, bolt.cloudRadius * 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const branch of bolt.branches) {
    ctx.beginPath();
    branch.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = `${VEIN_GOLD}${Math.min(0.34, alpha * 0.25)})`;
    ctx.lineWidth = 2.5 + bolt.intensity * 2.4;
    ctx.shadowBlur = 15 + bolt.intensity * 10;
    ctx.shadowColor = `${VEIN_GOLD}${Math.min(0.35, alpha * 0.35)})`;
    ctx.stroke();

    ctx.beginPath();
    branch.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = `${VEIN_HIGHLIGHT}${Math.min(0.78, alpha * 0.62)})`;
    ctx.lineWidth = 0.45 + bolt.intensity * 0.8;
    ctx.shadowBlur = 5;
    ctx.shadowColor = `${VEIN_HIGHLIGHT}${Math.min(0.35, alpha * 0.3)})`;
    ctx.stroke();
  }

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
    let lastBoltAt = 0;
    const particles: Particle[] = [];
    const bolts: StormBolt[] = [];

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
        for (let index = 0; index < particleCount; index += 1) {
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

    const pickDustCloud = (): Point => {
      const candidates = particles.filter((particle) => particle.y > height * 0.12 && particle.y < height * 0.86);
      const seed = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] || {
        x: width * (0.22 + Math.random() * 0.56),
        y: height * (0.26 + Math.random() * 0.42),
      };
      return {
        x: Math.min(width - 28, Math.max(28, seed.x + (Math.random() - 0.5) * 44)),
        y: Math.min(height - 34, Math.max(86, seed.y + (Math.random() - 0.5) * 44)),
      };
    };

    const spawnLightning = (energy: number, direction: 1 | -1, now: number) => {
      if (reducedMotion || now - lastBoltAt < 120) return;
      lastBoltAt = now;
      const origin = pickDustCloud();
      bolts.push(createStormBolt(origin, direction, Math.max(0.34, energy), now));
      if (energy > 0.68 && Math.random() > 0.3) {
        bolts.push(createStormBolt({ x: origin.x + (Math.random() - 0.5) * 55, y: origin.y + (Math.random() - 0.5) * 55 }, direction, energy * 0.64, now + 18));
      }
      if (bolts.length > 9) bolts.splice(0, bolts.length - 9);
    };

    const handleScroll = () => {
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = Math.min(1, Math.abs(delta) / elapsed * 7);
      if (Math.abs(delta) > 0.25) {
        const direction: 1 | -1 = delta >= 0 ? 1 : -1;
        scrollEnergy = Math.max(scrollEnergy, velocity);
        spawnLightning(scrollEnergy, direction, now);
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
        const alpha = particle.alpha * pulse * (0.82 + scrollEnergy * 0.75);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius + scrollEnergy * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = `${VEIN_GOLD}${Math.min(0.92, alpha)})`;
        ctx.shadowBlur = 8 + scrollEnergy * 14;
        ctx.shadowColor = `${VEIN_GOLD}${Math.min(0.55, alpha)})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      for (let index = bolts.length - 1; index >= 0; index -= 1) {
        if (now - bolts[index].born > bolts[index].ttl) bolts.splice(index, 1);
        else drawStormBolt(ctx, bolts[index], now);
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
