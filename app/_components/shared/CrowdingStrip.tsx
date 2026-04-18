'use client';

import React from 'react';

interface CrowdingStripProps {
  crowding: number[];
  style?: 'bars' | 'dots' | 'heatmap';
  invert?: boolean;
  size?: 'sm' | 'md';
}

export function crowdingColor(c: number, invert = false): string {
  if (invert) {
    if (c < 0.4) return 'oklch(0.78 0.09 150)';
    if (c < 0.75) return 'oklch(0.78 0.14 75)';
    return 'oklch(0.72 0.18 30)';
  }
  if (c < 0.4) return 'var(--ok)';
  if (c < 0.75) return 'var(--warn)';
  return 'var(--bad)';
}

export default function CrowdingStrip({ crowding, style = 'bars', invert = false, size = 'md' }: CrowdingStripProps) {
  const h = size === 'sm' ? 14 : 22;
  const textMuted = invert ? 'color-mix(in oklab, var(--bg), transparent 50%)' : 'var(--ink-3)';
  const srSummary = crowding.map((c, i) =>
    `car ${i + 1} ${c < 0.4 ? 'quiet' : c < 0.75 ? 'moderate' : 'busy'}`
  ).join(', ');

  if (style === 'dots') {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <span className="sr-only">Carriage occupancy: {srSummary}</span>
        {crowding.map((c, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0, 1, 2].map(tier => (
                <div key={tier} style={{
                  width: 4, height: 4, borderRadius: 4,
                  background: c * 3 > tier
                    ? crowdingColor(c, invert)
                    : (invert ? 'color-mix(in oklab, var(--bg), transparent 85%)' : 'var(--line)'),
                }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 9, color: textMuted }}>{i + 1}</span>
          </div>
        ))}
      </div>
    );
  }

  if (style === 'heatmap') {
    return (
      <div>
        <span className="sr-only">Carriage occupancy: {srSummary}</span>
        <div style={{ display: 'flex', gap: 3, height: h, borderRadius: 4, overflow: 'hidden' }}>
          {crowding.map((c, i) => (
            <div key={i} style={{ flex: 1, background: crowdingColor(c, invert), opacity: 0.35 + c * 0.65 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
          {crowding.map((_, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <span className="mono" style={{ fontSize: 9, color: textMuted }}>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // bars (default)
  return (
    <div>
      <span className="sr-only">Carriage occupancy: {srSummary}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: h }}>
        {crowding.map((c, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${Math.max(10, c * 100)}%`,
            background: crowdingColor(c, invert),
            borderRadius: 2,
            transition: 'height 0.4s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {crowding.map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <span className="mono" style={{ fontSize: 9, color: textMuted }}>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
