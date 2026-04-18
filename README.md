# Pulse — Transit Companion

An editorial transit companion for data-curious daily commuters on the Dutch rail network (NS). Built as a single-page app with four distinct views, a live network map, per-carriage crowding guidance, and a personal commute rhythm tracker.

Live at **[transit-blush.vercel.app](https://transit-blush.vercel.app)**

---

## What it is

Most departure apps answer one question: *when is my train?* Pulse answers the questions that come after:

- Is today unusual compared to my usual commute?
- Which carriage should I stand in?
- What's causing the delay, and will it get worse?
- What's happening across the whole network right now?

It's designed for the person who takes the same train every morning and wants more signal, not less.

---

## Views

### Rhythm (home)

Your personal commute dashboard. The first thing you see when you open the app.

- **Hero train card** — large Instrument Serif time display with delay indicator, destination, and a "departs in N min" countdown. Dark background so it reads at a glance.
- **Anomaly block** — appears when your usual train is running ≥2 min late. Surfaces the next viable alternative with a one-tap swap suggestion.
- **Baseline stats** — on-time rate, average ride duration, and average crowding over your 12-week commute history.
- **Later today** — upcoming departures from your home station in a compact departure row format, with optional crowding bars in data-rich mode.

On desktop, the hero card and anomaly sit left; baseline stats and later-today list sit right, using the extra horizontal space as a dashboard.

### Pulse (network map)

Ambient awareness of the whole Dutch rail network.

- **Animated SVG map** — trains move in real time via `requestAnimationFrame`, positioned along their routes using lat/lng projection. Color-coded by delay: on time (ink), minor delay (amber), significant delay (accent orange).
- **Weather overlays** — disruptions are rendered as radial gradient "weather systems": storm (orange, for signal failures), fog (amber, for reduced capacity), sun (sage, for all-clear regions). Active disruptions pulse with an animated ring.
- **Simplified NL outline** — country shape rendered in the same SVG coordinate space as the stations and routes.
- **Station tap** — tap any station circle to open its departure board.
- **Train tap** — tap any train to get a floating detail card with route, delay status, and a "View journey" CTA.
- **Disruption list** — on mobile, scrolls below the map. On desktop, sits in a 280px right panel alongside the map with compact stats at the top.

### Journey

Everything about one specific train, once you've tapped it from Rhythm or the map.

- **Platform choreography** — prescriptive advice ("Stand at the front of Track 5") based on which carriage has the lowest predicted crowding. Shows the platform diagram with all carriages, the recommended one highlighted, first-class indicators, and quiet carriage labels.
- **Crowding visualisation** — rendered in your chosen style (bars, dots, or heatmap) below the platform diagram.
- **Delay propagation card** — if the train is running late, explains the cause and shows a spark line of the delay trend over the last 30 minutes.
- **Stop timeline** — all stops with planned and actual times, a vertical connector line, and the current stop highlighted in accent orange with a glow ring.

### Station (Search)

Find any station and get its live departure board.

- **Search** — instant local search against the station list, with live NS API results layered in as you type.
- **Departure board** — full-width departure rows with time, delay status, track, chip labels (train category, track changed, cancelled), and optional crowding bars in data-rich mode.
- **Loading state** — six skeleton rows while the API responds.

---

## Responsive layout

### Mobile (< 441px)
Full-width single-column layout. Bottom tab bar with backdrop blur. Tweaks accessible via a floating action button above the tab bar.

### Tablet (441–767px)
Phone-in-browser: app is capped at 440px, centered on a `--bg-3` background, with a 1px border and soft drop shadow to suggest a device frame.

### Desktop (≥ 768px)
Full web app layout:
- **220px left sidebar** — logo, vertical navigation, Tweaks button at the bottom. Sticky at top of viewport.
- **Main content area** — `max-width: 860px`, scrolls independently. Pulse view gets a 280px right panel for disruptions.
- Bottom tab bar is hidden; mobile FAB is hidden.

---

## Design system

All tokens live in `app/globals.css` as CSS custom properties. Two themes (light / dark) toggled via `[data-theme="dark"]` on `<html>`.

### Color tokens (OKLCH)

```css
/* Backgrounds */
--bg:         oklch(0.975 0.012 85)   /* warm off-white */
--bg-2:       oklch(0.955 0.015 82)   /* card background */
--bg-3:       oklch(0.935 0.02 80)    /* recessed / skeleton */

/* Text hierarchy */
--ink:        oklch(0.18 0.01 60)     /* primary */
--ink-2:      oklch(0.40 0.01 60)     /* secondary */
--ink-3:      oklch(0.60 0.01 60)     /* tertiary / captions */

/* Borders */
--line:       oklch(0.85 0.015 75)    /* card borders */
--line-2:     oklch(0.90 0.015 75)    /* row dividers */

/* Status */
--accent:     oklch(0.60 0.17 45)     /* burnt orange — live / now */
--accent-dim: oklch(0.60 0.17 45 / 0.15)
--ok:         oklch(0.58 0.09 150)    /* sage — on time */
--warn:       oklch(0.68 0.15 80)     /* amber — minor delay */
--bad:        oklch(0.55 0.18 25)     /* deep red — cancelled */
```

Dark theme overrides the same tokens with higher-lightness values on a cool blue-grey base.

### Typography

Three typefaces, each with a specific job:

| Family | Weight | Use |
|--------|--------|-----|
| **Instrument Serif** | 400 (regular + italic) | Display: times, destination names, headlines, all large editorial moments |
| **JetBrains Mono** | 400 / 500 / 600 | Data: station codes, delay chips, eyebrow labels, all tabular numbers |
| **Inter** | 400 / 500 / 600 / 700 | Body: buttons, descriptions, anything non-data |

Global utility classes: `.serif`, `.mono`, `.sans`, `.eyebrow`, `.num`.

### Spacing & radius

- Standard content padding: `20px` horizontal
- Section header padding: `28px 20px 10px`
- Card radius: `--radius: 14px`
- Panel radius: `--radius-lg: 22px`
- Safe area: tab bar and tweaks FAB respect `env(safe-area-inset-bottom)`

### Tweaks panel

User-configurable at runtime without any account:

| Control | Options |
|---------|---------|
| Theme | Light / Dark |
| Verbosity | Minimal / Data-rich |
| Crowding display | Bars / Dots / Heatmap |
| Accent colour | Orange / Cobalt / Sage / Plum |

Preferences are persisted to `localStorage` under `pulse.*` keys and applied immediately to `document.documentElement`.

---

## Data model

```ts
interface IDeparture {
  id: string;
  direction: string;
  destinationCode?: string;
  plannedDateTime: string;       // ISO 8601
  actualDateTime: string;        // ISO 8601
  delayMinutes: number;          // derived
  trainCategory: string;         // IC | ICD | SPR | EC | THA | …
  plannedTrack?: string;
  actualTrack?: string;
  trackChanged: boolean;
  cancelled: boolean;
  crowding?: number[];           // per-carriage, 0–1
  quietCarriage?: number | null;
  firstClassCars?: number[];
  trainId?: number | string;
}
```

### Data sources

| Data | Source | Notes |
|------|--------|-------|
| Departures | NS API — live | `/api/departures/[code]` proxies the NS reisinformatie endpoint |
| Station search | NS API — live | `/api/stations?q=` |
| Disruptions | NS API — live with mock fallback | `/api/disruptions` tries NS, falls back if unavailable |
| Crowding | Mock | Vehicle composition API requires a separate NS subscription tier |
| Map trains | Mock + animation | 40 trains generated client-side, animated via `requestAnimationFrame` |
| Commute baseline | Mock | `USER_RHYTHM` in `app/_utils/mock.ts` — hardcoded ASD→UT baseline |

---

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/stations?q=` | GET | Proxies NS station search. Returns `IStation[]`. Requires ≥2 chars. |
| `/api/departures/[code]` | GET | Fetches live departures for a station code. Maps NS payload to `IDeparture[]`. Falls back to empty array on error. |
| `/api/disruptions` | GET | Fetches active NS disruptions. Returns mock data if NS API is unavailable. |

All NS API calls use the `Ocp-Apim-Subscription-Key` header with the `NS_API` environment variable.

---

## File structure

```
app/
  page.tsx                         SPA root — tab state, tweaks, sidebar
  layout.tsx                       Root layout — fonts, #app-root, metadata
  globals.css                      Design tokens, global styles, layout classes

  interfaces/
    interfaces.tsx                 IDeparture, IStation, IActiveTrain, IDisruption, ITweaks

  _utils/
    api.tsx                        NS API helpers (getStationCodes, fetchDepartureData)
    mock.ts                        generateDepartures, generateActiveTrains,
                                   generateDisruptions, USER_RHYTHM, STATIONS, project()

  _components/
    TabBar.tsx                     Bottom tab bar (mobile)
    TweaksPanel.tsx                Tweaks panel + Segmented control
    icons/
      Icons.tsx                    11 inline SVG icons
    shared/
      CrowdingStrip.tsx            Bars / dots / heatmap crowding display
      NowPill.tsx                  Live time pill with pulsing dot
      DepartureRow.tsx             Compact row (used in Rhythm)
      FullDepartureRow.tsx         Full row (used in Station)
    views/
      RhythmView.tsx               Home / personal commute view
      PulseView.tsx                Network map view
      JourneyView.tsx              Per-train detail view
      StationView.tsx              Station departure board + StationSearch

  api/
    stations/route.ts              GET /api/stations
    departures/[code]/route.ts     GET /api/departures/[code]
    disruptions/route.ts           GET /api/disruptions

  _lib/
    Analytics.tsx                  Vercel Analytics wrapper
    WebVitals.tsx                  Web Vitals reporting
```

---

## Environment

```bash
cp .env.local.example .env.local
```

```env
NS_API=your_ns_api_key
```

Get a key at [apiportal.ns.nl](https://apiportal.ns.nl). Subscribe to the **Reisinformatie API** product. Without a key the app runs entirely on mock data — all views work, but departures and disruptions are generated client-side.

---

## Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build + type check
npm run lint      # ESLint
```

The build runs TypeScript strict checking. `npm run build` must pass clean before merging.

---

## Deployment

Deployed to Vercel. Every push to `master` triggers a production deployment. The `NS_API` key is set as an environment variable in the Vercel project settings.

```bash
git push origin master   # triggers deploy
```

---

## Commit conventions

Atomic commits, one logical change each:

```
feat:   new user-visible functionality
fix:    bug fix
chore:  tooling, deps, config
docs:   documentation only
```
