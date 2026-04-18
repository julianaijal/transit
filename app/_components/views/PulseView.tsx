'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IDeparture, IActiveTrain, IDisruption, ITweaks } from '../../interfaces/interfaces';
import { generateActiveTrains, generateDisruptions, STATIONS, project } from '../../_utils/mock';
import { IconClose, IconArrow } from '../icons/Icons';

interface PulseViewProps {
  tweaks: ITweaks;
  onOpenJourney: (train: IDeparture) => void;
  onOpenStation: (station: { code: string; name: string; lat?: number; lng?: number }) => void;
}

const MAJOR_STATIONS = ['ASD', 'UT', 'RTD', 'GVC', 'SHL', 'EHV'];

const ROUTES = [
  ['ASD','UT'], ['UT','EHV'], ['EHV','MT'], ['ASD','SHL'], ['SHL','LEDN'],
  ['LEDN','GVC'], ['GVC','RTD'], ['RTD','BD'], ['BD','EHV'], ['ASD','AMF'],
  ['AMF','UT'], ['AMF','ZL'], ['ZL','GN'], ['RTD','UT'], ['HLM','ASD'],
  ['LEDN','SHL'], ['UT','HT'], ['HT','EHV'], ['ASD','HLM'], ['RTD','SHL'],
];

const NL_PTS: [number, number][] = [
  [3.35,51.20],[3.50,51.50],[3.70,51.55],[4.20,51.40],[4.60,51.45],
  [5.05,51.45],[5.20,51.20],[5.80,50.80],[6.10,50.85],[6.00,51.20],
  [6.20,51.50],[6.40,51.85],[7.10,52.25],[7.20,52.60],[6.80,52.95],
  [6.95,53.20],[7.20,53.30],[6.70,53.50],[5.90,53.45],[5.20,53.40],
  [4.70,53.10],[5.05,52.85],[4.75,52.50],[4.55,52.35],[4.20,52.10],
  [3.90,51.75],[3.50,51.55],[3.35,51.20],
];

function nlPath(): string {
  return NL_PTS.map(([lng, lat], i) => {
    const p = project(lat, lng);
    return `${i === 0 ? 'M' : 'L'}${(p.x * 400).toFixed(1)},${(p.y * 520).toFixed(1)}`;
  }).join(' ') + 'Z';
}

