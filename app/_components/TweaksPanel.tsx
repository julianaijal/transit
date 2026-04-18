'use client';

import React from 'react';
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
  return (
    <div className="tweaks">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="eyebrow">Tweaks</div>
        <button onClick={onClose} style={{ color: 'var(--ink-3)' }}>
          <IconClose style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <TweakRow label="Theme">
        <Segmented
          value={tweaks.theme}
          onChange={v => onChange('theme', v)}
          options={[['light', 'Light'], ['dark', 'Dark']]}
        />
      </TweakRow>

      <TweakRow label="Verbosity">
        <Segmented
          value={tweaks.verbosity}
          onChange={v => onChange('verbosity', v)}
          options={[['minimal', 'Minimal'], ['rich', 'Data-rich']]}
        />
      </TweakRow>

      <TweakRow label="Crowding display">
        <Segmented
          value={tweaks.crowdingStyle}
          onChange={v => onChange('crowdingStyle', v)}
          options={[['bars', 'Bars'], ['dots', 'Dots'], ['heatmap', 'Heat']]}
        />
      </TweakRow>

      <TweakRow label="Accent">
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(ACCENT_MAP).map(([k, c]) => (
            <button
              key={k}
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

function Segmented({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-2)', padding: 3, borderRadius: 100, border: '1px solid var(--line)' }}>
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 100,
            fontSize: 12, fontWeight: 500,
            background: value === v ? 'var(--ink)' : 'transparent',
            color: value === v ? 'var(--bg)' : 'var(--ink-2)',
            transition: 'all 0.15s',
          }}
        >{label}</button>
      ))}
    </div>
  );
}
