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
 *     types: ['calendar', 'bible'],
 *   });
 *   const stats = await OfflineManager.getStats();
 *   await OfflineManager.clearCache();
 */

import { DataCache } from './data-cache';
import { diagLog } from './diag-log';

export interface PreloadOptions {
  languages: string[];
  types: ('calendar' | 'bible')[];
  bibleTranslations?: string[];
}

export interface PreloadProgress {
  current: number;
  total: number;
  file: string;
  done: boolean;
  failed: number;
  failedFiles?: string[];
  aborted?: boolean;
}

export interface CacheStats {
  usageBytes: number;
  quotaBytes: number;
  cachedFiles: number;
  cachedLanguages: string[];
  cachedTypes: string[];
}

/** Bible translation sizes (pre-computed). */
const BIBLE_SIZES: Record<string, string> = {
  'en/bible/kjv': '5.1 MB', 'en/bible/brenton': '4.1 MB', 'en/bible/nonkjv': '0.9 MB',
  'ru/bible/synod': '7.3 MB', 'ru/bible/kassian': '1.5 MB', 'ru/bible/yungerov': '1.7 MB',
  'cu/bible/elis': '8.4 MB', 'el/bible/spt': '8.6 MB', 'fr/bible/ls': '5.2 MB',
  'la/bible/vulgate': '4.4 MB', 'ar/bible/svd': '7.9 MB',
  'zh/Hans/bible/cuv': '3.7 MB', 'zh/Hant/bible/cuv': '3.7 MB',
};

let manifestPromise: Promise<Record<string, Record<string, string[]>> | null> | null = null;

function loadManifest(): Promise<Record<string, Record<string, string[]>> | null> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const resp = await fetch('/data/shared/preload-manifest.json');
        if (!resp.ok) return null;
        return await resp.json();
      } catch {
        return null;
      }
    })().then((m) => {
      // Don't cache a failure forever — allow retry on next call
      if (m === null) {
        diagLog('manifest-unavailable');
        manifestPromise = null;
      }
      return m;
    });
  }
  return manifestPromise;
}

function getFallbackCalendarFiles(lang: string): string[] {
  const files = [
    `/data/${lang}/menaion-bundle.json`,
    '/data/shared/fasting.json',
    '/data/shared/menaion-daily/index.json',
  ];
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    files.push(`/data/${lang}/lives/${mm}.json`);
  }
  return files;
}

export class OfflineManager {
  private static _progress: PreloadProgress | null = null;

  /** Get size string for a Bible translation. */
  static getBibleSize(translationPath: string): string {
    return BIBLE_SIZES[translationPath] || '?';
  }

  /** Discover all book files for a Bible translation from versions.json. */
  static async getBibleFiles(translationPath: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const resp = await fetch('/data/bible/versions.json');
      const versions = await resp.json() as any[];
      const ver = versions.find((v: any) => v.id === translationPath);
      if (ver && ver.books) {
        for (const book of ver.books) {
          files.push(`/data/${translationPath}/${book.id}.text`);
        }
      }
    } catch {}
    return files;
  }

  /** Get current preload progress */
  static getProgress(): PreloadProgress | null {
    return OfflineManager._progress;
  }

  /**
   * Preload selected data files for offline use.
   * Returns a PreloadProgress object that can be polled for progress.
   */
  static async preload(options: PreloadOptions): Promise<PreloadProgress> {
    const startedAt = Date.now();
    const filesToFetch: string[] = [];
    const m = await loadManifest();

    for (const lang of options.languages) {
      for (const type of options.types) {
        if (type === 'calendar') {
          const list = m?.[lang]?.calendar ?? getFallbackCalendarFiles(lang);
          filesToFetch.push(...list);
        } else if (type === 'bible') {
          filesToFetch.push('/data/bible/versions.json');
        }
      }
    }

    // Deduplicate
    const uniqueFiles = [...new Set(filesToFetch)];

    // Add Bible translation files
    for (const trans of options.bibleTranslations || []) {
      const bibleFiles = await OfflineManager.getBibleFiles(trans);
      for (const f of bibleFiles) {
        if (!uniqueFiles.includes(f)) uniqueFiles.push(f);
      }
    }
    if (!uniqueFiles.includes('/data/bible/versions.json')) {
      uniqueFiles.unshift('/data/bible/versions.json');
    }

    const progress: PreloadProgress = {
      current: 0,
      total: uniqueFiles.length,
      file: '',
      done: false,
      failed: 0,
    };
    OfflineManager._progress = progress;

    diagLog('preload-start', {
      langs: options.languages.join(','),
      types: options.types.join(','),
      bibles: (options.bibleTranslations || []).length,
      total: progress.total,
      manifest: m !== null,
    });

    // Fetch files sequentially to avoid overwhelming the network
    let netFailStreak = 0;
    for (const file of uniqueFiles) {
      progress.current++;
      progress.file = file;

      const cacheKey = `url:${file}`;
      if (await DataCache.get(cacheKey) !== null) continue;

      let success = false;
      let notFound = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1000));
        try {
          const resp = await fetch(file);
          if (resp.status === 404) {
            notFound = true;
            break;
          }
          if (!resp.ok) continue;
          const ct = resp.headers.get('content-type');
          // HTML body (SPA fallback / captive portal) is not our data —
          // counts as a failure and feeds the circuit-breaker streak
          if (ct && ct.includes('text/html')) break;

          let data: unknown;
          if (file.endsWith('.text')) {
            data = await resp.text();
          } else {
            data = await resp.json();
          }
          await DataCache.set(`url:${file}`, data);
          success = true;
          break;
        } catch {
          // Retry on network error
        }
      }
      if (!success && !notFound) {
        progress.failed++;
        netFailStreak++;
        if (!progress.failedFiles) progress.failedFiles = [];
        if (progress.failedFiles.length < 10) progress.failedFiles.push(file);
        if (netFailStreak >= 5) {
          // Circuit breaker — network appears dead; abort instead of grinding
          progress.aborted = true;
          diagLog('preload-abort', { failed: progress.failed, current: progress.current });
          break;
        }
      } else {
        // Success or 404 both prove connectivity
        netFailStreak = 0;
      }
    }

    progress.done = true;
    diagLog('preload-done', {
      total: progress.total,
      failed: progress.failed,
      ms: Date.now() - startedAt,
      aborted: progress.aborted === true,
    });
    OfflineManager._progress = null;
    return progress;
  }

  /**
   * Clear all cached data from IndexedDB and service worker caches.
   */
  static async clearCache(): Promise<void> {
    await DataCache.clear();
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

  /**
   * Get the expected calendar file count for a language from the manifest.
   */
  static async getCalendarFileCount(lang: string): Promise<number> {
    const m = await loadManifest();
    return m?.[lang]?.calendar?.length ?? 0;
  }
}