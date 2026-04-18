'use client';

import React from 'react';
import { IDeparture } from '../../interfaces/interfaces';
import { IconArrow } from '../icons/Icons';
import CrowdingStrip from './CrowdingStrip';

interface FullDepartureRowProps {
  d: IDeparture;
  onOpen: () => void;
  verbose?: boolean;
  crowdingStyle?: 'bars' | 'dots' | 'heatmap';
}

export default function FullDepartureRow({ d, onOpen, verbose = false, crowdingStyle = 'bars' }: FullDepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const planned = new Date(d.plannedDateTime);
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const plannedStr = planned.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button onClick={onOpen} style={{
      width: '100%', padding: '16px 0', display: 'grid',
      gridTemplateColumns: '72px 1fr auto', gap: 14, alignItems: 'start',
      borderBottom: '1px solid var(--line-2)', textAlign: 'left',
    }}>
      <div>
        <div className="serif num" style={{
          fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em',
          textDecoration: d.cancelled ? 'line-through' : 'none',
        }}>
          {timeStr}
        </div>
        {d.delayMinutes > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5, alignItems: 'baseline' }}>
            <span className="mono num" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>+{d.delayMinutes}</span>
            <span className="mono num" style={{ fontSize: 10, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{plannedStr}</span>
          </div>
        )}
        {d.delayMinutes === 0 && !d.cancelled && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ok)', marginTop: 5 }}>on time</div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <span className="chip">{d.trainCategory}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>TRACK {d.actualTrack}</span>
          {d.trackChanged && <span className="chip warn">track changed</span>}
          {d.cancelled && (
            <span className="chip" style={{ color: 'var(--bad)', background: 'color-mix(in oklab, var(--bad) 14%, transparent)' }}>cancelled</span>
          )}
        </div>
        <div className="serif" style={{ fontSize: 19, lineHeight: 1.2 }}>{d.direction}</div>
        {verbose && !d.cancelled && d.crowding && (
          <div style={{ marginTop: 10, maxWidth: 240 }}>
            <CrowdingStrip crowding={d.crowding} style={crowdingStyle} size="sm" />
          </div>
        )}
      </div>

      <IconArrow style={{ width: 14, height: 14, color: 'var(--ink-3)', marginTop: 10 }} />
    </button>
  );
}
