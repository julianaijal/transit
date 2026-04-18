'use client';

import React from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { IconBack } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';

interface JourneyViewProps {
  train: IDeparture | null;
  tweaks: ITweaks;
  onBack: () => void;
}

const STOPS = [
  { code: 'ASD',  name: 'Amsterdam Centraal',  time: '08:14', track: '5',  here: true },
  { code: 'ASS',  name: 'Amsterdam Sloterdijk', time: '08:19', track: '3'  },
  { code: 'SHL',  name: 'Schiphol Airport',     time: '08:28', track: '4'  },
  { code: 'LEDN', name: 'Leiden Centraal',       time: '08:39', track: '2'  },
  { code: 'GVC',  name: 'Den Haag Centraal',    time: '08:52', track: '7'  },
  { code: 'DT',   name: 'Delft',                time: '09:00', track: '3'  },
  { code: 'RTD',  name: 'Rotterdam Centraal',   time: '09:12', track: '15', destination: true },
];

function quietestIdx(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

export default function JourneyView({ train, tweaks, onBack }: JourneyViewProps) {
  if (!train) return null;

  const stops = STOPS.map((s, i) => ({
    ...s,
    name: i === STOPS.length - 1 ? train.direction ?? s.name : s.name,
    track: i === 0 ? (train.actualTrack ?? s.track) : s.track,
  }));

  const crowding = train.crowding ?? Array.from({ length: 6 }, () => Math.random() * 0.6 + 0.2);
  const quietest = quietestIdx(crowding);
  const actual = new Date(train.actualDateTime);

  return (
    <div className="view fade-up">
      {/* Header */}
      <div style={{ padding: '18px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
        <span className="now-pill"><span className="dot live" /> tracking</span>
      </div>

      {/* Big headline */}
      <div style={{ padding: '6px 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {train.trainCategory} · TRAIN {train.trainId ?? '3523'}
        </div>
        <div className="serif" style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          <em style={{ fontStyle: 'italic' }}>{stops[0].name}</em>
          <span style={{ color: 'var(--ink-3)' }}> → </span>
          <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <div className="serif num" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
            {actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="mono" style={{ fontSize: 12, color: train.delayMinutes > 0 ? 'var(--accent)' : 'var(--ok)' }}>
            {train.delayMinutes > 0 ? `+${train.delayMinutes} min` : 'on time'}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            TRACK {train.actualTrack}
          </div>
        </div>
      </div>

      {/* Platform choreography */}
      <div style={{ padding: '0 20px 4px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Platform choreography</div>
        <div className="card" style={{ padding: 16 }}>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.3 }}>
            Stand at the <em>{quietest < crowding.length / 2 ? 'front' : 'back'}</em> of Track {train.actualTrack}.
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.45 }}>
            Car <strong>{quietest + 1}</strong> is quietest right now. It&apos;ll stop near the{' '}
            <strong>{quietest < crowding.length / 2 ? 'north' : 'south'}</strong> end of the platform — also closest to the Utrecht exit escalators.
          </div>

          <div style={{ marginTop: 16 }}>
            <PlatformDiagram
              crowding={crowding}
              highlight={quietest}
              quietCar={train.quietCarriage ?? null}
              firstClass={train.firstClassCars ?? []}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <CrowdingStrip crowding={crowding} style={tweaks.crowdingStyle} />
          </div>
        </div>
      </div>

      {/* Delay propagation */}
      {train.delayMinutes > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--accent)' }}>⁕ Why you&apos;re late</div>
          <div className="card" style={{ padding: 16, background: 'color-mix(in oklab, var(--accent) 4%, var(--bg-2))', borderColor: 'var(--accent-dim)' }}>
            <div className="serif" style={{ fontSize: 17, lineHeight: 1.35 }}>
              Signaling disruption near <em>Duivendrecht</em> cascaded north. Your train inherited{' '}
              <em>{train.delayMinutes} min</em> of knock-on delay.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
              <Spark />
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>delay trend · last 30 min, decreasing</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Journey timeline · {stops.length} stops</div>
        <div style={{ position: 'relative' }}>
          {stops.map((s, i) => (
            <StopRow key={s.code} stop={s} last={i === stops.length - 1} delayed={train.delayMinutes} />
          ))}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

interface Stop {
  code: string;
  name: string;
  time: string;
  track: string;
  here?: boolean;
  destination?: boolean;
}

function PlatformDiagram({ crowding, highlight, quietCar, firstClass }: {
  crowding: number[];
  highlight: number;
  quietCar: number | null;
  firstClass: number[];
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {crowding.map((_, i) => {
          const isFirst = firstClass.includes(i);
          const isQuiet = quietCar === i;
          const isHi = highlight === i;
          return (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 5,
              background: isHi ? 'var(--ink)' : 'var(--bg-3)',
              color: isHi ? 'var(--bg)' : 'var(--ink-2)',
              border: `1px solid ${isHi ? 'var(--ink)' : 'var(--line)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', fontSize: 10,
            }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600 }}>{i + 1}</span>
              {isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>1ST</span>}
              {isQuiet && !isFirst && <span className="mono" style={{ fontSize: 8, opacity: 0.6 }}>QUIET</span>}
              {isHi && (
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 12 }}>↓</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>← FRONT · North end</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>South end · BACK →</span>
      </div>
    </div>
  );
}

function StopRow({ stop, last, delayed }: { stop: Stop; last: boolean; delayed: number }) {
  const [h, m] = stop.time.split(':').map(Number);
  const actualM = m + (delayed || 0);
  const actualTime = `${String(h + Math.floor(actualM / 60)).padStart(2, '0')}:${String(actualM % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      <div style={{ width: 60, textAlign: 'right', paddingTop: 8 }}>
        <div className="mono num" style={{ fontSize: 13, fontWeight: 500 }}>{actualTime}</div>
        {delayed > 0 && (
          <div className="mono num" style={{ fontSize: 10.5, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{stop.time}</div>
        )}
      </div>

      <div style={{ position: 'relative', width: 18, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: last ? '50%' : 0, width: 1.5, background: 'var(--line)' }} />
        <div style={{
          position: 'absolute', left: 4, top: 10,
          width: 10, height: 10, borderRadius: '50%',
          background: stop.here ? 'var(--accent)' : 'var(--bg)',
          border: `1.5px solid ${stop.here || stop.destination ? 'var(--ink)' : 'var(--ink-3)'}`,
          boxShadow: stop.here ? '0 0 0 4px var(--accent-dim)' : 'none',
        }} />
      </div>

      <div style={{ flex: 1, padding: '6px 0 18px' }}>
        <div className="serif" style={{
          fontSize: stop.here || stop.destination ? 18 : 16,
          lineHeight: 1.2,
          fontStyle: stop.here ? 'italic' : 'normal',
          color: stop.here ? 'var(--accent)' : 'var(--ink)',
        }}>
          {stop.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{stop.code}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>· TRACK {stop.track}</span>
        </div>
      </div>
    </div>
  );
}

function Spark() {
  const points = [6, 7, 8, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2];
  const max = Math.max(...points);
  return (
    <svg width="160" height="24" viewBox="0 0 160 24" fill="none">
      <polyline
        points={points.map((v, i) => `${(i / (points.length - 1)) * 160},${24 - (v / max) * 20 - 2}`).join(' ')}
        fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}
