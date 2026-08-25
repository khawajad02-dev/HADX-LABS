"use client";

import dynamic from "next/dynamic";

const NetworkErrorOverlay = dynamic(() => import("@/components/NetworkErrorOverlay"), { ssr: false });
const PwaInstallBanner = dynamic(() => import("@/components/PwaInstallBanner"), { ssr: false });
const HadxAmbientEngine = dynamic(() => import("@/components/HadxAmbientEngine"), { ssr: false });
const LiquidGlassPhysics = dynamic(() => import("@/components/LiquidGlassPhysics"), { ssr: false });

export default function DeferredEnhancements() {
  return (
    <>
      <HadxAmbientEngine />
      <LiquidGlassPhysics />
      <NetworkErrorOverlay />
      <PwaInstallBanner />
    </>
  );
}
