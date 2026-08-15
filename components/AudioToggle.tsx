"use client";

import { useEffect, useRef, useState } from "react";

interface AudioToggleProps {
  src?: string;
}

// Global audio instance to maintain playback across component mounts/unmounts
let globalAudio: HTMLAudioElement | null = null;

export default function AudioToggle({ src = "/obsidian_loom.mp3" }: AudioToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize global audio if it doesn't exist
    if (typeof window !== "undefined" && !globalAudio) {
      globalAudio = new Audio(src);
      globalAudio.loop = true;
      globalAudio.volume = 0.35;
    }

    // Sync local state with global audio
    if (globalAudio) {
      setIsPlaying(!globalAudio.paused);
    }
    
    // We explicitly do NOT pause or null the audio on cleanup to keep it playing
    // when the CyberOrb menu is closed/collapsed.
  }, [src]);

  const toggle = async () => {
    if (!globalAudio) return;

    if (isPlaying) {
      globalAudio.pause();
      setIsPlaying(false);
    } else {
      try {
        await globalAudio.play();
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
        liquid-ui w-14 h-14 rounded-full
        flex items-center justify-center
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
