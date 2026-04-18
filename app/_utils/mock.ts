import { IDeparture, IActiveTrain, IDisruption } from '../interfaces/interfaces';

export const STATIONS = [
  { code: 'ASD',  name: 'Amsterdam Centraal',      lat: 52.3791, lng: 4.9003 },
  { code: 'UT',   name: 'Utrecht Centraal',         lat: 52.0894, lng: 5.1100 },
  { code: 'RTD',  name: 'Rotterdam Centraal',       lat: 51.9250, lng: 4.4693 },
  { code: 'GVC',  name: 'Den Haag Centraal',        lat: 52.0807, lng: 4.3249 },
  { code: 'SHL',  name: 'Schiphol Airport',         lat: 52.3095, lng: 4.7617 },
  { code: 'EHV',  name: 'Eindhoven Centraal',       lat: 51.4430, lng: 5.4795 },
  { code: 'LEDN', name: 'Leiden Centraal',          lat: 52.1664, lng: 4.4817 },
  { code: 'HLM',  name: 'Haarlem',                  lat: 52.3878, lng: 4.6383 },
  { code: 'AMF',  name: 'Amersfoort Centraal',      lat: 52.1530, lng: 5.3742 },
  { code: 'ZL',   name: 'Zwolle',                   lat: 52.5044, lng: 6.0917 },
  { code: 'GN',   name: 'Groningen',                lat: 53.2108, lng: 6.5647 },
  { code: 'MT',   name: 'Maastricht',               lat: 50.8499, lng: 5.7055 },
  { code: 'BD',   name: 'Breda',                    lat: 51.5953, lng: 4.7800 },
  { code: 'ASS',  name: 'Amsterdam Sloterdijk',     lat: 52.3886, lng: 4.8376 },
  { code: 'DVN',  name: 'Duivendrecht',             lat: 52.3236, lng: 4.9296 },
  { code: 'ASB',  name: 'Amsterdam Bijlmer ArenA',  lat: 52.3121, lng: 4.9471 },
  { code: 'ASA',  name: 'Amsterdam Amstel',         lat: 52.3465, lng: 4.9180 },
  { code: 'HT',   name: "'s-Hertogenbosch",         lat: 51.6905, lng: 5.2937 },
];

const NL_BOUNDS = { minLat: 50.7, maxLat: 53.5, minLng: 3.3, maxLng: 7.3 };

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = (lng - NL_BOUNDS.minLng) / (NL_BOUNDS.maxLng - NL_BOUNDS.minLng);
  const y = 1 - (lat - NL_BOUNDS.minLat) / (NL_BOUNDS.maxLat - NL_BOUNDS.minLat);
  return { x, y };
}

const DEP_SEED = [
  { dir: 'Utrecht Centraal',    cat: 'IC',  track: '5',   to: 'UT'   },
  { dir: 'Schiphol Airport',    cat: 'SPR', track: '2a',  to: 'SHL'  },
  { dir: 'Rotterdam Centraal',  cat: 'ICD', track: '15b', to: 'RTD'  },
  { dir: 'Den Haag Centraal',   cat: 'IC',  track: '7',   to: 'GVC'  },
  { dir: 'Eindhoven Centraal',  cat: 'IC',  track: '8b',  to: 'EHV'  },
  { dir: 'Groningen',           cat: 'IC',  track: '11a', to: 'GN'   },
  { dir: 'Zwolle',              cat: 'IC',  track: '4',   to: 'ZL'   },
  { dir: 'Haarlem',             cat: 'SPR', track: '13',  to: 'HLM'  },
  { dir: 'Leiden Centraal',     cat: 'SPR', track: '3',   to: 'LEDN' },
  { dir: 'Maastricht',          cat: 'IC',  track: '8a',  to: 'MT'   },
  { dir: 'Breda',               cat: 'IC',  track: '6',   to: 'BD'   },
  { dir: "'s-Hertogenbosch",    cat: 'SPR', track: '9',   to: 'HT'   },
];

function bumpTrack(track: string): string {
  const m = track.match(/(\d+)([a-z]?)/);
  if (!m) return track;
  const n = parseInt(m[1]);
  return (n + (Math.random() < 0.5 ? 1 : -1)) + (Math.random() < 0.5 ? 'a' : '');
}

