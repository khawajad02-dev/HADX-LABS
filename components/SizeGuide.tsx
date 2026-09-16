"use client";

import { useState } from "react";

export type SizeMeasurement = { chest?: number; length?: number; shoulder?: number };

type Props = { measurementsBySize?: Record<string, SizeMeasurement> };

export default function SizeGuide({ measurementsBySize = {} }: Props) {
  const [open, setOpen] = useState(false);
  const sizes = Object.entries(measurementsBySize).filter(([, value]) => value && (value.chest || value.length || value.shoulder));
  if (!sizes.length) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200 underline decoration-amber-200/40 underline-offset-4">
        Size Guide / Fitting Chart
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Size guide" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-lg rounded-2xl border border-amber-200/25 bg-[#0b0908] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/70">FITMENT DATA</p><h2 className="mt-1 text-xl font-light text-white">Size Guide / Fitting Chart</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/15 px-3 py-1 text-zinc-400" aria-label="Close size guide">×</button></div>
            <div className="overflow-hidden rounded-xl border border-white/10"><div className="grid grid-cols-4 bg-white/[0.06] px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-amber-100"><span>Size</span><span>Chest</span><span>Length</span><span>Shoulder</span></div>{sizes.map(([size, value]) => <div key={size} className="grid grid-cols-4 border-t border-white/10 px-3 py-3 text-xs text-zinc-300"><span className="font-bold text-white">{size}</span><span>{value.chest ? `${value.chest}"` : "—"}</span><span>{value.length ? `${value.length}"` : "—"}</span><span>{value.shoulder ? `${value.shoulder}"` : "—"}</span></div>)}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
