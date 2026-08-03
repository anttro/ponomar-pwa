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

const SERVICE_TEMPLATES = [
  'Template', 'Vespers', 'Matins', 'DivineLiturgy', 'GreatCompline', 'UsualBeginning',
  'TrisagionBlock', 'Prime', 'ThirdHour', 'SixthHour', 'NinthHour', 'RoyalHours',
  'PaschalHours', 'SaturdayMidnight', 'SaturdayVespersLiturgy', 'SaturdayHours',
  'BurialVespers', 'MariasStanding', 'Pascha', 'Lamentations', 'PassionGospels', 'RoyalHoursFriday',
  ...Array.from({ length: 20 }, (_, i) => `Kathisma${i + 1}`),
  'BrightMonday', 'BrightTuesday', 'BrightWednesday', 'BrightThursday', 'BrightFriday', 'BrightSaturday',
  'FirstWeekMonday', 'FirstWeekTuesday', 'FirstWeekWednesday', 'FirstWeekThursday', 'FirstWeekFriday', 'FirstWeekSaturday',
  'Antipascha', 'Myrrhbearers', 'Paralytic', 'Samaritan', 'BlindMan', 'Prepolovenie',
  'Apodosis', 'Ascension', 'PentecostSaturday', 'HolyFathers', 'HolySpirit', 'Pentecost', 'AllSaints', 'RussianSaints',
  'NativityTheotokos', 'Vvedenie', 'Exaltation', 'NativityHours', 'Nativity',
  'TheophanyHours', 'Theophany', 'Sretenie', 'Annunciation', 'PalmSunday', 'Transfiguration', 'Dormition',
  'Circumcision', 'ForerunnerBirth', 'PeterPaul', 'ForerunnerBeheading', 'Pokrov', 'MichaelSynaxis',
  'Vladimir', 'Kazan', 'JohnTheologianSep', 'Sergius', 'Ambrose', 'Demetrius', 'Nicholas',
  'NicholasTranslation', 'FindingHead1st', 'FindingHead3rd', 'FortyMartyrs', 'JohnTheologianMay',
  'Panteleimon', 'Elijah', 'ProcessionCross', 'SixCouncilsFathers', 'SeventhCouncilFathers',
  'ForefathersSunday', 'HolyFathersNativity', 'SundayAfterNativity', 'MenaionDay', 'Triodion',
];

const FEAST_NAMES = [
  'allsaints', 'ambrose', 'annunciation', 'antipascha', 'apodosis', 'ascension', 'blindman',
  'bright-friday', 'bright-monday', 'bright-saturday', 'bright-thursday', 'bright-tuesday', 'bright-wednesday',
  'burial-vespers', 'circumcision', 'demetrius', 'dormition', 'elijah', 'exaltation',
  'finding-head-1st', 'finding-head-3rd',
  'first-week-friday', 'first-week-monday', 'first-week-saturday', 'first-week-thursday', 'first-week-tuesday', 'first-week-wednesday',
  'forefathers-sunday', 'forerunner-beheading', 'forerunner-birth', 'forty-martyrs',
  'great-monday', 'great-thursday', 'great-tuesday', 'great-wednesday',
  'holy-fathers-nativity', 'holyfathers', 'holyspirit',
  'johntheologian-may', 'johntheologian-sep', 'kazan', 'lamentations',
  'marias-standing', 'michael-synaxis', 'myrrhbearers',
  'nativity-hours', 'nativity-theotokos', 'nativity', 'nicholas-translation', 'nicholas',
  'palm-sunday', 'panteleimon', 'paralytic', 'pascha', 'passion-gospels', 'pentecost',
  'pentecostsaturday', 'peter-paul', 'pokrov', 'prepolovenie', 'procession-cross',
  'royal-hours-friday', 'russiansaints', 'samaritan',
  'saturday-hours', 'saturday-midnight', 'saturday-vespers-liturgy', 'sergius',
  'seventh-council-fathers', 'six-councils-fathers', 'sretenie', 'sunday-after-nativity',
  'theophany-hours', 'theophany', 'transfiguration', 'vladimir', 'vvedenie',
];

