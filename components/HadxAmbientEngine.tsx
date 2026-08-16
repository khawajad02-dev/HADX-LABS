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

type AmbientCloud = {
  x: number;
  y: number;
  scale: number;
  phase: number;
  driftX: number;
  driftY: number;
};

type BoltBranch = {
  points: Point[];
  delay: number;
};

type StormBolt = {
  start: Point;
  end: Point;
  branches: BoltBranch[];
  born: number;
  ttl: number;
  intensity: number;
  cloudRadius: number;
};

const VEIN_GOLD = "rgba(221, 171, 76,";
const VEIN_HIGHLIGHT = "rgba(255, 222, 139,";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function distanceBetween(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function makeOrganicPath(start: Point, end: Point, roughness: number, segments: number): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  const points: Point[] = [start];
  let previousOffset = 0;

  for (let index = 1; index < segments; index += 1) {
    const progress = index / segments;
    const envelope = Math.sin(progress * Math.PI);
    const targetOffset = (Math.random() - 0.5) * roughness * envelope;
    previousOffset += (targetOffset - previousOffset) * 0.62;
    points.push({
      x: start.x + dx * progress + normalX * previousOffset,
      y: start.y + dy * progress + normalY * previousOffset,
    });
  }

  points.push(end);
  return points;
}

function createLightningBolt(start: Point, end: Point, intensity: number, now: number): StormBolt {
  const length = distanceBetween(start, end);
  const main = makeOrganicPath(start, end, Math.min(46, 9 + length * (0.045 + intensity * 0.025)), 12 + Math.floor(intensity * 8));
  const branches: BoltBranch[] = [{ points: main, delay: 0 }];
  const branchCount = intensity > 0.72 ? 4 : intensity > 0.46 ? 3 : 2;

  for (let index = 0; index < branchCount; index += 1) {
    const pointIndex = Math.max(2, Math.min(main.length - 3, Math.floor(main.length * (0.24 + Math.random() * 0.5))));
    const origin = main[pointIndex];
    const ahead = main[Math.min(main.length - 1, pointIndex + 1)];
    const heading = Math.atan2(ahead.y - origin.y, ahead.x - origin.x);
    const side = Math.random() > 0.5 ? 1 : -1;
    const branchAngle = heading + side * (0.56 + Math.random() * 0.48);
    const branchLength = Math.min(110, 20 + length * (0.12 + intensity * 0.12) * (0.7 + Math.random() * 0.6));
    const branchEnd = {
      x: origin.x + Math.cos(branchAngle) * branchLength,
      y: origin.y + Math.sin(branchAngle) * branchLength,
    };
    branches.push({
      points: makeOrganicPath(origin, branchEnd, 8 + branchLength * 0.16, 5 + Math.floor(intensity * 3)),
      delay: 50 + Math.random() * 90,
    });
  }

  return {
    start,
    end,
    branches,
    born: now,
    ttl: 680 + intensity * 340,
    intensity,
    cloudRadius: 26 + intensity * 48,
  };
}

function createCloudStrike(origin: Point, direction: 1 | -1, intensity: number, width: number, height: number, now: number) {
  const distance = 90 + intensity * 210;
  const end = {
    x: clamp(origin.x + (Math.random() - 0.5) * (50 + intensity * 90), 20, width - 20),
    y: clamp(origin.y + direction * distance, 34, height - 34),
  };
  return createLightningBolt(origin, end, intensity, now);
}

