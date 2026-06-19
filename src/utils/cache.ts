/**
 * Basit, TTL'li in-memory cache. Aynı arama/detay sorgusunun kısa sürede
 * dış API'ye tekrar gitmesini önler. İleride Redis ile değiştirilebilir;
 * arayüz (get/set) sabit tutulursa geçiş kolay olur.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }
}

/** Kitap arama/detay sonuçları için 5 dakikalık TTL. */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
