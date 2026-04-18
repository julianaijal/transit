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
