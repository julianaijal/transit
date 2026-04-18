'use client';

import React from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { IconArrow } from '../icons/Icons';
import CrowdingStrip from './CrowdingStrip';

interface DepartureRowProps {
  d: IDeparture;
  onClick: () => void;
  verbose?: boolean;
  tweaks?: ITweaks;
}

export default function DepartureRow({ d, onClick, verbose = false }: DepartureRowProps) {
  const actual = new Date(d.actualDateTime);
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 0', display: 'flex', gap: 14, alignItems: 'center',
      borderBottom: '1px solid var(--line-2)', textAlign: 'left',
    }}>
      <div style={{ width: 54 }}>
        <div className="serif num" style={{ fontSize: 24, lineHeight: 1, letterSpacing: '-0.02em' }}>{timeStr}</div>
        {d.delayMinutes > 0 && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: 4 }}>+{d.delayMinutes}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span className="chip">{d.trainCategory}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>TRACK {d.actualTrack}</span>
          {d.trackChanged && <span className="chip warn">changed</span>}
          {d.cancelled && <span className="chip" style={{ color: 'var(--bad-text)' }}>cancelled</span>}
        </div>
        <div className="serif" style={{ fontSize: 17, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {d.direction}
        </div>
        {verbose && d.crowding && (
          <div style={{ marginTop: 8, maxWidth: 220 }}>
            <CrowdingStrip crowding={d.crowding} style="bars" size="sm" />
          </div>
        )}
      </div>
      <IconArrow aria-hidden="true" style={{ width: 14, height: 14, color: 'var(--ink-3)' }} />
    </button>
  );
}
