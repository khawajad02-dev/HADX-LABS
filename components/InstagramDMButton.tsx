"use client";

const INSTAGRAM_USERNAME = "hadx_labs.io.official";
const INSTAGRAM_WEB_URL =
  "https://www.instagram.com/hadx_labs.io.official?igsh=ODR3MWE3czRjbm9l";
const INSTAGRAM_APP_DEEPLINK = `instagram://user?username=${INSTAGRAM_USERNAME}`;

export default function InstagramDMButton({
  label = "MESSAGE US",
}: {
  label?: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const isMobile = /iPhone|iPad|iPod|Android/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );

    if (!isMobile) {
      window.open(INSTAGRAM_WEB_URL, "_blank", "noopener,noreferrer");
      return;
    }

    // Try the native app deep-link first.
    const fallbackTimer = setTimeout(() => {
      window.open(INSTAGRAM_WEB_URL, "_blank", "noopener,noreferrer");
    }, 1200);

    const cleanup = () => {
      clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", cleanup);
    };
    document.addEventListener("visibilitychange", cleanup);

    window.location.href = INSTAGRAM_APP_DEEPLINK;
  };

  return (
    <a
      href={INSTAGRAM_WEB_URL}
      onClick={handleClick}
      className="
        group inline-flex items-center gap-2 rounded-full px-7 py-3.5
        backdrop-blur-md bg-black/50 border border-hadx-border
        transition-all duration-300
        hover:border-hadx-border-glow hover:shadow-gold-glow
      "
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="text-hadx-gold-light"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
      </svg>
      <span className="text-[12px] font-mono tracking-[0.2em] uppercase text-hadx-gold-light">
        {label}
      </span>
    </a>
  );
}