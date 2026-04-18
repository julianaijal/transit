# Pulse

An editorial transit companion for daily commuters on the Dutch rail network (NS). Goes beyond a departure board — surfaces live network state, personal commute rhythm, and per-carriage crowding guidance.

Live at **[transit-blush.vercel.app](https://transit-blush.vercel.app)**

---

## Views

| Tab | Purpose |
|-----|---------|
| **Rhythm** | Your personal commute. Next train hero card, delay anomalies vs. your 12-week baseline, later-today departures. |
| **Pulse** | Live network map. Animated trains, disruptions rendered as weather systems (storm / fog / sun). |
| **Journey** | Per-train detail. Platform choreography (which carriage is quietest), stop timeline, delay explanation. |
| **Search** | Find any station. Tap to open its full departure board. |

---

## Stack

- **Next.js 16** — App Router, TypeScript, server + client components
- **NS API** (`gateway.apiportal.ns.nl`) — live departures and disruptions
- **CSS custom properties** — OKLCH design tokens, light + dark theme
- **Google Fonts** — Instrument Serif, JetBrains Mono, Inter
- **Vercel** — deployment

---

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/stations?q=` | Station search (proxies NS API) |
| `GET /api/departures/[code]` | Live departures for a station code |
| `GET /api/disruptions` | Live disruptions; falls back to mock |

---

## Environment

Copy `.env.local.example` to `.env.local` and add your NS API key:

```
NS_API=your_ns_api_key
```

Get a key at [apiportal.ns.nl](https://apiportal.ns.nl). Without a key the app falls back to mock data.

---

## Development

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production build check
```

---

## Design system

Tokens live in `app/globals.css`. OKLCH color palette, two themes:

```
--bg / --bg-2 / --bg-3   backgrounds
--ink / --ink-2 / --ink-3  text hierarchy
--accent                   burnt orange — live / now
--ok / --warn / --bad      status colors
```

Crowding display is user-configurable (bars / dots / heatmap) via the tweaks panel (⊞ button above the tab bar).
