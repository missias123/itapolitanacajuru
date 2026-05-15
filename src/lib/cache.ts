type CacheEntry<T> = {
  value: T;
  updatedAt: number;
  ttlMs: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.updatedAt > entry.ttlMs;
  if (isExpired) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = 30_000): void {
  cacheStore.set(key, { value, updatedAt: Date.now(), ttlMs });
}

export function invalidateCache(key: string): void {
  cacheStore.delete(key);
}

export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) cacheStore.delete(key);
  }
}

export async function saveWithAutoInvalidation<T>(
  keyToInvalidate: string,
  saveFn: () => Promise<T>
): Promise<T> {
  const result = await saveFn();
  invalidateCacheByPrefix(keyToInvalidate);
  return result;
}