function drawNebulaCloud(ctx: CanvasRenderingContext2D, point: Point, radius: number, strength: number, now: number, phase = 0) {
  const pulse = 0.78 + Math.sin(now * 0.0011 + phase) * 0.22;
  const cloudStrength = strength * pulse;
  const lobes = [
    { x: -0.42, y: 0.08, scale: 0.82 },
    { x: 0.0, y: -0.12, scale: 1.0 },
    { x: 0.42, y: 0.1, scale: 0.76 },
  ];

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const lobe of lobes) {
    const x = point.x + lobe.x * radius;
    const y = point.y + lobe.y * radius;
    const lobeRadius = radius * lobe.scale;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, lobeRadius);
    gradient.addColorStop(0, `rgba(255, 213, 112, ${0.12 * cloudStrength})`);
    gradient.addColorStop(0.28, `rgba(219, 157, 49, ${0.085 * cloudStrength})`);
    gradient.addColorStop(0.66, `rgba(122, 73, 13, ${0.045 * cloudStrength})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, lobeRadius, lobeRadius * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStormBolt(ctx: CanvasRenderingContext2D, bolt: StormBolt, now: number) {
  const age = now - bolt.born;
  const life = clamp(1 - age / bolt.ttl, 0, 1);
  if (life <= 0) return;

  const reveal = clamp(age / 230, 0, 1);
  const flicker = 0.78 + Math.sin(now * 0.045 + bolt.born * 0.01) * 0.22;
  const alpha = life * flicker * bolt.intensity;
  const cloudPulse = alpha * (age < 260 ? 1.3 : 0.72);

  drawNebulaCloud(ctx, bolt.start, bolt.cloudRadius * (1.2 + cloudPulse * 0.7), 1.25 + cloudPulse * 1.7, now, bolt.born);
  drawNebulaCloud(ctx, bolt.end, bolt.cloudRadius * 0.56, 0.58 + cloudPulse, now, bolt.born + 1.2);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawBranch = (branch: BoltBranch, width: number, color: string, glow: number) => {
    const branchReveal = clamp((age - branch.delay) / 210, 0, 1);
    const count = Math.max(2, Math.ceil(branch.points.length * Math.min(reveal, branchReveal)));
    ctx.moveTo(branch.points[0].x, branch.points[0].y);
    for (let index = 1; index < count; index += 1) {
      ctx.lineTo(branch.points[index].x, branch.points[index].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowBlur = glow;
    ctx.shadowColor = color;
  };

  ctx.beginPath();
  for (const branch of bolt.branches) {
    drawBranch(branch, 2.8 + bolt.intensity * 2.2, `${VEIN_GOLD}${Math.min(0.32, alpha * 0.28)})`, 16 + bolt.intensity * 9);
  }
  ctx.stroke();

  ctx.beginPath();
  for (const branch of bolt.branches) {
    drawBranch(branch, 0.62 + bolt.intensity * 0.72, `${VEIN_HIGHLIGHT}${Math.min(0.88, alpha * 0.82)})`, 5 + bolt.intensity * 5);
  }
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
    const particleCount = reducedMotion ? 24 : isSmallScreen ? 48 : 86;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastFrame = performance.now();
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();
    let scrollEnergy = 0;
    let lastBoltAt = 0;
    let pointerPoint: Point | null = null;
    let pointerStart: Point | null = null;
    let pointerMoved = false;
    const particles: Particle[] = [];
    const clouds: AmbientCloud[] = [];
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
            radius: Math.random() * 1.35 + 0.4,
            alpha: Math.random() * 0.58 + 0.26,
            driftX: (Math.random() - 0.5) * 0.17,
            driftY: -(Math.random() * 0.22 + 0.035),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }

      if (clouds.length === 0) {
        [
          [0.15, 0.22, 1.12],
          [0.72, 0.37, 0.92],
          [0.38, 0.58, 0.86],
          [0.84, 0.74, 1.05],
          [0.18, 0.84, 0.76],
        ].forEach(([x, y, scale], index) => {
          clouds.push({
            x,
            y,
            scale,
            phase: index * 1.7,
            driftX: index % 2 === 0 ? 0.018 : -0.015,
            driftY: index % 2 === 0 ? -0.012 : 0.01,
          });
        });
      }
    };

    const pickDustCloud = (): Point => {
      const candidates = particles.filter((particle) => particle.y > height * 0.08 && particle.y < height * 0.92);
      const seed = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] || {
        x: width * (0.16 + Math.random() * 0.68),
        y: height * (0.18 + Math.random() * 0.64),
      };
      return {
        x: clamp(seed.x + (Math.random() - 0.5) * 56, 24, width - 24),
        y: clamp(seed.y + (Math.random() - 0.5) * 56, 42, height - 42),
      };
    };

    const addBolt = (bolt: StormBolt) => {
      bolts.push(bolt);
      if (bolts.length > 5) bolts.splice(0, bolts.length - 5);
      window.dispatchEvent(new CustomEvent("hadx:lightning", {
        detail: {
          startX: bolt.start.x,
          startY: bolt.start.y,
          endX: bolt.end.x,
          endY: bolt.end.y,
          intensity: bolt.intensity,
          radius: bolt.cloudRadius,
        },
      }));
    };

    const spawnScrollLightning = (energy: number, direction: 1 | -1, now: number) => {
      if (reducedMotion || now - lastBoltAt < 115) return;
      lastBoltAt = now;
      const start = pointerPoint || pickDustCloud();
      const intensity = clamp(0.34 + energy * 0.9, 0.34, 1);
      const distance = 74 + intensity * 220;
      const end = {
        x: clamp(start.x + (Math.random() - 0.5) * (24 + intensity * 62), 20, width - 20),
        y: clamp(start.y + direction * distance, 30, height - 30),
      };
      addBolt(createLightningBolt(start, end, intensity, now));
    };

    const handleScroll = () => {
      const now = performance.now();
      const delta = window.scrollY - lastScrollY;
      const elapsed = Math.max(16, now - lastScrollTime);
      const velocity = clamp((Math.abs(delta) / elapsed) * 8, 0, 1);
      if (Math.abs(delta) > 0.25) {
        scrollEnergy = Math.max(scrollEnergy, velocity);
        spawnScrollLightning(velocity, delta >= 0 ? 1 : -1, now);
      }
      lastScrollY = window.scrollY;
      lastScrollTime = now;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== undefined && event.button !== 0) return;
      pointerPoint = { x: event.clientX, y: event.clientY };
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerMoved = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerPoint = { x: event.clientX, y: event.clientY };
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerMoved = pointerMoved || Math.hypot(dx, dy) > 10;
    };

    const handlePointerUp = (event: PointerEvent) => {
      pointerPoint = { x: event.clientX, y: event.clientY };
      if (!pointerStart) return;
      const start = pointerStart;
      pointerStart = null;
      const end = { x: event.clientX, y: event.clientY };
      const distance = distanceBetween(start, end);
      const intensity = clamp(0.42 + distance / Math.max(180, Math.min(width, height) * 0.72), 0.42, 1);
      const now = performance.now();
      scrollEnergy = Math.max(scrollEnergy, intensity * 0.9);

      // A tap has almost no geometric length, so give it a short cloud-to-finger strike.
      // A swipe keeps the exact touch-down -> touch-release path requested for mobile.
      if (distance < 14) {
        addBolt(createCloudStrike(start, -1, intensity, width, height, now));
      } else {
        addBolt(createLightningBolt(start, end, intensity, now));
      }
      pointerMoved = false;
    };

    const handlePointerCancel = () => {
      pointerStart = null;
      pointerMoved = false;
    };

    const render = (now: number) => {
      const dt = Math.min(32, now - lastFrame);
      lastFrame = now;
      const seconds = now / 1000;
      scrollEnergy += (0 - scrollEnergy) * Math.min(1, dt / (reducedMotion ? 150 : 390));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const haze = ctx.createRadialGradient(width * 0.42, height * 0.54, 0, width * 0.42, height * 0.54, Math.max(width, height) * 0.78);
      haze.addColorStop(0, `rgba(176, 109, 18, ${0.15 + scrollEnergy * 0.12})`);
      haze.addColorStop(0.44, `rgba(112, 66, 10, ${0.075 + scrollEnergy * 0.05})`);
      haze.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);

      for (const cloud of clouds) {
        const x = cloud.x * width + Math.sin(seconds * 0.12 + cloud.phase) * width * cloud.driftX;
        const y = cloud.y * height + Math.cos(seconds * 0.1 + cloud.phase) * height * cloud.driftY;
        drawNebulaCloud(ctx, { x, y }, Math.min(width, height) * 0.18 * cloud.scale, 1.25 + scrollEnergy * 1.9, now, cloud.phase);
      }

      const speedMultiplier = reducedMotion ? 0.42 : 1 + scrollEnergy * 3.2;
      for (const particle of particles) {
        particle.x += (particle.driftX + Math.sin(seconds * 0.55 + particle.phase) * 0.07) * speedMultiplier * dt;
        particle.y += particle.driftY * speedMultiplier * dt;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;

        const pulse = 0.72 + Math.sin(seconds * 0.95 + particle.phase) * 0.28;
        const alpha = particle.alpha * pulse * (0.92 + scrollEnergy * 0.9);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius + scrollEnergy * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `${VEIN_GOLD}${Math.min(0.88, alpha)})`;
        ctx.fill();
      }

      if (pointerPoint) {
        const cursorCloud = ctx.createRadialGradient(pointerPoint.x, pointerPoint.y, 0, pointerPoint.x, pointerPoint.y, 88 + scrollEnergy * 48);
        cursorCloud.addColorStop(0, `rgba(255, 214, 112, ${0.14 + scrollEnergy * 0.12})`);
        cursorCloud.addColorStop(0.35, `rgba(205, 145, 38, ${0.075 + scrollEnergy * 0.06})`);
        cursorCloud.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cursorCloud;
        ctx.beginPath();
        ctx.arc(pointerPoint.x, pointerPoint.y, 100 + scrollEnergy * 50, 0, Math.PI * 2);
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
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-95" />
    </div>
  );
}
