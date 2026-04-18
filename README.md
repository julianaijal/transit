# Transit

Real-time train departure app for Dutch train stations, built with Next.js 15 and the NS (Nederlandse Spoorwegen) API.

## What it does

Two views:

1. **Home** — search for a station by name, get a list of matching stations
2. **Departures** (`/departures/[code]`) — show real-time departures for a selected station: time, direction, platform, train type

## Data

Stations have: `id`, `name`, `code` (e.g. `ASD` for Amsterdam Centraal)

Departures have: `direction`, `plannedDateTime`, `actualDateTime`, `trainCategory`, `plannedTrack`, `actualTrack`, `cancelled`

## Stack

- Next.js 15 (App Router, TypeScript)
- SCSS Modules
- NS API (`gateway.apiportal.ns.nl`)
- Vercel

## Routes

- `/` — station search
- `/departures/[id]` — departure board for station code
- `/api/stations?q=` — internal API route for station search

## Design intent

Clean, minimal, mobile-first. Inspired by departure boards. Fast and functional — no unnecessary chrome.