export default function PulseView({ onOpenJourney, onOpenStation }: PulseViewProps) {
  const [trains, setTrains] = useState<IActiveTrain[]>(() => generateActiveTrains(40));
  const [disruptions] = useState<IDisruption[]>(() => {
    // Try to get live disruptions later; use mock for now
    return generateDisruptions();
  });
  const [selected, setSelected] = useState<IActiveTrain | null>(null);
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  // Try live disruptions
  useEffect(() => {
    // Non-blocking; mock already set
    fetch('/api/disruptions').then(r => r.json()).catch(() => null);
  }, []);

  // Advance trains via rAF
  useEffect(() => {
    lastTsRef.current = performance.now();
    const loop = (ts: number) => {
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      setTrains(prev => prev.map(tr => {
        let t = tr.t + tr.speed * dt;
        if (t > 1) t = 0;
        return { ...tr, t };
      }));
      setTick(k => k + 1);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const delayed = trains.filter(t => t.delayMin >= 3).length;
  const onTimeRate = ((trains.length - trains.filter(t => t.delayMin >= 1).length) / trains.length * 100).toFixed(0);

  return (
    <div className="view fade-up" style={{ paddingBottom: 0 }}>
      {/* Screen reader: disruption announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {disruptions.filter(d => d.severity > 0.3).map(d => d.label).join(', ')}
      </div>

      {/* Screen reader: selected train announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selected
          ? `Trein ${selected.id} geselecteerd: ${selected.from.name} naar ${selected.to.name}${selected.delayMin > 0 ? `, ${selected.delayMin} min vertraging` : ''}.`
          : ''}
      </div>

      {/* Masthead */}
      <div style={{ padding: '24px 20px 12px' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>The Network · live</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            Pulse<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
          </div>
          <span className="now-pill"><span className="dot live" /> {timeLabel}</span>
        </div>
        <div className="serif" style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 4, fontStyle: 'italic' }}>
          {trains.length} trains moving —{' '}
          {delayed > 0 ? `${delayed} running late in the Randstad.` : 'the network is running clean.'}
        </div>
      </div>

      {/* Network stats bar — mobile only (desktop shows in side panel) */}
      <div className="pulse-stats-bar" style={{
        padding: '0 0 0 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)', marginTop: 4,
      }}>
        <NetStat big={String(trains.length)} label="in motion" />
        <NetStat big={`${onTimeRate}%`} label="on time" borderLeft />
        <NetStat big={String(disruptions.filter(d => d.severity > 0).length)} label="disruptions" borderLeft />
      </div>

      {/* ── Map + disruptions (side-by-side on desktop) ── */}
      <div className="pulse-map-layout">

      {/* Map area */}
      <div className="pulse-map-area" style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 400 520"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Kaart van het Nederlandse spoornetwerk met live treinposities en verstoringen."
          style={{ width: '100%', height: 'auto', display: 'block', background: 'var(--bg-2)' }}
        >
          <defs>
            <radialGradient id="grad-storm">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="grad-fog">
              <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.35" />
              <stop offset="70%" stopColor="var(--warn)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--warn)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="grad-sun">
              <stop offset="0%" stopColor="var(--ok)" stopOpacity="0.22" />
              <stop offset="70%" stopColor="var(--ok)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--ok)" stopOpacity="0" />
            </radialGradient>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--line-2)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="400" height="520" fill="url(#dot-grid)" />

          {/* NL outline */}
          <path d={nlPath()} fill="var(--bg-3)" stroke="var(--line)" strokeWidth="0.6" />

          {/* Weather overlays */}
          {disruptions.map(d => (
            <g key={d.id}>
              <circle
                cx={d.center.x * 400} cy={d.center.y * 520}
                r={d.radius * 400}
                fill={`url(#grad-${d.type})`}
              />
              {d.severity > 0.3 && (
                <circle
                  cx={d.center.x * 400} cy={d.center.y * 520}
                  r={d.radius * 400 * (0.6 + (tick % 120) / 120 * 0.5)}
                  fill="none" stroke="var(--accent)" strokeWidth="0.6"
                  strokeOpacity={0.6 - (tick % 120) / 120 * 0.6}
                />
              )}
            </g>
          ))}

          {/* Route lines */}
          {ROUTES.map(([a, b], i) => {
            const sa = STATIONS.find(s => s.code === a);
            const sb = STATIONS.find(s => s.code === b);
            if (!sa || !sb) return null;
            const pa = project(sa.lat, sa.lng);
            const pb = project(sb.lat, sb.lng);
            return (
              <line key={i}
                x1={pa.x * 400} y1={pa.y * 520}
                x2={pb.x * 400} y2={pb.y * 520}
                stroke="var(--line)" strokeWidth="1"
              />
            );
          })}

          {/* Stations */}
          {STATIONS.filter((s, i, arr) => arr.findIndex(x => x.code === s.code) === i).map(s => {
            const p = project(s.lat, s.lng);
            const major = MAJOR_STATIONS.includes(s.code);
            return (
              <g
                key={s.code}
                role="button"
                tabIndex={0}
                aria-label={`Station ${s.name}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenStation(s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenStation(s); } }}
              >
                <circle
                  cx={p.x * 400} cy={p.y * 520}
                  r={major ? 3.5 : 2}
                  fill="var(--bg)" stroke="var(--ink)" strokeWidth="1.5"
                />
                {major && (
                  <text
                    x={p.x * 400 + 7} y={p.y * 520 + 3}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fill="var(--ink-2)"
                    style={{ pointerEvents: 'none' }}
                  >{s.code}</text>
                )}
              </g>
            );
          })}

          {/* Trains */}
          {trains.map(tr => {
            const fp = project(tr.from.lat, tr.from.lng);
            const tp = project(tr.to.lat, tr.to.lng);
            const x = (fp.x + (tp.x - fp.x) * tr.t) * 400;
            const y = (fp.y + (tp.y - fp.y) * tr.t) * 520;
            const dx = (tp.x - fp.x) * 400;
            const dy = (tp.y - fp.y) * 520;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const color = tr.delayMin >= 3 ? 'var(--accent)' : tr.delayMin >= 1 ? 'var(--warn)' : 'var(--ink)';
            const isSel = selected?.id === tr.id;
            return (
              <g
                key={tr.id}
                role="button"
                tabIndex={0}
                aria-label={`Trein ${tr.id} (${tr.cat}): ${tr.from.name} → ${tr.to.name}${tr.delayMin > 0 ? `, ${tr.delayMin} min vertraging` : ', op tijd'}`}
                transform={`translate(${x}, ${y}) rotate(${angle})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(tr)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(tr); } }}
              >
                <rect x={-5} y={-1.5} width={10} height={3} fill={color} rx="0.5" />
                {isSel && <circle cx={0} cy={0} r={9} fill="none" stroke={color} strokeWidth="0.8" />}
              </g>
            );
          })}
        </svg>

        {/* Selected train card */}
        {selected && (
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 12,
            background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 14, padding: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            animation: 'fadeUp 0.2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 2 }}>Train {selected.id.toUpperCase()} · {selected.cat}</div>
                <div className="serif" style={{ fontSize: 19, lineHeight: 1.2 }}>
                  {selected.from.name} <em style={{ color: 'var(--ink-3)' }}>→</em> {selected.to.name}
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>
                  {selected.delayMin > 0 ? `+${selected.delayMin} MIN LATE` : 'ON TIME'} · {(selected.t * 100).toFixed(0)}% ALONG ROUTE
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Sluit treinkaart"
                style={{ padding: 4, color: 'var(--ink-3)' }}
              >
                <IconClose style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <button
              onClick={() => {
                onOpenJourney({
                  id: selected.id,
                  direction: selected.to.name,
                  destinationCode: selected.to.code,
                  trainCategory: selected.cat,
                  trainId: selected.id,
                  delayMinutes: selected.delayMin,
                  actualTrack: '—',
                  plannedTrack: '—',
                  trackChanged: false,
                  crowding: Array.from({ length: 6 }, () => Math.random()),
                  plannedDateTime: new Date().toISOString(),
                  actualDateTime: new Date().toISOString(),
                  cancelled: false,
                });
              }}
              style={{
                marginTop: 10, width: '100%', padding: '10px 12px',
                background: 'var(--ink)', color: 'var(--bg)',
                borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, fontWeight: 500,
              }}
            >
              <span>View journey</span>
              <IconArrow style={{ width: 15, height: 15 }} />
            </button>
          </div>
        )}
      </div>{/* /pulse-map-area */}

      {/* Disruption side panel */}
      <div className="pulse-side-panel">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Today&apos;s weather</div>

        {/* Network stats — repeated in side panel for desktop context */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div>
            <div className="serif num" style={{ fontSize: 22, lineHeight: 1 }}>{trains.length}</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>in motion</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--line-2)', paddingLeft: 16 }}>
            <div className="serif num" style={{ fontSize: 22, lineHeight: 1 }}>{onTimeRate}%</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>on time</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--line-2)', paddingLeft: 16 }}>
            <div className="serif num" style={{ fontSize: 22, lineHeight: 1 }}>{disruptions.filter(d => d.severity > 0).length}</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>disruptions</div>
          </div>
        </div>

        <div className="hairline" style={{ marginBottom: 16 }} />

        {disruptions.map(d => (
          <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)', display: 'flex', gap: 12 }}>
            <WeatherGlyph type={d.type} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <div className="serif" style={{ fontSize: 15, lineHeight: 1.25 }}>{d.label}</div>
                <div className="mono" style={{
                  fontSize: 10.5, whiteSpace: 'nowrap', flexShrink: 0,
                  color: d.severity > 0.5 ? 'var(--accent)' : d.severity > 0 ? 'var(--warn)' : 'var(--ok)',
                }}>
                  {d.impact}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>{d.message}</div>
            </div>
          </div>
        ))}
      </div>{/* /pulse-side-panel */}

      </div>{/* /pulse-map-layout */}

      <div style={{ height: 80 }} />
    </div>
  );
}

