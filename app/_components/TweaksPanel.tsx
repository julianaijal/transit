'use client';

import React, { useRef, useEffect } from 'react';
import { ITweaks } from '../interfaces/interfaces';
import { IconClose } from './icons/Icons';

const ACCENT_MAP: Record<string, string> = {
  orange: 'oklch(0.60 0.17 45)',
  cobalt: 'oklch(0.55 0.19 265)',
  sage:   'oklch(0.58 0.13 155)',
  plum:   'oklch(0.48 0.18 330)',
};

interface TweaksPanelProps {
  tweaks: ITweaks;
  onChange: (key: keyof ITweaks, value: string) => void;
  onClose: () => void;
}

export default function TweaksPanel({ tweaks, onChange, onClose }: TweaksPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus trap + Escape to close + focus restoration on unmount
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => {
      panel.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []); // empty deps: run only on mount/unmount

  return (
    <div
      ref={panelRef}
      className="tweaks"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tweaks-title"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div id="tweaks-title" className="eyebrow">Tweaks</div>
        <button onClick={onClose} style={{ color: 'var(--ink-3)' }} aria-label="Close tweaks">
          <IconClose style={{ width: 16, height: 16 }} aria-hidden="true" />
        </button>
      </div>

      <TweakRow label="Theme">
        <Segmented
          label="Theme"
          value={tweaks.theme}
          onChange={v => onChange('theme', v)}
          options={[['light', 'Light'], ['dark', 'Dark']]}
        />
      </TweakRow>

      <TweakRow label="Verbosity">
        <Segmented
          label="Verbosity"
          value={tweaks.verbosity}
          onChange={v => onChange('verbosity', v)}
          options={[['minimal', 'Minimal'], ['rich', 'Data-rich']]}
        />
      </TweakRow>

      <TweakRow label="Crowding display">
        <Segmented
          label="Crowding display"
          value={tweaks.crowdingStyle}
          onChange={v => onChange('crowdingStyle', v)}
          options={[['bars', 'Bars'], ['dots', 'Dots'], ['heatmap', 'Heat']]}
        />
      </TweakRow>

      <TweakRow label="Accent">
        <AccentSwatches tweaks={tweaks} onChange={onChange} />
      </TweakRow>
    </div>
  );
}

export { ACCENT_MAP };

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options, label }: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const idx = options.findIndex(([v]) => v === value);
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % options.length
      : (idx - 1 + options.length) % options.length;
    onChange(options[next][0]);
    // Move focus to the next button
    const buttons = groupRef.current?.querySelectorAll<HTMLElement>('button');
    buttons?.[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', background: 'var(--bg-2)', padding: 3, borderRadius: 100, border: '1px solid var(--line)' }}
    >
      {options.map(([v, optionLabel]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
          tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 500,
            background: value === v ? 'var(--ink)' : 'transparent',
            color: value === v ? 'var(--bg)' : 'var(--ink-2)',
            transition: 'all 0.15s',
          }}
        >{optionLabel}</button>
      ))}
    </div>
  );
}

function AccentSwatches({ tweaks, onChange }: { tweaks: ITweaks; onChange: (key: keyof ITweaks, value: string) => void }) {
  const groupRef = useRef<HTMLDivElement>(null);
  const accentKeys = Object.keys(ACCENT_MAP);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const idx = accentKeys.indexOf(tweaks.accent);
    const next = e.key === 'ArrowRight'
      ? (idx + 1) % accentKeys.length
      : (idx - 1 + accentKeys.length) % accentKeys.length;
    onChange('accent', accentKeys[next]);
    const buttons = groupRef.current?.querySelectorAll<HTMLElement>('button');
    buttons?.[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Accent colour"
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', gap: 8 }}
    >
      {Object.entries(ACCENT_MAP).map(([k, c]) => (
        <button
          key={k}
          role="radio"
          aria-checked={tweaks.accent === k}
          aria-label={k.charAt(0).toUpperCase() + k.slice(1)}
          tabIndex={tweaks.accent === k ? 0 : -1}
          onClick={() => onChange('accent', k)}
          style={{
            width: 26, height: 26, borderRadius: 100, background: c,
            outline: tweaks.accent === k ? '2px solid var(--ink)' : 'none', outlineOffset: 2,
          }}
        />
      ))}
    </div>
  );
}
