"use client";

import { useEffect, useRef, useState } from "react";

interface AudioToggleProps {
  src?: string;
}

export default function AudioToggle({ src = "/obsidian_loom.mp3" }: AudioToggleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(src);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.35;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src]);

  const toggle = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio playback blocked or failed:", err);
        setIsPlaying(false);
      }
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
      className={`
        w-14 h-14 rounded-full
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
