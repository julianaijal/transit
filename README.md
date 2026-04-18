# Pulse

A transit companion for daily commuters on the Dutch rail network. Live at **[transit-blush.vercel.app](https://transit-blush.vercel.app)**

---

## Features

- **Rhythm** — personal commute dashboard with next train, delay anomalies, and 12-week baseline stats
- **Pulse** — live animated network map with disruptions rendered as weather overlays
- **Journey** — per-train platform choreography, carriage crowding, and stop timeline
- **Station** — live departure board for any station, with search

Responsive — sidebar nav on desktop, bottom tabs on mobile.

---

## Stack

Next.js 16 · TypeScript · NS API · CSS custom properties (OKLCH) · Vercel

---

## Getting started

```bash
npm install
npm run dev
```

Add your NS API key (get one at [apiportal.ns.nl](https://apiportal.ns.nl)):

```bash
# .env.local
NS_API=your_key_here
```

Without a key the app runs on mock data — all views work.

---

## API routes

| Route | Description |
|-------|-------------|
| `GET /api/stations?q=` | Station search |
| `GET /api/departures/[code]` | Live departures for a station |
| `GET /api/disruptions` | Live disruptions, mock fallback |
