export interface IStation {
  id: string;
  name: string;
  code: string;
  lat?: number;
  lng?: number;
}

export interface IDeparture {
  id: string;
  direction: string;
  destinationCode?: string;
  plannedDateTime: string;       // ISO
  actualDateTime: string;        // ISO
  delayMinutes: number;          // derived
  trainCategory: string;
  plannedTrack?: string;
  actualTrack?: string;
  trackChanged: boolean;         // derived: plannedTrack !== actualTrack
  cancelled: boolean;
  crowding?: number[];           // per-carriage, 0..1
  quietCarriage?: number | null;
  firstClassCars?: number[];
  trainId?: number | string;
}

export interface IDepartures {
  departures: IDeparture[];
}

export interface IActiveTrain {
  id: string;
  from: { code: string; name: string; lat: number; lng: number };
  to: { code: string; name: string; lat: number; lng: number };
  t: number;
  speed: number;
  cat: string;
  delayMin: number;
  direction: string;
}

export interface IDisruption {
  id: string;
  type: 'storm' | 'fog' | 'sun';
  label: string;
  center: { x: number; y: number };
  radius: number;
  severity: number;
  lines: string[];
  impact: string;
  message: string;
}

export interface ITweaks {
  theme: 'light' | 'dark';
  verbosity: 'minimal' | 'rich';
  crowdingStyle: 'bars' | 'dots' | 'heatmap';
  accent: 'orange' | 'cobalt' | 'sage' | 'plum';
}
