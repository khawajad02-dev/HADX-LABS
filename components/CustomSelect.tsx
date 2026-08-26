'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  searchable?: boolean;
  allowCustomOption?: boolean;
  searchPlaceholder?: string;
  onCustomSelect?: (value: string) => void;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  ariaLabel,
  className = '',
  searchable = false,
  allowCustomOption = false,
  searchPlaceholder = 'Type to search',
  onCustomSelect,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = searchable && normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative min-w-[11rem] ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((current) => !current);
          setSearchQuery('');
        }}
        className="flex w-full items-center justify-between gap-4 rounded-full border border-white/10 bg-[#0D0D0D]/90 px-4 py-2 text-left text-[11px] font-mono uppercase tracking-wide text-[#E0E0E0] shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-[12px] transition-colors hover:border-[#D4AF37]/60 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/70"
      >
        <span className={selected ? 'text-[#E0E0E0]' : 'text-white/45'}>{selected?.label || placeholder}</span>
        <span className={`text-[#D4AF37] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[80] overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D]/95 p-1 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-[12px]"
        >
          {searchable ? (
            <div className="border-b border-white/10 p-2">
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && allowCustomOption && searchQuery.trim()) {
                    event.preventDefault();
                    onChange('Other');
                    onCustomSelect?.(searchQuery.trim());
                    setOpen(false);
                  }
                }}
                autoFocus
                placeholder={searchPlaceholder}
                aria-label={`${ariaLabel} search`}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.08em] text-[#E0E0E0] placeholder:text-white/35 focus:border-[#D4AF37]/70 focus:outline-none"
              />
            </div>
          ) : null}
          {filteredOptions.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.08em] transition-colors ${active ? 'bg-[#D4AF37] text-[#0D0D0D]' : 'text-[#E0E0E0]/80 hover:bg-white/[0.08] hover:text-[#D4AF37]'}`}
              >
                <span>{option.label}</span>
                {active ? <span aria-hidden="true">●</span> : null}
              </button>
            );
          })}
          {searchable && allowCustomOption && normalizedQuery && !filteredOptions.some((option) => option.label.toLowerCase() === normalizedQuery || option.value.toLowerCase() === normalizedQuery) ? (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onChange('Other');
                onCustomSelect?.(searchQuery.trim());
                setOpen(false);
                setSearchQuery('');
              }}
              className="mt-1 flex w-full items-center justify-between rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/[0.08] px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.08em] text-[#D4AF37] hover:bg-[#D4AF37]/[0.16]"
            >
              <span>Use “{searchQuery.trim()}”</span>
              <span aria-hidden="true">✓</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { CustomSelect };
