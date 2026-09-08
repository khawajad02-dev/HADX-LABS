"use client";

import { FormEvent, useMemo, useState } from "react";

type Review = { id: string; name: string; rating: number; body: string; createdAt: string };
type Props = { productId: string; initialReviews: Review[] };

const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

export default function ProductReviews({ productId, initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"notes" | "write">("notes");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0, [reviews]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("Transmitting note…");
    const response = await fetch(`/api/products/${productId}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, body, rating }) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error || "Unable to save review."); return; }
    setReviews((current) => [result.review, ...current]);
    setName(""); setBody(""); setRating(5); setMode("notes"); setNotice("Your note is now in the archive.");
  };

  return (
    <section className="hadx-review-shell mt-12" aria-label="Product reviews">
      <button type="button" onClick={() => { setOpen(true); setMode("notes"); }} className="hadx-review-trigger hadx-tap-reactive liquid-ui w-full rounded-2xl border px-5 py-4 text-left">
        <span className="block text-[10px] font-mono uppercase tracking-[0.28em] text-amber-200/70">Atelier Notes // {reviews.length ? `${average.toFixed(1)} / 5` : "Awaiting first signal"}</span>
        <span className="mt-2 flex items-center justify-between gap-4"><strong className="text-sm font-light text-white">Tap to reveal the wearer archive</strong><span className="text-xl text-amber-200">↗</span></span>
        <span className="mt-2 block text-[10px] text-zinc-500">Reviews stay hidden until you open the signal.</span>
      </button>

      {open ? (
        <div className="hadx-review-backdrop fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="hadx-review-modal hadx-premium-card w-full max-w-xl rounded-[2rem] border border-amber-200/30 p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-200/70">HADX RELAY // PRIVATE NOTES</p><h2 id="review-title" className="mt-2 text-2xl font-extralight text-white">What did the piece feel like?</h2></div><button type="button" onClick={() => setOpen(false)} className="hadx-tap-reactive rounded-full border border-white/15 px-3 py-1 text-sm text-zinc-400" aria-label="Close reviews">×</button></div>
            <div className="mb-5 flex gap-2 rounded-full border border-white/10 bg-black/20 p-1"><button type="button" onClick={() => setMode("notes")} className={`hadx-tap-reactive flex-1 rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] ${mode === "notes" ? "bg-amber-100/15 text-amber-100" : "text-zinc-500"}`}>Open notes</button><button type="button" onClick={() => setMode("write")} className={`hadx-tap-reactive flex-1 rounded-full px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] ${mode === "write" ? "bg-amber-100/15 text-amber-100" : "text-zinc-500"}`}>Leave a note</button></div>
            {mode === "notes" ? <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-1">{reviews.length ? reviews.map((review) => <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-white">{review.name}</strong><span className="text-xs tracking-widest text-amber-200" aria-label={`${review.rating} out of 5 stars`}>{stars(review.rating)}</span></div><p className="mt-2 text-sm leading-6 text-zinc-400">{review.body}</p></article>) : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-xs text-zinc-500">No notes yet. Be the first signal.</div>}</div> : <form onSubmit={submit} className="space-y-4"><div><label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500" htmlFor="review-name">Your name</label><input id="review-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={60} className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/70" /></div><div><span className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Your rating</span><div className="flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className={`hadx-tap-reactive text-2xl ${value <= rating ? "text-amber-200" : "text-zinc-700"}`} aria-label={`Rate ${value} stars`}>★</button>)}</div></div><div><label className="mb-2 block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500" htmlFor="review-body">Your note</label><textarea id="review-body" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={800} rows={5} className="w-full resize-none rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-amber-200/70" /></div><button type="submit" className="hadx-tap-reactive w-full rounded-xl border border-amber-200/60 bg-amber-100/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Transmit review</button>{notice ? <p role="status" className="text-center text-xs text-amber-200">{notice}</p> : null}</form>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
