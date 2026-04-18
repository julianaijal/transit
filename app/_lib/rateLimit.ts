// lru-cache v5 — default export is the constructor
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LRU = require("lru-cache") as new (opts: { max: number }) => {
  get(key: string): Entry | undefined;
  set(key: string, value: Entry): void;
};

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

interface Entry {
  count: number;
  windowStart: number;
}

const cache = new LRU({ max: 5000 });

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = cache.get(ip);

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
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
