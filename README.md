# Pulse

A transit companion for daily commuters on the Dutch rail network. Goes beyond departure times — surfaces network state, personal commute patterns, and per-carriage crowding.

Live at **[transit-blush.vercel.app](https://transit-blush.vercel.app)**

---

## Views

**Rhythm** — your personal commute. Next train hero card, delay anomaly alerts vs. your 12-week baseline, upcoming departures.

**Pulse** — live network map. Trains animate in real time, disruptions render as weather overlays (storm / fog / sun). Tap a train or station for detail.

**Journey** — per-train breakdown. Platform choreography (which carriage is quietest, where to stand), stop timeline with live delay updates.

**Station** — departure board for any station. Search by name or code, tap any departure to open its journey.

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Rail data API** — live departures, stations, disruptions
- **CSS custom properties** — OKLCH token system, light + dark theme
- **Google Fonts** — Instrument Serif, JetBrains Mono, Inter
- **Vercel**

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
```

### Environment

Set up your `.env.local` with the required API credentials. Without them the app falls back to mock data — all views still work.

---

## Project structure

```
/app
  /_components        # UI — TabBar, TweaksPanel, shared departure rows
    /views            # Full-screen views: Rhythm, Pulse, Journey, Station
    /icons            # SVG icon components
    /shared           # Reusable display components (DepartureRow, NowPill, etc.)
  /_lib               # Analytics and WebVitals wrappers
  /_utils             # Rail API client (getStationCodes), mock data generators
  /api                # Next.js route handlers
    /departures/[code]  # Live departures for a station
    /disruptions        # Live disruptions, falls back to mock
    /stations           # Station search
  /interfaces         # Shared TypeScript interfaces
  /styles             # SCSS modules
/config               # App-level config (analytics ID)
/public               # Static assets, PWA manifest
```

---

## Design

Tokens in `app/globals.css`. Key variables:

```
--bg / --bg-2 / --bg-3    background layers
--ink / --ink-2 / --ink-3  text hierarchy
--accent                   burnt orange — live indicators
--ok / --warn / --bad      on time / delayed / cancelled
```

Theme, verbosity, crowding style (bars / dots / heatmap), and accent colour are all adjustable at runtime via the Tweaks panel. Preferences persist to `localStorage`.

---

## Layout

- **Mobile** — bottom tab bar, full width
- **Tablet (441–767px)** — phone frame centered on page
- **Desktop (≥768px)** — 220px left sidebar, main content area up to 860px wide
