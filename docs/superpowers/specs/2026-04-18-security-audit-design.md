# Security Audit & Hardening — Design Spec

**Date:** 2026-04-18
**Scope:** Pulse transit app (Next.js 16 App Router, Vercel)
**Approach:** Option B — Targeted fixes + in-process rate limiting

---

## Threat Model

The only real asset to protect is the NS API key. It lives server-side (no `NEXT_PUBLIC_` prefix, not in client bundles). The realistic attack vectors are:

1. Quota exhaustion — someone discovers the `/api/*` routes and hammers them, burning NS API quota.
2. URL parameter injection — unsanitised user input forwarded into upstream API query strings.
3. Clickjacking / MIME sniffing / XSS via missing HTTP security headers.
4. Dead attack surface — legacy `/departures/[id]` page with no input validation, error handling, or value.

---

## Findings

| Severity | Finding | Location |
|----------|---------|---------|
| High | No HTTP security headers (CSP, X-Frame-Options, HSTS, etc.) | `next.config.ts` |
| High | `fetchDepartureData` passes raw user `id` param to NS API without `encodeURIComponent` | `app/_utils/api.tsx:24` |
| High | Dead `/departures/[id]` page — direct NS API call, no validation, no error handling | `app/departures/[id]/page.tsx` |
| Medium | No station code format validation on `[code]` route param | `app/api/departures/[code]/route.ts` |
| Medium | No rate limiting on any API route | all 3 route handlers |
| Medium | `getStationCodes` and `fetchDepartureData` have no error handling | `app/_utils/api.tsx` |
| Low | `next.config.ts` empty — no `poweredByHeader: false` | `next.config.ts` |
| Info | `.env` correctly gitignored, `NS_API` has no `NEXT_PUBLIC_` prefix | — |

---

## Fixes

### 1. Security Headers (`next.config.ts`)

Add a `headers()` async function returning a single catch-all rule (`source: '/(.*)'`) with:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`: allow `self`, `fonts.googleapis.com`, `fonts.gstatic.com`, Vercel Analytics (`va.vercel-scripts.com`). Block everything else.
- `poweredByHeader: false` to suppress the `X-Powered-By: Next.js` response header.

### 2. Input Validation (`app/api/departures/[code]/route.ts`)

Add a guard at the top of the `GET` handler:

```
const CODE_RE = /^[A-Z0-9]{2,7}$/;
if (!CODE_RE.test(code.toUpperCase())) {
  return NextResponse.json({ error: 'Invalid station code' }, { status: 400 });
}
```

Station codes in the NS system are 2–7 uppercase alphanumeric characters.

### 3. In-Process Rate Limiting (shared utility + all 3 routes)

Create `app/_lib/rateLimit.ts`:

- Uses `lru-cache` (already in the dependency tree via Next.js) with a sliding-window counter keyed by IP address (`x-forwarded-for` header, first segment only).
- Limit: **30 requests per 60-second window** per IP.
- Returns `{ allowed: boolean }`.
- Applied at the top of all three route handlers; returns `429 Too Many Requests` when exceeded.

### 4. Error Handling in `app/_utils/api.tsx`

Wrap `getStationCodes` in try/catch; return `[]` on failure. Remove `fetchDepartureData` entirely (dead after step 5).

### 5. Delete Dead Code

- Delete `app/departures/[id]/page.tsx` and its directory.
- Remove `fetchDepartureData` export from `app/_utils/api.tsx`.
- Remove the `app/styles/Departures.module.scss` file (only used by the dead page).

---

## Files Changed

| File | Action |
|------|--------|
| `next.config.ts` | Add security headers + `poweredByHeader: false` |
| `app/api/departures/[code]/route.ts` | Add station code validation + rate limiting |
| `app/api/disruptions/route.ts` | Add rate limiting |
| `app/api/stations/route.ts` | Add rate limiting |
| `app/_lib/rateLimit.ts` | Create — shared rate-limit utility |
| `app/_utils/api.tsx` | Remove `fetchDepartureData`, add try/catch to `getStationCodes` |
| `app/departures/[id]/page.tsx` | Delete |
| `app/styles/Departures.module.scss` | Delete |

---

## Out of Scope

- Authentication / HMAC signing of API routes (Option C — over-engineered for a single-user PWA).
- Dependency auditing (`npm audit`) — no known CVEs in current deps at time of writing.
- Persistent rate limiting across serverless instances (would require Redis/KV; not warranted here).
