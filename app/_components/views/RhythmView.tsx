'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IDeparture, ITweaks } from '../../interfaces/interfaces';
import { generateDepartures, USER_RHYTHM } from '../../_utils/mock';
import { IconArrow } from '../icons/Icons';
import CrowdingStrip from '../shared/CrowdingStrip';
import DepartureRow from '../shared/DepartureRow';

interface RhythmViewProps {
  tweaks: ITweaks;
  onOpenJourney: (train: IDeparture) => void;
  onOpenStation: (station: { code: string; name: string }) => void;
}

export default function RhythmView({ tweaks, onOpenJourney }: RhythmViewProps) {
  const rhythm = USER_RHYTHM;
  const [now, setNow] = useState(new Date());
  const [departures, setDepartures] = useState<IDeparture[] | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    let abortCtrl: AbortController | null = null;
    let hasData = false;

    const fetchData = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      abortCtrl?.abort();
      const ctrl = new AbortController();
      abortCtrl = ctrl;
      try {
        const res = await fetch('/api/departures/ASD', { signal: ctrl.signal });
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
      if (active && !hasData) setDepartures(generateDepartures('ASD', new Date()));
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
  }, []);

  const yourTrain = useMemo(() => {
    if (!departures) return null;
    return departures.find(d => d.direction === 'Utrecht Centraal' && d.trainCategory === 'IC')
      ?? departures.find(d => d.direction === 'Utrecht Centraal')
      ?? departures[0];
  }, [departures]);

  const alternatives = useMemo(() => {
    if (!departures) return [];
    return departures.filter(d =>
      d.direction === 'Utrecht Centraal' || d.direction === 'Rotterdam Centraal' ||
      d.destinationCode === 'UT' || d.destinationCode === 'RTD'
    ).slice(0, 3);
  }, [departures]);

  const timeLabel = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';

  return (
    <div className="view fade-up">
      {/* Masthead — full width */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{dateLabel}</div>
          <h1 className="serif" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {greeting}
          </h1>
          <div className="serif" style={{ fontSize: 18, color: 'var(--ink-2)', marginTop: 2, fontStyle: 'italic' }}>
            You have a train to catch.
          </div>
        </div>
        <span className="now-pill"><span className="dot live" /> {timeLabel}</span>
      </div>

      {/* Departures live region — announces count to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {departures ? `${departures.length} departures loaded` : ''}
      </div>

      {/* ── Desktop 2-column grid ─────────────────── */}
      <div className="rhythm-grid">

        {/* Left column: hero + anomaly */}
        <div className="rhythm-col-l">
          <div style={{ padding: '8px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 className="eyebrow">Your commute</h2>
              <div className="eyebrow" style={{ color: 'var(--ink-2)' }}>{rhythm.usualDuration} MIN · {rhythm.historyWeeks} WKS</div>
            </div>
            {yourTrain ? (
              <YourTrainCard train={yourTrain} rhythm={rhythm} now={now} onClick={() => onOpenJourney(yourTrain)} tweaks={tweaks} />
            ) : (
              <div className="card" style={{ padding: 20, height: 180 }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 20, width: '40%' }} />
              </div>
            )}
          </div>

          {yourTrain && yourTrain.delayMinutes >= 2 && (
            <AnomalyBlock train={yourTrain} alternatives={alternatives.slice(1)} />
          )}
        </div>

        {/* Right column: baseline + later today */}
        <div className="rhythm-col-r">
          <BaselineBlock rhythm={rhythm} />
          <LaterToday departures={departures} onOpen={onOpenJourney} tweaks={tweaks} />
        </div>

      </div>{/* /rhythm-grid */}

      <div style={{ height: 80 }} />
    </div>
  );
}

function quietestCar(crowding: number[]): number {
  let min = 1, idx = 0;
  crowding.forEach((c, i) => { if (c < min) { min = c; idx = i; } });
  return idx;
}

interface YourTrainCardProps {
  train: IDeparture;
  rhythm: typeof USER_RHYTHM;
  now: Date;
  onClick: () => void;
  tweaks: ITweaks;
}

function YourTrainCard({ train, rhythm, now, onClick, tweaks }: YourTrainCardProps) {
  const planned = new Date(train.plannedDateTime);
  const actual = new Date(train.actualDateTime);
  const minsTo = Math.max(0, Math.round((actual.getTime() - now.getTime()) / 60000));
  const late = train.delayMinutes;
  const timeStr = actual.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const plannedStr = planned.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const crowding = train.crowding ?? [];

  return (
    <button onClick={onClick} aria-label={`Jouw trein naar ${train.direction}, vertrekt ${timeStr}${late > 0 ? `, ${late} minuten vertraging` : ', op tijd'}. Klik voor reisdetails.`} style={{
      width: '100%', textAlign: 'left', padding: 0,
      background: 'var(--ink)', color: 'var(--bg)',
      borderRadius: 18, overflow: 'hidden',
      border: '1px solid var(--ink)',
      display: 'block',
    }}>
      {/* Top strip */}
      <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="dot live" style={{ background: 'var(--accent)' }} />
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'color-mix(in oklab, var(--bg), transparent 40%)' }}>
            Next · Track {train.actualTrack}
          </span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'color-mix(in oklab, var(--bg), transparent 50%)' }}>
          {rhythm.usualDeparture.trainLabel}
        </span>
      </div>

      {/* Big time */}
      <div style={{ padding: '0 18px 6px', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div className="serif num" style={{ fontSize: 86, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
          {timeStr}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            aria-live="polite"
            aria-atomic="true"
            aria-label={late > 0 ? `${late} minuten vertraging` : 'op tijd'}
            className="mono num"
            style={{
              fontSize: 13, fontWeight: 600,
              color: late > 0 ? 'var(--accent)' : 'color-mix(in oklab, var(--bg), transparent 30%)',
            }}
          >
            {late > 0 ? `+${late}` : 'on time'}
          </div>
          {late > 0 && (
            <div className="mono" style={{ fontSize: 11, color: 'color-mix(in oklab, var(--bg), transparent 50%)', textDecoration: 'line-through' }}>
              {plannedStr}
            </div>
          )}
        </div>
      </div>

      {/* Destination */}
      <div style={{ padding: '0 18px 16px' }}>
        <div className="serif" style={{ fontSize: 22, lineHeight: 1.15 }}>
          to <em style={{ fontStyle: 'italic' }}>{train.direction}</em>
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: 'color-mix(in oklab, var(--bg), transparent 40%)', marginTop: 4 }}>
          departs in {minsTo} min · arrives {new Date(actual.getTime() + rhythm.usualDuration * 60000).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Crowding strip */}
      {crowding.length > 0 && (
        <div style={{ padding: '14px 18px 16px', borderTop: '1px solid color-mix(in oklab, var(--bg), transparent 85%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'color-mix(in oklab, var(--bg), transparent 40%)' }}>
              Carriages · quietest car {quietestCar(crowding) + 1}
            </span>
          </div>
          <CrowdingStrip crowding={crowding} style={tweaks.crowdingStyle} invert />
        </div>
      )}
    </button>
  );
}

function AnomalyBlock({ train, alternatives }: { train: IDeparture; alternatives: IDeparture[] }) {
  const best = alternatives[0];
  return (
    <div style={{ padding: '16px 20px 4px' }}>
      <div className="eyebrow" style={{ marginBottom: 10, color: 'var(--accent)' }}>
        <span aria-hidden="true">⁕ </span>Anomaly vs. your baseline
      </div>
      <div
        role="alert"
        className="card"
        style={{ padding: 16, borderColor: 'var(--accent-dim)', background: 'color-mix(in oklab, var(--accent) 5%, var(--bg-2))' }}
      >
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.3 }}>
          Your 8:14 runs <em>{train.delayMinutes} min late</em>{best ? ', and the next one is slightly emptier.' : '.'}
        </div>
        {best && (
          <button aria-label={`Wissel naar de ${new Date(best.actualDateTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} ${best.trainCategory} in plaats van jouw vertraagde trein`} style={{
            marginTop: 12, width: '100%', padding: '10px 14px',
            background: 'var(--ink)', color: 'var(--bg)', borderRadius: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 13, fontWeight: 500,
          }}>
            <span>Swap to the {new Date(best.actualDateTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} {best.trainCategory}</span>
            <IconArrow aria-hidden="true" style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
}

function BaselineBlock({ rhythm }: { rhythm: typeof USER_RHYTHM }) {
  return (
    <div style={{ padding: '16px 20px 4px' }}>
      <h2 className="eyebrow" style={{ marginBottom: 10 }}>Your baseline · last 12 weeks</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCell big={(rhythm.onTimeRate * 100).toFixed(0)} suffix="%" label="on-time" />
        <StatCell big={String(rhythm.usualDuration)} suffix="m" label="avg. ride" />
        <StatCell big={(rhythm.avgCrowding * 100).toFixed(0)} suffix="%" label="avg. crowd" />
      </div>
    </div>
  );
}

function StatCell({ big, suffix, label }: { big: string; suffix: string; label: string }) {
  return (
    <dl className="card" style={{ padding: '12px 14px' }}>
      <dt className="eyebrow" style={{ marginBottom: 4 }}>{label}</dt>
      <dd style={{ display: 'flex', alignItems: 'baseline', gap: 2, margin: 0 }}>
        <span className="serif num" style={{ fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>{big}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{suffix}</span>
      </dd>
    </dl>
  );
}

function LaterToday({ departures, onOpen, tweaks }: { departures: IDeparture[] | null; onOpen: (d: IDeparture) => void; tweaks: ITweaks }) {
  if (!departures) return null;
  const list = departures.slice(0, tweaks.verbosity === 'minimal' ? 3 : 6);
  return (
    <div style={{ padding: '20px 0 4px' }}>
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 className="eyebrow">Later today · from ASD</h2>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{departures.length} trains</span>
      </div>
      <div style={{ padding: '0 20px' }}>
        {list.map(d => (
          <DepartureRow key={d.id} d={d} onClick={() => onOpen(d)} verbose={tweaks.verbosity === 'rich'} />
        ))}
      </div>
    </div>
  );
}
