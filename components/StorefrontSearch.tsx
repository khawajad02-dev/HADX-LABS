"use client";

import { FormEvent, useState } from "react";

export default function StorefrontSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    window.location.assign(`/catalog${params.toString() ? `?${params.toString()}` : ""}#catalog`);
  };

  return (
    <form onSubmit={submit} className="relative flex items-center">
      {open ? (
        <div className="liquid-panel mr-2 flex items-center gap-2 rounded-full border border-amber-200/30 px-3 py-1.5 shadow-gold-glow">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the atelier"
            aria-label="Search the HADX atelier"
            className="w-36 bg-transparent text-[11px] font-mono text-white outline-none placeholder:text-zinc-500 sm:w-52"
          />
          <button type="submit" className="text-[10px] font-mono tracking-widest text-amber-100 hover:text-white" aria-label="Submit HADX Smart Search">GO</button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open HADX Smart Search"
        aria-expanded={open}
        className="liquid-ui group flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/40 text-amber-100 transition-all hover:border-amber-100 hover:text-white hover:shadow-gold-glow"
      >
        <svg width="23" height="23" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-12">
          <circle cx="12" cy="12" r="6.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M17 17L23 23" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1" opacity=".5" />
          <ellipse cx="14" cy="14" rx="11" ry="4" stroke="currentColor" strokeWidth=".75" opacity=".35" transform="rotate(-28 14 14)" />
          <circle cx="22" cy="6" r="1.8" fill="currentColor" opacity=".8" />
        </svg>
      </button>
    </form>
  );
}
