interface RateRecord {
  timestamps: number[];
}

const store = new Map<string, RateRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 3600 * 1000);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { limited: boolean; retryAfter: number; remaining: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps within the window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      limited: true,
      retryAfter: Math.max(retryAfter, 1),
      remaining: 0,
    };
  }

  record.timestamps.push(now);
  return {
    limited: false,
    retryAfter: 0,
    remaining: limit - record.timestamps.length,
  };
}
