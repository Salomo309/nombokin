import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

let client: Redis | null = null;

function getRedis(): Redis | null {
  if (client) return client;
  try {
    const r = new Redis(REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 1500,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 1000)),
    });
    // App tetap berjalan lewat database bila Redis tidak tersedia
    r.on("error", () => {});
    r.on("end", () => {
      client = null;
    });
    client = r;
    return r;
  } catch {
    return null;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore: fallback tanpa cache
  }
}

export async function redisDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {
    // ignore
  }
}

// Increment counter, set expiry on first hit. Returns current count,
// or null when Redis is unavailable (caller should fail open).
export async function redisIncrWithExpiry(
  key: string,
  ttlSeconds: number
): Promise<number | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const count = await r.incr(key);
    if (count === 1) {
      await r.expire(key, ttlSeconds);
    }
    return count;
  } catch {
    return null;
  }
}
