# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all High/Medium security findings from the 2026-04-18 audit: HTTP security headers, input validation, rate limiting, and dead code removal.

**Architecture:** All fixes are server-side. A shared `rateLimit` utility guards the three API route handlers. Security headers are injected globally via `next.config.ts`. Dead `/departures/[id]` page and its direct NS API call are removed entirely.

**Tech Stack:** Next.js 16 App Router, TypeScript, `lru-cache` v5 (already in node_modules)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `next.config.ts` | Modify | Add `poweredByHeader: false` + `headers()` with all security headers |
| `app/_lib/rateLimit.ts` | Create | Sliding-window rate limiter, 30 req/60s per IP |
| `app/api/departures/[code]/route.ts` | Modify | Add station code validation + rate limiting |
| `app/api/disruptions/route.ts` | Modify | Add rate limiting |
| `app/api/stations/route.ts` | Modify | Add rate limiting |
| `app/_utils/api.tsx` | Modify | Remove `fetchDepartureData`, add try/catch to `getStationCodes` |
| `app/departures/[id]/page.tsx` | Delete | Dead code |
| `app/styles/Departures.module.scss` | Delete | Only used by deleted page |

---

## Task 1: Delete dead code

**Files:**
- Delete: `app/departures/[id]/page.tsx`
- Delete: `app/styles/Departures.module.scss`
- Modify: `app/_utils/api.tsx`

- [ ] **Step 1: Delete the dead page and its directory**

```bash
rm app/departures/[id]/page.tsx
rmdir app/departures/[id]
rmdir app/departures
```

- [ ] **Step 2: Delete the dead stylesheet**

```bash
rm app/styles/Departures.module.scss
```

- [ ] **Step 3: Remove `fetchDepartureData` and add error handling to `getStationCodes` in `app/_utils/api.tsx`**

Replace the entire file with:

