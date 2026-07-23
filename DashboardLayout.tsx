"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  Archive,
  Menu,
  X,
  User
} from "lucide-react";

export const SIDEBAR_WIDTH = 285;
const SIDEBAR_STYLE = { "--sidebar-width": `${SIDEBAR_WIDTH}px` } as React.CSSProperties;

const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface NavItem {
  readonly name: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const navigationItems = Object.freeze([
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products Module", href: "/dashboard/products", icon: ShoppingBag },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Archive", href: "/dashboard/archive", icon: Archive },
] as const satisfies readonly NavItem[]);

interface SidebarContentProps {
  isMobile?: boolean;
  onClose?: () => void;
  pathname: string;
  titleId?: string;
}

const SidebarContent = React.memo(function SidebarContent({ isMobile = false, onClose, pathname, titleId }: SidebarContentProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const getFocusableElements = (): HTMLElement[] => {
    if (!drawerRef.current) return [];
    return Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
      if (el.hasAttribute("disabled") || el.tabIndex === -1) return false;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getClientRects().length > 0;
    });
  };

  useEffect(() => {
    if (!isMobile || !onClose) return;

    const scrollY = window.scrollY;
    const originalStyle = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalTop = document.body.style.top;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${scrollY}px`;

    const focusables = getFocusableElements();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      drawerRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      window.scrollTo(0, scrollY);
    };
  }, [isMobile, onClose]);

  const handleSyntheticKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isMobile || !onClose) return;

    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = getFocusableElements();

    if (!focusables.length || focusables.length === 1) {
      e.preventDefault();
      return;
    }

    const firstElement = focusables[0];
    const lastElement = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  const glowTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 300, damping: 26 };

  return (
    <div
      ref={drawerRef}
      tabIndex={-1}
      onKeyDown={handleSyntheticKeyDown}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-r-3xl border border-white/10 bg-white/[0.045] p-6 text-white backdrop-blur-3xl shadow-[0_10px_45px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-white/[0.04] outline-none"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between pb-8">
          <motion.h1
            id={titleId}
            whileHover={isMobile ? undefined : { y: -1, scale: 1.01 }}
            transition={{ duration: 0.15 }}
            className="text-xl font-bold tracking-wider text-cyan-400 select-none"
          >
            HADX LABS
          </motion.h1>
          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-2 text-white/60 hover:text-white transition-colors touch-manipulation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

            const { icon: Icon } = item;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 touch-manipulation"
              >
                {isActive && (
                  <motion.div
                    layoutId={isMobile ? "mobile-activeGlow" : "desktop-activeGlow"}
                    transition={glowTransition}
                    className="absolute inset-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                  />
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-cyan-300" : "text-white/60 group-hover:text-cyan-300"}`} />
                  <span className={`transition-all duration-300 group-hover:translate-x-0.5 ${isActive ? "font-semibold text-white" : "text-white/75 group-hover:text-white"}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <User className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs text-white/40">Identity</p>
              <p className="text-sm font-medium text-white">Commando Node</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const mobileSidebarTitleId = useId();

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (wasOpenRef.current && !mobileOpen) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    if (!contentRef.current) return;

    if (mobileOpen) {
      contentRef.current.setAttribute("inert", "");
    } else {
      contentRef.current.removeAttribute("inert");
    }
  }, [mobileOpen]);

  const drawerTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 260, damping: 28 };

  return (
    <div style={SIDEBAR_STYLE} className="relative min-h-dvh w-full overflow-x-hidden bg-[#0a051b] font-sans antialiased selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/15 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-900/15 blur-[130px]" />
      </div>

      <div className="relative z-10 flex h-dvh w-full overflow-hidden">
        <div className="hidden md:block h-full shrink-0 w-[var(--sidebar-width)]">
          <SidebarContent pathname={pathname} />
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                id="mobile-sidebar"
                role="dialog"
                aria-modal="true"
                aria-labelledby={mobileSidebarTitleId}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={drawerTransition}
                className="fixed bottom-0 left-0 top-0 z-50 h-full w-[var(--sidebar-width)] md:hidden outline-none"
              >
                <SidebarContent
                  isMobile
                  pathname={pathname}
                  titleId={mobileSidebarTitleId}
                  onClose={() => setMobileOpen(false)}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div
          ref={contentRef}
          className="flex flex-1 flex-col overflow-hidden"
          aria-hidden={mobileOpen ? true : undefined}
        >
          <header className="flex h-16 items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 text-white backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-sidebar"
                className="rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10 md:hidden touch-manipulation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium tracking-wide text-white/50 md:block hidden">System Node Active</span>
            </div>
            <div className="flex items-center gap-3 select-none">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Secure Link</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
