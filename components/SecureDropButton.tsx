"use client";

import { useState } from "react";

type SecureDropButtonProps = {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
};

export default function SecureDropButton({
  onClick,
  label = "CLAIM DROP",
  disabled = false,
}: SecureDropButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        liquid-ui group relative overflow-hidden rounded-xl px-10 py-5
        border border-hadx-border
        transition-all duration-300 ease-out
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-hadx-border-glow hover:shadow-gold-glow-lg cursor-pointer"}
        ${isPressed && !disabled ? "scale-[0.98]" : "scale-100"}
      `}
    >
      {/* Scratched gold border overlay */}
      <span
        className="pointer-events-none absolute inset-0 rounded-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(115deg, transparent 20%, rgba(245,158,11,0.35) 35%, transparent 45%, transparent 65%, rgba(253,230,138,0.25) 78%, transparent 90%)",
        }}
      />

      {/* Sweep highlight on hover */}
      <span className="pointer-events-none absolute -inset-y-full -left-1/2 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-hadx-gold-light/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[250%] transition-all duration-700 ease-out" />

      <span className="relative flex items-center justify-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-hadx-gold-light group-hover:text-hadx-gold-light">
        [&nbsp;
        <span className="bg-clip-text text-transparent bg-gold-gradient">{label}</span>
        &nbsp;]
      </span>
    </button>
  );
}