```typescript
import { IStation } from "../interfaces/interfaces";

const BASE_URL = "https://gateway.apiportal.ns.nl";
const API_KEY = process.env.NS_API ?? "";

export async function getStationCodes(query: string): Promise<IStation[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/stations?q=${encodeURIComponent(query)}`,
      {
        headers: { "Ocp-Apim-Subscription-Key": API_KEY },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.payload ?? []).map((s: { UICCode: string; namen: { lang: string }; code: string }) => ({
      id: s.UICCode,
      name: s.namen.lang,
      code: s.code,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see errors about missing `IDepartures` import elsewhere, they'll resolve — that interface is still in `interfaces.tsx`.

- [ ] **Step 5: Commit**

```bash
git rm app/departures/\[id\]/page.tsx app/styles/Departures.module.scss
git add app/_utils/api.tsx
git commit -m "refactor: remove dead departures page and fetchDepartureData"
```

---

## Task 2: Create rate-limit utility

**Files:**
- Create: `app/_lib/rateLimit.ts`

- [ ] **Step 1: Create the rate-limit utility**

Create `app/_lib/rateLimit.ts`:

```typescript
// lru-cache v5 — default export is the constructor
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LRU = require("lru-cache") as new (opts: { max: number }) => {
  get(key: string): number | undefined;
  set(key: string, value: number): void;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

// Stores { count, windowStart } encoded as a single number:
// high 32 bits = windowStart (unix ms >> 10 fits in 32 bits until year 2514)
// low 32 bits = count
// Simpler: store objects — lru-cache v5 accepts any value.
interface Entry {
  count: number;
  windowStart: number;
}

const cache = new LRU({ max: 5000 });

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = cache.get(ip) as Entry | undefined;

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    cache.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  cache.set(ip, { count: entry.count + 1, windowStart: entry.windowStart });
  return { allowed: true, remaining: MAX_REQUESTS - entry.count - 1 };
}

export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  // Take the first IP in the chain (the original client)
  return (forwarded?.split(",")[0]?.trim()) ?? "unknown";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_lib/rateLimit.ts
git commit -m "feat: add in-process rate-limit utility (30 req/min per IP)"
```

---

## Task 3: Harden the departures API route

**Files:**
- Modify: `app/api/departures/[code]/route.ts`

- [ ] **Step 1: Update the departures route handler**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { IDeparture } from '../../../interfaces/interfaces';
import { rateLimit, getClientIp } from '../../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';
const CODE_RE = /^[A-Z0-9]{2,7}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { code } = await params;
  if (!CODE_RE.test(code.toUpperCase())) {
    return NextResponse.json({ error: 'Invalid station code' }, { status: 400 });
  }
  const safeCode = code.toUpperCase();

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/departures?station=${encodeURIComponent(safeCode)}&maxJourneys=15`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return NextResponse.json([], { status: res.status });
    }

    const data = await res.json();
    const raw = data.payload?.departures ?? [];

    const departures: IDeparture[] = raw.map((d: {
      product: { number: string; categoryCode: string };
      direction: string;
      plannedDateTime: string;
      actualDateTime?: string;
      plannedTrack?: string;
      actualTrack?: string;
      cancelled?: boolean;
      messages?: unknown[];
    }, i: number) => {
      const planned = new Date(d.plannedDateTime);
      const actual = new Date(d.actualDateTime ?? d.plannedDateTime);
      const delayMs = actual.getTime() - planned.getTime();
      const delayMinutes = Math.max(0, Math.round(delayMs / 60000));
      const plannedTrack = d.plannedTrack ?? '';
      const actualTrack = d.actualTrack ?? plannedTrack;

      return {
        id: `${safeCode}-${i}-${d.product.number}`,
        direction: d.direction,
        plannedDateTime: d.plannedDateTime,
        actualDateTime: d.actualDateTime ?? d.plannedDateTime,
        delayMinutes,
        trainCategory: d.product.categoryCode,
        plannedTrack,
        actualTrack,
        trackChanged: plannedTrack !== actualTrack && plannedTrack !== '',
        cancelled: d.cancelled ?? false,
        trainId: d.product.number,
      } satisfies IDeparture;
    });

    return NextResponse.json(departures);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify validation rejects bad input**

Start dev server in one terminal: `npm run dev`

In another terminal:
```bash
# Should return 400
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/departures/../../etc/passwd
# Should return 400
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/departures/TOOLONGCODE123
# Should return 200 or 502 (depends on NS API key validity)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/departures/ASD
```

Expected: first two return `400`, third returns `200` (or `401`/`403` if key is invalid in dev).

- [ ] **Step 4: Commit**

```bash
git add app/api/departures/\[code\]/route.ts
git commit -m "feat: add station code validation and rate limiting to departures route"
```

---

## Task 4: Add rate limiting to disruptions and stations routes

**Files:**
- Modify: `app/api/disruptions/route.ts`
- Modify: `app/api/stations/route.ts`

- [ ] **Step 1: Update disruptions route**

Replace `app/api/disruptions/route.ts` with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateDisruptions } from '../../_utils/mock';
import { rateLimit, getClientIp } from '../../_lib/rateLimit';

const BASE_URL = 'https://gateway.apiportal.ns.nl';
const API_KEY = process.env.NS_API ?? '';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const res = await fetch(
      `${BASE_URL}/reisinformatie-api/api/v2/disruptions?isActive=true`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
        next: { revalidate: 60 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data.payload ?? []);
    }
  } catch { /* fall through to mock */ }

  return NextResponse.json(generateDisruptions());
}
```

- [ ] **Step 2: Update stations route**

Replace `app/api/stations/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStationCodes } from "../../_utils/api";
import { rateLimit, getClientIp } from "../../_lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  const stations = await getStationCodes(q);
  return NextResponse.json(stations);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/disruptions/route.ts app/api/stations/route.ts
git commit -m "feat: add rate limiting to disruptions and stations routes"
```

---

## Task 5: Add HTTP security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace `next.config.ts` with the hardened config**

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Allow:
    //   self              — page, scripts, styles, images served from this origin
    //   fonts.googleapis.com / fonts.gstatic.com — Google Fonts (used in layout.tsx)
    //   va.vercel-scripts.com — Vercel Analytics script
    //   vitals.vercel-insights.com — Vercel Web Vitals beacon
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

Note on `'unsafe-inline'` for scripts: Next.js injects inline scripts for hydration. Removing `'unsafe-inline'` requires nonce-based CSP which is a larger change and out of scope here. This is the standard starting point for Next.js apps.

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: successful build, no TypeScript or lint errors.

- [ ] **Step 3: Verify headers are present**

Start the production server:
```bash
npm run start &
sleep 2
curl -s -I http://localhost:3000 | grep -iE "x-frame|x-content|referrer|permissions|strict-transport|content-security|x-powered"
```

Expected output (order may vary):
```
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
strict-transport-security: max-age=31536000; includeSubDomains
content-security-policy: default-src 'self'; ...
```

`X-Powered-By` should NOT appear.

Kill the background server: `kill %1`

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: add HTTP security headers and disable X-Powered-By"
```

---

## Verification Checklist

After all tasks, confirm the following manually:

- [ ] `curl -I http://localhost:3000` shows all 6 security headers, no `X-Powered-By`
- [ ] `curl http://localhost:3000/api/departures/BADCODE123` returns `{"error":"Invalid station code"}` with status 400
- [ ] `curl http://localhost:3000/api/departures/../../../` returns 400
- [ ] `http://localhost:3000/departures/ASD` returns 404 (page deleted)
- [ ] `npm run build` is clean
- [ ] `npx tsc --noEmit` is clean
