"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  path: string;
  className?: string;
};

export default function ShareButton({ title, path, className = "" }: ShareButtonProps) {
  const [label, setLabel] = useState("SHARE");

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Check out ${title} on HADX LABS`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setLabel("LINK COPIED");
        window.setTimeout(() => setLabel("SHARE"), 2000);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setLabel("LINK COPIED");
        window.setTimeout(() => setLabel("SHARE"), 2000);
      } catch {
        // Clipboard permission can be denied; do not interrupt the shopping flow.
      }
    }
  };

  return <button type="button" onClick={() => void share()} className={`liquid-ui rounded-full border border-white/15 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/60 transition-colors hover:border-amber-200/60 hover:text-amber-100 ${className}`}>{label}</button>;
}
