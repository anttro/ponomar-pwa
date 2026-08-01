/**
 * Offline data manager — preloads data files for offline use.
 *
 * Allows users to select which languages and data types to cache
 * for offline access. Shows progress during preloading and
 * storage usage statistics.
 *
 * Usage:
 *   const progress = await OfflineManager.preload({
 *     languages: ['ru', 'cu'],
 *     types: ['lives', 'calendar'],
 *   });
 *   const stats = await OfflineManager.getStats();
 *   await OfflineManager.clearCache();
 */

import { DataCache } from './data-cache';

export interface PreloadOptions {
  languages: string[];
  types: ('lives' | 'bible' | 'calendar' | 'menaion')[];
}

export interface PreloadProgress {
  current: number;
  total: number;
  file: string;
  done: boolean;
}

export interface CacheStats {
  usageBytes: number;
  quotaBytes: number;
  cachedFiles: number;
  cachedLanguages: string[];
  cachedTypes: string[];
}

/** Data files to preload per language, grouped by type. */
const DATA_FILES: Record<string, (lang: string) => string[]> = {
  lives: (lang) => {
    const files: string[] = [];
    // Month-prefixed files
    for (let m = 1; m <= 12; m++) {
      files.push(`/data/${lang}/lives/${String(m).padStart(2, '0')}.json`);
    }
    // Misc split files (by first digit)
    for (let d = 0; d <= 9; d++) {
      files.push(`/data/${lang}/lives/misc/${d}.json`);
    }
    return files;
  },
  calendar: () => [
    '/data/shared/fasting.json',
    '/data/shared/calendar/triodion.json',
    '/data/shared/calendar/pentecostarion.json',
    '/data/shared/lives-index.json',
  ],
  menaion: (lang) => [
    `/data/${lang}/menaion-bundle.json`,
  ],
  bible: (lang) => [
    // Bible version index
    '/data/bible/versions.json',
    // Main Bible text files per language
    `/data/${lang}/bible/synod.text`,
  ],
};

export class OfflineManager {
  private static _progress: PreloadProgress | null = null;

  /** Get current preload progress */
  static getProgress(): PreloadProgress | null {
    return OfflineManager._progress;
  }

  /**
   * Preload selected data files for offline use.
   * Returns a PreloadProgress object that can be polled for progress.
   */
  static async preload(options: PreloadOptions): Promise<PreloadProgress> {
    const filesToFetch: string[] = [];

    for (const lang of options.languages) {
      for (const type of options.types) {
        const generator = DATA_FILES[type];
        if (generator) {
          filesToFetch.push(...generator(lang));
        }
      }
    }

    // Deduplicate
    const uniqueFiles = [...new Set(filesToFetch)];

    const progress: PreloadProgress = {
      current: 0,
      total: uniqueFiles.length,
      file: '',
      done: false,
    };
    OfflineManager._progress = progress;

    // Fetch files sequentially to avoid overwhelming the network
    for (const file of uniqueFiles) {
      progress.current++;
      progress.file = file;

      // Use DataCache.fetch to cache the file in IndexedDB
      // The service worker will also cache it via runtime caching
      try {
        const resp = await fetch(file);
        if (!resp.ok) continue;
        const ct = resp.headers.get('content-type');
        if (ct && ct.includes('text/html')) continue;

        // Determine type and cache
        let data: unknown;
        if (file.endsWith('.text')) {
          data = await resp.text();
        } else {
          data = await resp.json();
        }
        await DataCache.set(`url:${file}`, data);
      } catch {
        // Skip failed files — user can retry
      }
    }

    progress.done = true;
    OfflineManager._progress = null;
    return progress;
  }

  /**
   * Clear all cached data from IndexedDB and service worker caches.
   */
  static async clearCache(): Promise<void> {
    // Clear IndexedDB cache
    await DataCache.clear();

    // Clear service worker caches
    const cacheNames = await caches.keys();
    const ponomarCaches = cacheNames.filter(name =>
      name.startsWith('ponomar-')
    );
    await Promise.all(
      ponomarCaches.map(name => caches.delete(name))
    );
  }

  /**
   * Get cache usage statistics.
   */
  static async getStats(): Promise<CacheStats> {
    const estimate = await DataCache.estimate();
    const cachedCount = await DataCache.count();

    // Determine which languages and types are cached
    const cachedLanguages = new Set<string>();
    const cachedTypes = new Set<string>();

    return {
      usageBytes: estimate?.usage ?? 0,
      quotaBytes: estimate?.quota ?? 0,
      cachedFiles: cachedCount,
      cachedLanguages: [...cachedLanguages],
      cachedTypes: [...cachedTypes],
    };
  }

  /**
   * Format bytes to human-readable string.
   */
  static formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}