const PRAYER_COLLECTIONS: Record<string, string[]> = {
  akathists: [
    'akathist-jesus', 'akathist-nicholas', 'akathist-theotokos', 'alexander-svirsky',
    'angels-canon', 'cross-canon', 'cyprian-justina', 'forerunner-canon', 'gabriel-canon',
    'guardian-angel', 'jesus-compunction', 'jesus-penitential', 'john-kronstadt',
    'mary-egypt', 'michael-canon', 'murom-wonderworkers', 'nativity-canon',
    'nicholas-canon-akathist', 'panteleimon', 'pascha-canon', 'pokrov-canon',
    'saint-anne', 'seraphim', 'sergius', 'skoroposlushnitsa', 'spiridon',
    'theotokos-moleben', 'theotokos-nativity', 'theotokos-thanksgiving',
    'trinity-canon', 'troeruchitsa', 'tryphon', 'utoli-pechali',
  ],
  horologion: [
    'interhour-1', 'interhour-3', 'interhour-6', 'interhour-9', 'meal-blessing',
    'midnight-daily', 'midnight-saturday', 'midnight-sunday', 'panagia',
    'small-compline', 'typica',
  ],
  'prayer-rule': [
    'beginning-ending', 'communion', 'diptychs', 'evening', 'litia-departed',
    'morning', 'rule-impurity', 'thanksgiving', 'three-canons', 'twelve-psalms',
  ],
  sbornik: [
    'biblical-songs-daily', 'biblical-songs-feasts', 'biblical-songs-lent',
    'common-trop-kont', 'exapostilaria-week', 'feast-trop-kont', 'katavasia',
    'lamps-weekday', 'lent-trop-kont', 'pentecost-trop-kont', 'sunday-trop-kont',
    'theotokion-8tones', 'theotokion-dismissal', 'theotokion-sunday',
    'trinity-troparia', 'weekday-trop-kont',
  ],
  irmologion: [
    'chosen-psalms', 'feast-refrains-ode9', 'gospodi-vozzvah',
    'irmos-1', 'irmos-2', 'irmos-3', 'irmos-4', 'irmos-5', 'irmos-6', 'irmos-7', 'irmos-8',
    'irmos-prefeast-nativity', 'irmos-prefeast-theophany',
    'lent-canon-rules', 'liturgy-chants', 'paschal-canon',
    'saturday-troparia', 'stepenna', 'sunday-feast-verses', 'sunday-prokimena',
    'sunday-troparia', 'theotokia-daily', 'theotokia-sunday', 'trinity-songs',
  ],
};

const PARIMII_DIRS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'cheese-week', 'common-saints', 'holy-week', 'palm-week', 'pentecostarion',
  'lent-week-1', 'lent-week-2', 'lent-week-3', 'lent-week-4', 'lent-week-5',
];