function NetStat({ big, label, borderLeft }: { big: string; label: string; borderLeft?: boolean }) {
  return (
    <div style={{ padding: '10px 14px', borderLeft: borderLeft ? '1px solid var(--line-2)' : 'none' }}>
      <div className="serif num" style={{ fontSize: 26, lineHeight: 1, letterSpacing: '-0.02em' }}>{big}</div>
      <div className="eyebrow" style={{ marginTop: 3 }}>{label}</div>
    </div>
  );
}

function WeatherGlyph({ type }: { type: 'storm' | 'fog' | 'sun' }) {
  const labels: Record<string, string> = {
    storm: 'Onweerswaarschuwing',
    fog:   'Mist',
    sun:   'Helder, geen verstoringen',
  };
  const common = { width: 28, height: 28, role: 'img' as const, 'aria-label': labels[type], style: { flexShrink: 0 } };
  if (type === 'storm') return (
    <svg {...common} viewBox="0 0 28 28" fill="none">
      <path d="M7 15a5 5 0 115-8 6 6 0 0110 3 4 4 0 01-2 7H8a5 5 0 01-1-2z" stroke="var(--accent)" strokeWidth="1.3" />
      <path d="M13 17l-2 4h3l-2 4" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === 'fog') return (
    <svg {...common} viewBox="0 0 28 28" fill="none">
      <path d="M5 11h18M4 15h20M6 19h16M7 23h14" stroke="var(--warn)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg {...common} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="5" stroke="var(--ok)" strokeWidth="1.3" />
      <path d="M14 4v3M14 21v3M4 14h3M21 14h3M6.5 6.5l2 2M19.5 19.5l2 2M6.5 21.5l2-2M19.5 8.5l2-2" stroke="var(--ok)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