export function generateDepartures(originCode = 'ASD', baseTime = new Date()): IDeparture[] {
  return DEP_SEED.map((s, i) => {
    const planned = new Date(baseTime.getTime() + (2 + i * 4) * 60000);
    const roll = Math.random();
    let delayMin = 0, cancelled = false;
    if (roll < 0.55) delayMin = 0;
    else if (roll < 0.85) delayMin = 1 + Math.floor(Math.random() * 4);
    else if (roll < 0.97) delayMin = 5 + Math.floor(Math.random() * 8);
    else cancelled = true;

    const trackChanged = Math.random() < 0.08;
    const actualTrack = trackChanged ? bumpTrack(s.track) : s.track;

    const nCars = s.cat === 'SPR' ? 4 : 6;
    const crowding = Array.from({ length: nCars }, () => Math.random());
    crowding.forEach((_, idx) => {
      const mid = Math.abs(idx - nCars / 2) / nCars;
      crowding[idx] = Math.max(0.1, Math.min(0.98, crowding[idx] * 0.6 + (0.7 - mid * 1.1) + (Math.random() - 0.5) * 0.2));
    });

    return {
      id: `${originCode}-${i}`,
      direction: s.dir,
      destinationCode: s.to,
      plannedDateTime: planned.toISOString(),
      actualDateTime: new Date(planned.getTime() + delayMin * 60000).toISOString(),
      delayMinutes: delayMin,
      trainCategory: s.cat,
      plannedTrack: s.track,
      actualTrack,
      trackChanged,
      cancelled,
      crowding,
      quietCarriage: s.cat === 'IC' ? 1 : null,
      firstClassCars: s.cat === 'IC' ? [0, 1] : [],
      trainId: 3000 + Math.floor(Math.random() * 5000),
    };
  });
}

export function generateActiveTrains(n = 38): IActiveTrain[] {
  const routes = [
    ['ASD','UT'], ['ASD','RTD'], ['ASD','SHL'], ['UT','EHV'], ['UT','ZL'],
    ['RTD','GVC'], ['GVC','ASD'], ['AMF','UT'], ['HLM','ASD'], ['LEDN','ASD'],
    ['ZL','GN'], ['UT','AMF'], ['EHV','MT'], ['BD','RTD'], ['HT','EHV'],
    ['ASD','AMF'], ['SHL','RTD'], ['ASD','HT'],
  ];
  return Array.from({ length: n }, (_, i) => {
    const route = routes[i % routes.length];
    const from = STATIONS.find(s => s.code === route[0])!;
    const to = STATIONS.find(s => s.code === route[1])!;
    const t = Math.random();
    const cat = Math.random() < 0.6 ? 'IC' : (Math.random() < 0.5 ? 'SPR' : 'ICD');
    const delayMin = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 7);
    return { id: `t${3000 + i}`, from, to, t, speed: 0.00006 + Math.random() * 0.00008, cat, delayMin, direction: to.name };
  });
}

export function generateDisruptions(): IDisruption[] {
  return [
    {
      id: 'd1', type: 'storm',
      label: 'Signal failure · Duivendrecht',
      center: project(52.323, 4.929), radius: 0.14, severity: 0.8,
      lines: ['ASD → UT', 'ASD → EHV'], impact: '+4-7 min',
      message: 'Signaling disruption between Amsterdam Bijlmer and Duivendrecht. Trains run reduced speed.',
    },
    {
      id: 'd2', type: 'fog',
      label: 'Reduced capacity · Leiden',
      center: project(52.166, 4.481), radius: 0.10, severity: 0.45,
      lines: ['LEDN → ASD'], impact: '+2 min',
      message: 'Switch work near Leiden Centraal. Sprinter frequency reduced until 11:00.',
    },
    {
      id: 'd3', type: 'sun',
      label: 'All clear · South',
      center: project(51.45, 5.48), radius: 0.12, severity: 0,
      lines: [], impact: 'On time',
      message: 'Zuid-Nederland running clean. 0 reported issues.',
    },
  ];
}

export const USER_RHYTHM = {
  homeCode: 'ASD',
  homeName: 'Amsterdam Centraal',
  workCode: 'UT',
  workName: 'Utrecht Centraal',
  usualDeparture: { h: 8, m: 14, trainLabel: 'IC 3523', track: '5', category: 'IC' },
  usualDuration: 27,
  historyWeeks: 12,
  onTimeRate: 0.89,
  avgCrowding: 0.62,
  commonSwaps: [
    { label: 'IC 3521', delta: -7, fasterBy: 0, crowdingDelta: +0.18 },
    { label: 'IC 3525', delta: +7, fasterBy: 0, crowdingDelta: -0.24 },
    { label: 'ICD 923', delta: -4, fasterBy: 3, crowdingDelta: +0.11 },
  ],
};
