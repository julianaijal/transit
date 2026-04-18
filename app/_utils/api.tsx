import { IStation, IDepartures } from "../interfaces/interfaces";

const BASE_URL = "https://gateway.apiportal.ns.nl";
const API_KEY = process.env.NS_API ?? "";

export async function getStationCodes(query: string): Promise<IStation[]> {
  const res = await fetch(
    `${BASE_URL}/reisinformatie-api/api/v2/stations?q=${encodeURIComponent(query)}`,
    {
      headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    }
  );
  const data = await res.json();
  return (data.payload ?? []).map((s: { UICCode: string; namen: { lang: string }; code: string }) => ({
    id: s.UICCode,
    name: s.namen.lang,
    code: s.code,
  }));
}

export async function fetchDepartureData(stationCode: string): Promise<IDepartures> {
  const res = await fetch(
    `${BASE_URL}/reisinformatie-api/api/v2/departures?station=${stationCode}&maxJourneys=10`,
    {
      headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    }
  );
  const data = await res.json();
  return data.payload ?? { departures: [] };
}
