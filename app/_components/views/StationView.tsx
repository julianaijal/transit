'use client';

import React, { useState, useEffect } from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { generateDepartures, STATIONS } from '../../_utils/mock';
import { IconBack, IconSearch, IconClose } from '../icons/Icons';
import FullDepartureRow from '../shared/FullDepartureRow';

interface StationObj {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface StationViewProps {
  station: StationObj | null;
  tweaks: ITweaks;
  onBack: () => void;
  onOpenJourney: (train: IDeparture) => void;
}

export function StationSearch({ onBack, onPick }: { onBack: () => void; onPick: (s: StationObj) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StationObj[]>(STATIONS.slice(0, 8));

  useEffect(() => {
    if (q.length < 1) {
      // Show all from local mock
      setResults(STATIONS.slice(0, 8));
      return;
    }
    // First search local mock instantly
    const lo = q.toLowerCase();
    const local = STATIONS.filter(s => s.name.toLowerCase().includes(lo) || s.code.toLowerCase().includes(lo)).slice(0, 10);
    setResults(local);

    // Then try live API
    let cancelled = false;
    if (q.length >= 2) {
      fetch(`/api/stations?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { if (!cancelled && Array.isArray(data) && data.length > 0) setResults(data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className="view fade-up">
      <div style={{ padding: '18px 20px 6px' }}>
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
      </div>
      <div style={{ padding: '10px 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Find a station</div>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
          Where are you <em>going?</em>
        </div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 14, border: '1px solid var(--line)',
        }}>
          <IconSearch aria-hidden="true" style={{ width: 18, height: 18, color: 'var(--ink-3)' }} />
          <label htmlFor="station-search" className="sr-only">Search stations</label>
          <input
            id="station-search"
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Amsterdam, Utrecht, ASD…"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontSize: 16, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" style={{ color: 'var(--ink-3)' }}>
              <IconClose aria-hidden="true" style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        {results.map(s => (
          <button key={s.code} onClick={() => onPick(s)} style={{
            width: '100%', padding: '14px 0', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid var(--line-2)', textAlign: 'left',
          }}>
            <div className="serif" style={{ fontSize: 18 }}>{s.name}</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.code}</span>
          </button>
        ))}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

export default function StationView({ station, tweaks, onBack, onOpenJourney }: StationViewProps) {
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    if (!station) return;
    setDepartures(null);
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch(`/api/departures/${station.code}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            hasData = true;
            setDepartures(data);
            return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      if (active && !hasData) setDepartures(generateDepartures(station.code, new Date()));
    };

    fetchData();
    const timer = setInterval(fetchData, 60_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      abortCtrl?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [station?.code]);

  if (!station) return null;

  const now = new Date();

  return (
    <div className="view fade-up">
      <div style={{ padding: '18px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '6px 0', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconBack aria-hidden="true" style={{ width: 18, height: 18 }} />
          <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Back</span>
        </button>
        <span className="now-pill">
          <span className="dot live" /> {now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div style={{ padding: '10px 20px 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Station · {station.code}</div>
        <h1 className="serif" style={{ fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {station.name}
        </h1>
        <div className="serif" style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 8, fontStyle: 'italic' }}>
          {departures ? `${departures.length} departures in the next hour.` : 'loading live board…'}
        </div>
      </div>

      {/* Departures live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      <div style={{ padding: '0 20px' }}>
        {departures ? departures.map(d => (
          <FullDepartureRow
            key={d.id}
            d={d}
            onOpen={() => onOpenJourney(d)}
            verbose={tweaks.verbosity === 'rich'}
            crowdingStyle={tweaks.crowdingStyle}
          />
        )) : (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ padding: '18px 0', borderBottom: '1px solid var(--line-2)' }}>
              <div className="skeleton" style={{ height: 22, width: 70, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 18, width: '60%' }} />
            </div>
          ))
        )}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
