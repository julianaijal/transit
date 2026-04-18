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

  // Focus trap + Escape to close + focus restoration on unmount
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus to first focusable element inside the panel
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusable.length > 0) {
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
      previousFocus?.focus();   // restore focus to trigger element on close
    };
  }, [onClose]);

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
        <div role="radiogroup" aria-label="Accent colour" style={{ display: 'flex', gap: 8 }}>
          {Object.entries(ACCENT_MAP).map(([k, c]) => (
            <button
              key={k}
              role="radio"
              aria-checked={tweaks.accent === k}
              aria-label={`Accent colour: ${k}`}
              onClick={() => onChange('accent', k)}
              style={{
                width: 26, height: 26, borderRadius: 100, background: c,
                outline: tweaks.accent === k ? '2px solid var(--ink)' : 'none', outlineOffset: 2,
              }}
            />
          ))}
        </div>
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
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{ display: 'flex', background: 'var(--bg-2)', padding: 3, borderRadius: 100, border: '1px solid var(--line)' }}
    >
      {options.map(([v, optionLabel]) => (
        <button
          key={v}
          role="radio"
          aria-checked={value === v}
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
