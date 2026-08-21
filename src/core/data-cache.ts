/**
 * Persistent data cache using IndexedDB.
 *
 * Provides cache-first fetch with TTL support for JSON and text data.
 * Works alongside the service worker: SW caches static assets,
 * IndexedDB caches fetched data for cross-session persistence.
 *
 * Usage:
 *   const data = await DataCache.fetch('/data/ru/lives/01.json');
 *   await DataCache.set('my-key', { some: 'data' });
 *   const cached = await DataCache.get('my-key');
 *   await DataCache.clear();
 *   const estimate = await DataCache.estimate();
 */

const DB_NAME = 'ponomar-cache';
const DB_VERSION = 1;
const STORE_NAME = 'data';
const DEFAULT_TTL_MS = Infinity; // never expire — static data

interface CacheEntry {
  key: string;
  data: unknown;
  contentType: string;
  storedAt: number;
  ttl: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('storedAt', 'storedAt', { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => { dbPromise = null; };
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

export class DataCache {
  /**
   * Get a value from the cache.
   * Returns null if the key doesn't exist or the TTL has expired.
   */
  static async get(key: string): Promise<unknown | null> {
    try {
      const db = await getDB();
      return new Promise<unknown | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;
          if (!entry) {
            resolve(null);
            return;
          }
          // Check TTL
          if (Date.now() - entry.storedAt > entry.ttl) {
            // Expired — remove and return null
            db.transaction(STORE_NAME, 'readwrite')
              .objectStore(STORE_NAME)
              .delete(key);
            resolve(null);
            return;
          }
          resolve(entry.data);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Store a value in the cache.
   */
  static async set(key: string, data: unknown, ttl: number = DEFAULT_TTL_MS): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const entry: CacheEntry = {
          key,
          data,
          contentType: typeof data === 'string' ? 'text' : 'json',
          storedAt: Date.now(),
          ttl,
        };
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail — cache is best-effort
    }
  }

  /**
   * Remove an entry from the cache.
   */
  static async remove(key: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        db.transaction(STORE_NAME, 'readwrite')
          .objectStore(STORE_NAME)
          .delete(key);
        resolve();
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear all cached data.
   */
  static async clear(): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        db.transaction(STORE_NAME, 'readwrite')
          .objectStore(STORE_NAME)
          .clear();
        resolve();
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Get storage usage estimate.
   * Returns { usage, quota } in bytes, or null if not available.
   */
  static async estimate(): Promise<{ usage: number; quota: number } | null> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Count entries in the cache.
   */
  static async count(): Promise<number> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Cache-first fetch: tries IndexedDB first, falls back to network.
   * If the data is fetched from network, it's cached for future use.
   */
  static async fetch<T = unknown>(url: string, options?: { ttl?: number; type?: 'json' | 'text' }): Promise<T | null> {
    const cacheKey = `url:${url}`;
    const cached = await DataCache.get(cacheKey);
    if (cached !== null) {
      return cached as T;
    }

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        // Don't cache 404s
        return null;
      }
      const ct = resp.headers.get('content-type');
      if (ct && ct.includes('text/html')) {
        return null;
      }

      let data: unknown;
      if (options?.type === 'text') {
        data = await resp.text();
      } else {
        data = await resp.json();
      }

      // Cache the fetched data
      await DataCache.set(cacheKey, data, options?.ttl);
      return data as T;
    } catch {
      return null;
    }
  }
}