function daysInMonth(m: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/** Generate calendar & services data files for a given language. */
function calendarDataFiles(lang: string): string[] {
  const files: string[] = [];

  // Lives: month files
  for (let m = 1; m <= 12; m++) {
    files.push(`/data/${lang}/lives/${String(m).padStart(2, '0')}.json`);
  }
  // Lives: misc files
  for (let d = 0; d <= 9; d++) {
    files.push(`/data/${lang}/lives/misc/${d}.json`);
  }
  // Shared lives index
  files.push('/data/shared/lives-index.json');

  // Calendar shared
  files.push('/data/shared/fasting.json');
  files.push('/data/shared/calendar/triodion.json');
  files.push('/data/shared/calendar/pentecostarion.json');

  // Menaion bundle
  files.push(`/data/${lang}/menaion-bundle.json`);

  // Service templates
  for (const t of SERVICE_TEMPLATES) {
    files.push(`/data/shared/services/templates/${t}.json`);
  }

  // Feast data
  for (const f of FEAST_NAMES) {
    files.push(`/data/shared/services/${f}/full.json`);
  }

  // Paraclete day files (8 tones × 6 days)
  for (let tone = 1; tone <= 8; tone++) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      files.push(`/data/shared/services/paraclete/tone${tone}/${day}.json`);
    }
  }

  // Service canons
  for (let tone = 0; tone <= 7; tone++) {
    files.push(`/data/shared/services/canons/tone${tone}/sunday.json`);
  }
  for (let tone = 1; tone <= 8; tone++) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      files.push(`/data/shared/services/canons/paraclete/tone${tone}/${day}.json`);
    }
  }
  files.push('/data/shared/services/canons/great-canon/part1.json');
  files.push('/data/shared/services/canons/great-canon/part2.json');
  files.push('/data/shared/services/canons/great-canon/part3.json');
  files.push('/data/shared/services/canons/great-canon/part4.json');

  // Menaion daily index + sections
  files.push('/data/shared/menaion-daily/index.json');
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInMonth(m); d++) {
      const dateKey = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (let n = 1; n <= 4; n++) {
        files.push(`/data/shared/menaion-daily/${dateKey}/${n}.json`);
      }
    }
  }

  // Triodion
  for (let i = 1; i <= 37; i++) {
    files.push(`/data/shared/triodion/${String(i).padStart(2, '0')}.json`);
  }

  // Pentecostarion
  for (let i = 1; i <= 315; i++) {
    files.push(`/data/shared/pentecostarion/${String(i).padStart(2, '0')}.json`);
  }

  // Menaion common + add
  for (let i = 1; i <= 42; i++) files.push(`/data/shared/menaion-common/${String(i).padStart(2, '0')}.json`);
  for (let i = 1; i <= 51; i++) files.push(`/data/shared/menaion-add/${String(i).padStart(2, '0')}.json`);

  // Prayer collections
  for (const [collection, items] of Object.entries(PRAYER_COLLECTIONS)) {
    for (const item of items) {
      files.push(`/data/shared/${collection}/${item}/full.json`);
    }
  }

  // Horologion additions
  const horologionAddItems = [
    'exapostilaria', 'katavasia', 'lamps', 'songs-daily', 'songs-feasts', 'songs-lent',
    'theotokia-8tones', 'theotokia-dismissal', 'theotokia-sunday', 'trinity-8tones',
    'trop-common', 'trop-daily', 'trop-lent', 'trop-pentecost', 'trop-sunday',
  ];
  for (const item of horologionAddItems) {
    files.push(`/data/shared/horologionadd/${item}/full.json`);
  }
  for (const m of ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']) {
    files.push(`/data/shared/horologionadd/trop-feasts-${m}/full.json`);
  }

  // Parimii
  for (const dir of PARIMII_DIRS) {
    files.push(`/data/shared/parimii/${dir}/full.json`);
  }

  // Commemorations
  for (const id of ['134', '35', '373', '543', 'F0', 'F6']) {
    files.push(`/data/shared/commemorations/${id}.json`);
  }

  // Language-specific commands
  files.push(`/data/${lang}/commands/Times.json`);
  files.push(`/data/${lang}/commands/LanguagePacks.json`);
  files.push(`/data/${lang}/commands/Podobni.json`);
  files.push(`/data/${lang}/commands/RuleBasedNumbers.json`);

  // Language-specific octoecheos (8 tones × 7 days)
  for (let tone = 0; tone <= 7; tone++) {
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      files.push(`/data/${lang}/services/octoecheos/tone${tone}/${day}.json`);
    }
  }

  // Language-specific service commands
  for (let tone = 1; tone <= 8; tone++) {
    files.push(`/data/${lang}/services/commands/Tone${tone}.json`);
  }
  files.push(`/data/${lang}/services/commands/AfterEach.json`);
  files.push(`/data/${lang}/services/commands/Bow.json`);
  files.push(`/data/${lang}/services/commands/Prostration.json`);
  files.push(`/data/${lang}/services/commands/S1.json`);
  files.push(`/data/${lang}/services/commands/S2.json`);

  return files;
}

/** Data files to preload per language, grouped by type. */
const DATA_FILES: Record<string, (lang: string) => string[]> = {
  calendar: (lang) => calendarDataFiles(lang),
  bible: () => ['/data/bible/versions.json'],
};

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
    };
    OfflineManager._progress = progress;

    // Fetch files sequentially to avoid overwhelming the network
    for (const file of uniqueFiles) {
      progress.current++;
      progress.file = file;

      // Skip if already cached
      const cacheKey = `url:${file}`;
      if (await DataCache.get(cacheKey) !== null) continue;

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