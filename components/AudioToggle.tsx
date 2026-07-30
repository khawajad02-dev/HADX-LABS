"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioToggle({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(src);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.35;

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Autoplay/permission errors are silently ignored;
        // the toggle stays off if playback couldn't start.
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
      className={`
        fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full
        backdrop-blur-md bg-black/50 border border-hadx-border
        flex items-center justify-center
        transition-all duration-300
        hover:border-hadx-border-glow hover:shadow-gold-glow
        ${isPlaying ? "shadow-gold-glow animate-pulse-glow" : ""}
      `}
    >
      {isPlaying ? (
        <svg width="16" height="16" viewBox="0 0 24 24" className="fill-hadx-gold-light">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" className="fill-hadx-gold">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}