/**
 * Calendar view — month grid + day detail panel with actual data loading.
 */

import { JDate } from '../core/jdate';
import { Paschalion } from '../core/paschalion';
import { computeDay } from '../core/day-computer';
import { evaluateFasting } from '../core/fasting';
import type { FastingPeriod } from '../core/fasting';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { DataCache } from '../core/data-cache';
import { fontClass } from './settings-view';
import { ServiceView } from './service-view';

let cachedFastingPeriods: FastingPeriod[] | null = null;
const lifeCache = new Map<string, LifeData | null>();
const menaionBundles = new Map<string, Record<string, unknown>>();
let sharedScriptureIndex: Record<string, unknown[]> | null = null;
let bookAbbrevMap: Record<string, string> | null = null;
let bookCVSep = ':';
let bookAbbrevLang = '';
let cachedTriodion: Record<string, unknown> | null = null;
let cachedPentecostarion: Record<string, unknown> | null = null;

function resolveDefaultBibleVersion(): string {
  try {
    const stored = localStorage.getItem('ponomar-settings');
    if (stored) {
      const s = JSON.parse(stored);
      return s.defaultBibleVersion || 'kjv';
    }
  } catch {}
  return 'kjv';
}

function shortToLang(shortId: string): string {
  if (shortId === 'kjv' || shortId === 'brenton' || shortId === 'nonkjv') return 'en';
  if (shortId === 'synod' || shortId === 'kassian' || shortId === 'yungerov') return 'ru';
  if (shortId === 'elis') return 'cu';
  if (shortId === 'ls') return 'fr';
  if (shortId === 'spt') return 'el';
  if (shortId === 'vulgate') return 'la';
  if (shortId === 'cuv' || shortId === 'cuv-hant') return 'zh';
  if (shortId === 'svd') return 'ar';
  return 'en';
}

async function loadBookAbbrevs(lang: string): Promise<void> {
  if (bookAbbrevLang === lang && bookAbbrevMap) return;
  bookAbbrevLang = lang;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch('/data/bible/versions.json');
      if (!resp.ok) { if (attempt === 0) await new Promise(r => setTimeout(r, 300)); continue; }
      const ct = resp.headers.get('content-type');
      if (ct && ct.includes('text/html')) { if (attempt === 0) await new Promise(r => setTimeout(r, 300)); continue; }
      const versions = await resp.json() as any[];
      const ver = versions.find((v: any) => v.id.startsWith(lang + '/')) || versions[0];
      if (ver) {
        const map: Record<string, string> = {};
        if (ver.books) {
          for (const book of ver.books) {
            map[book.id] = book.short || book.id;
          }
        }
        bookAbbrevMap = map;
        if (ver.formatting?.CVSep) {
          bookCVSep = ver.formatting.CVSep;
        }
        return;
      }
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 300));
    }
  }
}

function formatReadingRef(reading: string, _lang: string): string {
  const idx = reading.indexOf('_');
  if (idx === -1) return reading.replace(/_/g, ' ');
  const bookId = reading.substring(0, idx);
  const passage = reading.substring(idx + 1);
  const lookupId = bookId.replace(/ /g, '_');
  const abbrev = bookAbbrevMap?.[lookupId] || bookId;
  const formatted = passage.replace(/:/g, bookCVSep === ',' ? ',' : bookCVSep === '：' ? '：' : ':');
  const display = `${abbrev} ${formatted}`;
  const chMatch = passage.match(/^(\d+)/);
  const chapter = chMatch ? chMatch[1] : '1';
  const defaultShort = resolveDefaultBibleVersion();
  const langPrefix = shortToLang(defaultShort);
  return `<a href="#bible/${langPrefix}~${defaultShort}/${bookId.replace(/ /g, '_')}/${chapter}" class="text-blue-600 underline hover:text-blue-800">${display}</a>`;
}

async function loadSharedScriptureIndex(): Promise<Record<string, unknown[]> | null> {
  if (sharedScriptureIndex) return sharedScriptureIndex;
  try {
    const data = await DataCache.fetch<Record<string, unknown[]>>('/data/shared/lives-index.json');
    if (data) {
      sharedScriptureIndex = data;
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

async function loadMenaionBundle(lang: string): Promise<Record<string, unknown> | null> {
  const key = lang === 'cu' ? 'cu' : lang;
  if (menaionBundles.has(key)) return menaionBundles.get(key)!;
  try {
    const bundle = await DataCache.fetch<Record<string, unknown>>(`/data/${key}/menaion-bundle.json`);
    if (bundle) {
      menaionBundles.set(key, bundle);
      return bundle;
    }
    return null;
  } catch {
    return null;
  }
}

async function loadFastingPeriods(): Promise<FastingPeriod[]> {
  if (cachedFastingPeriods) return cachedFastingPeriods;
  try {
    const data = await DataCache.fetch<FastingPeriod[]>('/data/shared/fasting.json');
    if (data) {
      cachedFastingPeriods = data;
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

interface LifeData {
  name?: {
    nominative?: string;
    short?: string;
    shortF?: string;
  };
  life?: {
    text: string;
  };
  scripture?: {
    type?: string;
    Type?: string;
    reading?: string;
    Reading?: string;
    pericope?: string;
    Pericope?: string;
    cmd?: string;
  }[];
  services?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CommemorationData {
  NAME?: { Long?: string; ShortN?: string; ShortF?: string } | { text: string };
  LIFE?: { text: string };
  CHURCH?: { Rank?: string };
  SCRIPTURE?: { Type?: string; Reading?: string; Pericope?: string; Cmd?: string } | { Type?: string; Reading?: string; Pericope?: string; Cmd?: string }[];
  SERVICE?: Record<string, unknown>;
  TROPARION?: { Tone?: string; text?: string } | { Tone?: string; text?: string }[];
  [key: string]: unknown;
}

interface ReadingItem {
  ref: string;
  purpose: string;
}

interface ReadingsGroup {
  service: string;
  items: ReadingItem[];
}

/** Order of services for display (Vespers → Hours → Matins → Liturgy sub-types) */
const SERVICE_ORDER = ['Вечерня', '1-й час', '3-й час', '6-й час', '9-й час', 'Утреня', 'Апостол', 'Евангелие'];

/** Map Type/service name to display service label */
function readingsTypeToService(type: string, t: ReturnType<typeof getTranslations>): string {
  switch (type) {
    case 'apostol': return t.calendar.readingTypes.apostol;
    case 'gospel': return t.calendar.readingTypes.gospel;
    case 'matins': return t.calendar.readingTypes.matins;
    case 'vespers': return t.calendar.readingTypes.vespers;
    case 'primes': return t.calendar.readingTypes.primes;
    case 'terce': return t.calendar.readingTypes.terce;
    case 'sext': return t.calendar.readingTypes.sext;
    case 'none': return t.calendar.readingTypes.none;
    case 'liturgy': return t.calendar.readingTypes.liturgy;
    case 'A': return t.calendar.readings;
    default:
      if (/^[0-9]+$/.test(type)) {
        const n = parseInt(type, 10);
        if (n <= 3 || n === 0) return t.calendar.readingTypes.vespers;
        return t.calendar.readingTypes.matins;
      }
      return t.calendar.readingTypes[type] || t.calendar.readings;
  }
}

function svcNameToService(svcName: string, scType: string, t: ReturnType<typeof getTranslations>): string {
  const upper = svcName.toUpperCase();
  if (upper === 'LITURGY') {
    return readingsTypeToService(scType, t);
  }
  return readingsTypeToService(upper.toLowerCase(), t);
}

function findOrCreateGroup(groups: ReadingsGroup[], service: string): ReadingsGroup {
  let group = groups.find(g => g.service === service);
  if (!group) {
    group = { service, items: [] };
    groups.push(group);
  }
  return group;
}

/** Map of menaion CId to shared commemoration ID (for feast days with special commemorations) */
const CID_TO_SHARED_COMM: Record<string, string> = {
  '010101': '134',   // Circumcision
  '010601': '35',    // Theophany
  '011901': '373',   // Theophany (Julian)
  '020201': '373',   // Meeting of the Lord
  '032501': '543',   // Annunciation
  '080601': '543',   // Transfiguration
  '081501': '373',   // Dormition
  '091401': 'F0',    // Elevation of Cross
  '092101': 'F6',    // Nativity of Theotokos
  '010701': '373',   // Synaxis of John the Baptist
  '070701': '373',   // Nativity of John the Baptist
  '082901': '373',   // Beheading of John the Baptist
};

async function loadLife(lang: LanguageCode, cid: string): Promise<LifeData | null> {
  const cacheKey = `${lang}/${cid}`;
  if (lifeCache.has(cacheKey)) return lifeCache.get(cacheKey)!;
  try {
    const bundleName = /^(0[1-9]|1[0-2])\d+/.test(cid) ? cid.substring(0, 2) : `misc/${cid.charAt(0)}`;
    async function tryFetch(prefix: string): Promise<Record<string, unknown> | null> {
      return DataCache.fetch<Record<string, unknown>>(`/data/${prefix}/lives/${bundleName}.json`);
    }
    let bundle = await tryFetch(lang);
    if (!bundle && lang !== 'cu') {
      bundle = await tryFetch('cu');
    }
    if (!bundle) {
      lifeCache.set(cacheKey, null);
      return null;
    }
    const life = (bundle[cid] || null) as LifeData | null;
    if (!life) {
      lifeCache.set(cacheKey, null);
      return null;
    }

    // Merge rank from cu life if language-specific life lacks it
    if (!life.rank && lang !== 'cu') {
      try {
        const cuBundle = await DataCache.fetch<Record<string, unknown>>(`/data/cu/lives/${bundleName}.json`);
        if (cuBundle) {
          const cuLife = cuBundle[cid] as LifeData | undefined;
          if (cuLife?.rank) life.rank = cuLife.rank;
        }
      } catch {}
    }

    // Merge scripture from shared lives index (one HTTP request for all)
    const index = await loadSharedScriptureIndex();
    if (index && index[cid]) {
      const raw = index[cid];
      const sharedArr = (Array.isArray(raw) ? raw : [raw]) as LifeData['scripture'];
      if (sharedArr && sharedArr.length > 0) {
        if (life.scripture) {
          const existing = Array.isArray(life.scripture) ? life.scripture : [life.scripture];
          life.scripture = [...existing, ...sharedArr] as LifeData['scripture'];
        } else {
          life.scripture = sharedArr;
        }
      }
    }

    lifeCache.set(cacheKey, life);
    return life;
  } catch {
    lifeCache.set(cacheKey, null);
    return null;
  }
}

async function loadCommemoration(sharedId: string): Promise<CommemorationData | null> {
  try {
    const resp = await fetch(`/data/shared/commemorations/${sharedId}.json`);
    if (!resp.ok) return null;
    const ct = resp.headers.get('content-type');
    if (ct && ct.includes('text/html')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function getPeriodName(life: LifeData | undefined): string {
  if (!life?.name) return '';
  return life.name.nominative || life.name.short || '';
}

function getShortFeastName(life: LifeData | undefined, shared: CommemorationData | null | undefined): string {
  if (life?.name?.short) return life.name.short;
  if (life?.name?.short) return life.name.short;
  return getCommsName(shared);
}

function getCommsName(shared: CommemorationData | null | undefined): string {
  if (!shared?.NAME) return '';
  if (typeof shared.NAME === 'object' && 'Long' in shared.NAME) {
    return shared.NAME.Long || shared.NAME.ShortN || '';
  }
  if (typeof shared.NAME === 'object' && 'text' in shared.NAME) {
    return (shared.NAME as { text: string }).text || '';
  }
  return '';
}

async function loadMenaion(lang: LanguageCode, month: number, day: number): Promise<unknown[]> {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const dateKey = `${mm}-${dd}`;
  try {
    // Try lang-specific bundle first
    let bundle = await loadMenaionBundle(lang);
    if (!bundle && lang !== 'cu') {
      bundle = await loadMenaionBundle('cu');
    }
    if (bundle && bundle[dateKey]) {
      const arr = bundle[dateKey];
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  } catch {
    return [];
  }
}

async function loadTriodionData(): Promise<Record<string, unknown>> {
  if (cachedTriodion) return cachedTriodion;
  try {
    const resp = await fetch('/data/shared/calendar/triodion.json');
    if (!resp.ok) return {};
    const ct = resp.headers.get('content-type');
    if (ct && ct.includes('text/html')) return {};
    cachedTriodion = await resp.json();
    return cachedTriodion!;
  } catch {
    return {};
  }
}

async function loadTriodionFile(index: number): Promise<unknown[]> {
  const data = await loadTriodionData();
  const key = String(index).padStart(2, '0');
  const entry = data[key];
  return entry ? [entry] : [];
}

async function loadPentecostarionData(): Promise<Record<string, unknown>> {
  if (cachedPentecostarion) return cachedPentecostarion;
  try {
    const resp = await fetch('/data/shared/calendar/pentecostarion.json');
    if (!resp.ok) return {};
    const ct = resp.headers.get('content-type');
    if (ct && ct.includes('text/html')) return {};
    cachedPentecostarion = await resp.json();
    return cachedPentecostarion!;
  } catch {
    return {};
  }
}

async function loadPentecostarionFile(index: number): Promise<unknown[]> {
  const data = await loadPentecostarionData();
  const key = String(index).padStart(2, '0');
  const entry = data[key];
  return entry ? [entry] : [];
}

export class CalendarView {
  private container: HTMLElement;
  private currentDate: JDate;
  private onDateChange: (date: JDate) => void;
  private skipCids: Set<string> = new Set();
  private language: LanguageCode;
  private t: ReturnType<typeof getTranslations>;
  private calendarType: 'julian' | 'gregorian';

  constructor(container: HTMLElement, date: JDate, onDateChange: (d: JDate) => void, language: LanguageCode = 'en', calendarType: 'julian' | 'gregorian' = 'julian') {
    this.container = container;
    this.currentDate = date;
    this.onDateChange = onDateChange;
    this.language = language;
    this.t = getTranslations(language);
    this.calendarType = calendarType;
  }

  private getFontClass(): string {
    try {
      const stored = localStorage.getItem('ponomar-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        let cuFont = settings.cuFont || '';
        if (settings.usePonomarFont !== undefined) {
          cuFont = settings.usePonomarFont ? 'Ponomar' : '';
        }
        const useFont = cuFont !== '' || settings.usePonomarFont !== false;
        return (this.language === 'cu') && useFont ? fontClass(cuFont) : '';
      }
    } catch {}
    return this.language === 'cu' ? 'font-ponomar' : '';
  }

  /** Prefetch lives data for a given month to warm the cache. */
  private prefetchMonth(month: number): void {
    const mm = String(month).padStart(2, '0');
    const lang = this.language;
    const url = `/data/${lang}/lives/${mm}.json`;
    DataCache.fetch(url).catch(() => {});
  }

  /** Lightweight dRank computation for calendar grid highlighting */
  private getDayRank(date: JDate, julianYear: number): number {
    const month = date.getMonth();
    const day = date.getDay();
    const pascha = Paschalion.getPascha(julianYear);
    const nday = date.difference(pascha);
    const isBrightWeek = nday >= 0 && nday <= 6;

    if (month === 9 && day === 14) return 6;
    if (month === 8 && day === 29) return 6;
    if (nday === 0) return 8;
    if (nday === 49) return 8;
    if (nday === 39) return 8;
    if (nday === -7) return 8;
    if (month === 12 && day === 25) return 6;
    if (month === 1 && day === 6) return 6;
    if (month === 8 && day === 15) return 6;
    if (month === 3 && day === 25) return 6;
    if (nday >= -48 && nday < 0) return 3;
    if (isBrightWeek || (nday >= 49 && nday <= 56)) return 5;
    return 0;
  }

  render() {
    const useGregorian = this.calendarType === 'gregorian';
    const fnClass = this.getFontClass();

    function daysInGregorianMonth(m: number, y: number): number {
      const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (m === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return 29;
      return dim[m - 1];
    }

    const julianYear = this.currentDate.getYear();
    const julianMonth = this.currentDate.getMonth();
    const julianDay = this.currentDate.getDay();

    // Grid display params: Julian or Gregorian based on setting
    let month: number, year: number, day: number;
    if (useGregorian) {
      const g = this.currentDate.toGregorian();
      year = g.getFullYear();
      month = g.getMonth() + 1;
      day = g.getDate();
    } else {
      year = julianYear;
      month = julianMonth;
      day = julianDay;
    }

    let firstDow: number;
    let daysInMonth: number;
    if (useGregorian) {
      const firstJulian = JDate.fromGregorianParts(year, month, 1);
      firstDow = firstJulian.getDayOfWeek();
      daysInMonth = daysInGregorianMonth(month, year);
    } else {
      const firstOfMonth = new JDate(month, 1, year);
      firstDow = firstOfMonth.getDayOfWeek();
      daysInMonth = JDate.maxDaysInMonth(month, year);
    }

    const fasts = Paschalion.getFasts(julianYear);

    let gridHtml = '';
    let col = 0;

    gridHtml += this.t.calendar.dayNames.map(d =>
      `<div class="text-center text-xs font-bold text-red py-1">${d}</div>`
    ).join('');

    for (let i = 0; i < firstDow; i++) {
      gridHtml += '<div></div>';
      col++;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      let fast = 0;
      let isSelected = false;
      let isToday = false;
      let dayRank = 0;
      if (useGregorian) {
        const jDate = JDate.fromGregorianParts(year, month, d);
        const dayDoy = jDate.getDoy();
        fast = fasts[dayDoy] ?? 0;
        isSelected = d === day;
        dayRank = this.getDayRank(jDate, julianYear);
        const todayGreg = JDate.today().toGregorian();
        isToday = todayGreg.getFullYear() === year && todayGreg.getMonth() + 1 === month && todayGreg.getDate() === d;
      } else {
        const date = new JDate(month, d, year);
        const dayDoy = date.getDoy();
        fast = fasts[dayDoy] ?? 0;
        isSelected = d === day;
        dayRank = this.getDayRank(date, julianYear);
        isToday = date.equals(JDate.today());
      }

      let classes = 'day-cell p-1 text-center text-sm cursor-pointer rounded transition-colors ';
      if (isSelected) classes += 'bg-navy text-parchment font-bold ';
      else if (isToday) classes += 'bg-gold/20 font-bold ';
      else if (dayRank >= 6) classes += 'bg-red-100 text-red-800 font-bold ';
      else if (fast === 1) classes += 'bg-purple-50 ';
      else if (fast === 2) classes += 'bg-blue-50 ';

      gridHtml += `<div class="${classes}" data-day="${d}">${d}</div>`;

      col++;
    }

    const computed = computeDay(this.currentDate);



    // Get Gregorian date for display
    const gregorianDate = this.currentDate.toGregorian();
    const gregorianDayName = this.t.calendar.dayNamesFull[gregorianDate.getDay()];
    const gregorianStr = `${gregorianDayName}, ${gregorianDate.getDate()} ${this.t.calendar.monthsGenitive[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()} г.`;
    // Julian date (church calendar)
    const julianDayName = this.t.calendar.dayNamesFull[this.currentDate.getDayOfWeek()];
    // Anno Mundi year (Old Slavonic year = year + 5508)
    const annoMundi = julianYear + 5508;
    const julianStr = `${julianDayName}, ${this.currentDate.getDay()} ${this.t.calendar.monthsGenitive[this.currentDate.getMonth() - 1]}, год ${julianYear} ${this.t.calendar.fromYear}, ${annoMundi} ${this.t.calendar.fromAdam}`;

    this.container.innerHTML = `
      <div class="flex flex-col lg:flex-row h-full">
        <div class="lg:w-80 bg-parchment-dark border-r border-gold/20 p-4 flex-shrink-0">
          <div class="flex items-center justify-between mb-4">
            <button id="prev-month" class="p-2 hover:bg-navy/10 rounded">◀</button>
            <span class="font-bold text-navy">${this.t.calendar.months[month - 1]} ${year}</span>
            <button id="next-month" class="p-2 hover:bg-navy/10 rounded">▶</button>
          </div>

          <div class="grid grid-cols-7 gap-0.5 text-xs">
            ${gridHtml}
          </div>

          </div>

        </div>

        <div class="flex-1 p-6 overflow-auto">
          <div class="max-w-2xl lg:max-w-3xl xl:max-w-4xl">
            <h2 class="text-base font-bold text-red mb-1">
              ${julianStr}
            </h2>
            <div class="text-sm text-navy-light mb-2">
              ${this.t.calendar.gregorianDate[0].toLowerCase() + this.t.calendar.gregorianDate.slice(1)}: ${gregorianStr}
            </div>

            <div id="day-title" class="mb-4"></div>

            <div id="commemorations-panel" class="mb-4 p-4 bg-white/50 border border-gold/20 rounded-lg ${fnClass}">
              <h3 class="font-bold text-red mb-2">${this.t.calendar.commemorations}</h3>
              <p class="text-sm text-navy-light italic">${this.t.loading}</p>
            </div>

            <div id="fasting-panel" class="mb-4 p-4 bg-white/50 border border-gold/20 rounded-lg ${fnClass}">
              <h3 class="font-bold text-red mb-2">${this.t.calendar.fastingRule}</h3>
              <p class="text-sm italic text-navy-light">${this.t.loading}</p>
            </div>

            <div id="readings-panel" class="mb-4 p-4 bg-white/50 border border-gold/20 rounded-lg ${fnClass}">
              <h3 class="font-bold text-red mb-2">${this.t.calendar.readings}</h3>
              <p class="text-sm text-navy-light italic">${this.t.loading}</p>
            </div>

            <div id="services-panel" class="mb-4 border-t border-gold/20 pt-6"></div>
          </div>
        </div>
      </div>
    `;

    // Load data asynchronously
    this.loadData(computed);

    // Event listeners
    document.getElementById('prev-month')?.addEventListener('click', () => {
      const prevMonth = month <= 1 ? 12 : month - 1;
      const prevYear = month <= 1 ? year - 1 : year;
      if (useGregorian) {
        const prevDay = Math.min(day, daysInGregorianMonth(prevMonth, prevYear));
        this.currentDate = JDate.fromGregorianParts(prevYear, prevMonth, prevDay);
      } else {
        const prevDay = Math.min(day, JDate.maxDaysInMonth(prevMonth, prevYear));
        this.currentDate = new JDate(prevMonth, prevDay, prevYear);
      }
      this.onDateChange(this.currentDate);
      this.render();
    });

    document.getElementById('next-month')?.addEventListener('click', () => {
      const nextMonth = month >= 12 ? 1 : month + 1;
      const nextYear = month >= 12 ? year + 1 : year;
      if (useGregorian) {
        const nextDay = Math.min(day, daysInGregorianMonth(nextMonth, nextYear));
        this.currentDate = JDate.fromGregorianParts(nextYear, nextMonth, nextDay);
      } else {
        const nextDay = Math.min(day, JDate.maxDaysInMonth(nextMonth, nextYear));
        this.currentDate = new JDate(nextMonth, nextDay, nextYear);
      }
      this.onDateChange(this.currentDate);
      this.render();
    });

    this.container.querySelectorAll('.day-cell').forEach(el => {
      el.addEventListener('click', () => {
        const d = parseInt(el.getAttribute('data-day')!, 10);
        if (useGregorian) {
          this.currentDate = JDate.fromGregorianParts(year, month, d);
        } else {
          this.currentDate = new JDate(month, d, year);
        }
        this.onDateChange(this.currentDate);
        this.render();
      });
    });
  }

  private async loadData(computed: { dayInfo: import('../core/types').DayInfo; evalContext: import('../core/types').EvalContext }) {
    const { dayInfo, evalContext } = computed;
    this.skipCids = new Set();

    // Load fasting
    const fastingPeriods = await loadFastingPeriods();
    const fastingResult = evaluateFasting(fastingPeriods, evalContext, this.language);
    const fastingPanel = document.getElementById('fasting-panel');
    if (fastingPanel) {
      fastingPanel.innerHTML = `
        <h3 class="font-bold text-red mb-2">${this.t.calendar.fastingRule}</h3>
        <p class="text-sm">${fastingResult.description || this.t.notAvailable}</p>
      `;
    }

    // Load commemorations from menaion (language-specific)
    const menaion = await loadMenaion(this.language, dayInfo.month, dayInfo.day);

    // Load triodion/pentecostarion entries (shared, language-agnostic)
    let calendarEntries: unknown[] = [];
    if (dayInfo.triodionFile !== null) {
      calendarEntries = await loadTriodionFile(dayInfo.triodionFile);
    } else if (dayInfo.pentecostarionFile !== null) {
      calendarEntries = await loadPentecostarionFile(dayInfo.pentecostarionFile);
    }

    // Collect CIds from all entries
    const cids: string[] = [];
    const allEntries = [...calendarEntries, ...menaion];
    for (const entry of allEntries) {
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>;
        if (e.id) cids.push(String(e.id));
      }
    }

    // Load commemorations from BOTH sources:
    // 1. Lives (language-specific, for names & life text)
    // 2. Shared commemorations (for readings, rank, troparion/kontakion)
    // Use CID_TO_SHARED_COMM mapping for known feast days
    const livesData: Map<string, LifeData> = new Map();
    const sharedComms: Map<string, CommemorationData> = new Map();
    
    for (const cid of cids.slice(0, 30)) {
      const [life, shared] = await Promise.all([
        loadLife(this.language, cid),
        loadCommemoration(CID_TO_SHARED_COMM[cid] || cid),
      ]);
      if (life) livesData.set(cid, life);
      if (shared) sharedComms.set(cid, shared);
    }

    // Build day title: period description + tone + great feast
    const titleEl = document.getElementById('day-title');
    if (titleEl) {
      let periodName = '';
      let periodCid = '';
      let feastCid = '';
      let feastName = '';
      let feastRank = 0;

      // Pass 1: Find period name from primary calendar entry (id 9[0-38]xxxx)
      for (const entry of calendarEntries) {
        const e = entry as Record<string, unknown>;
        const cid = String(e.id || '');
        if (!cid || !/^9[0-38]\d{2}$/.test(cid)) continue;
        const name = getPeriodName(livesData.get(cid)) || getCommsName(sharedComms.get(cid));
        if (!name) continue;
        periodName = name;
        periodCid = cid;
        break;
      }

      // Pass 2: Find great feast (rank >= 6) from all entries
      for (const entry of allEntries) {
        const e = entry as Record<string, unknown>;
        const cid = String(e.id || '');
        if (!cid || this.skipCids.has(cid)) continue;
        const life = livesData.get(cid);
        const shared = sharedComms.get(cid);
        const name = getShortFeastName(life, shared);
        if (!name) continue;
        const rank = parseInt(shared?.CHURCH?.Rank || '0', 10) || (life?.rank as number) || 0;
        if (rank >= 6 && rank > feastRank) {
          feastRank = rank;
          feastName = name;
          feastCid = cid;
        }
      }

      // Skip period CId from commemorations if not a feast
      if (periodCid && !feastCid) this.skipCids.add(periodCid);

      if (!periodName) periodName = this.t.calendar.rankLabels[dayInfo.dRank] ?? '';

      if (periodName) {
        const tone = dayInfo.Tone;
        const toneSuffix = tone > 0 ? `; ${this.t.calendar.tone}${tone}` : '';
        const feastSuffix = feastName && feastCid !== periodCid ? `; ${feastName}` : '';
        const titleColor = feastName ? 'text-red-700' : 'text-navy';
        titleEl.innerHTML = `<span class="text-base font-semibold ${titleColor} italic">${periodName}${toneSuffix}${feastSuffix}</span>`;
      }

      if (feastCid) this.skipCids.add(feastCid);
    }

    // Load commemorations for each CId
    const commPanel = document.getElementById('commemorations-panel');
    if (commPanel) {
      if (cids.length === 0) {
        commPanel.innerHTML = `
          <h3 class="font-bold text-red mb-2">${this.t.calendar.commemorations}</h3>
          <p class="text-sm text-navy-light italic">${this.t.calendar.noCommemorations}</p>
        `;
      } else {
        const commHtmlParts: string[] = [];
        for (const cid of cids.slice(0, 15)) {
          if (this.skipCids.has(cid)) continue;
          // Prefer shared commemoration for name (feast days), fallback to lives (saints)
          const shared = sharedComms.get(cid);
          const life = livesData.get(cid);
          
          const lifeText = life?.life?.text || (shared?.LIFE as any)?.text || '';

          let name = '';
          if (life?.name) {
            name = life.name.nominative || life.name.short || '';
          }
          if (!name && shared?.NAME) {
            if (typeof shared.NAME === 'object' && 'Long' in shared.NAME) {
              name = shared.NAME.Long || shared.NAME.ShortN || '';
            } else if (typeof shared.NAME === 'object' && 'text' in shared.NAME) {
              name = (shared.NAME as { text: string }).text || '';
            }
          }
          if (name) {
            // Determine rank: shared commemoration rank > day rank
            const rank = parseInt(shared?.CHURCH?.Rank || '0', 10) || (life?.rank as number) || dayInfo.dRank || 0;
            const icon = this.t.calendar.rankIcons[rank] || '';
            const iconHtml = icon ? `<span class="font-slavonic text-lg mr-1">${icon}</span>` : '';
            const lifeHtml = lifeText
              ? `<div class="life-text hidden mt-2 p-3 bg-white border border-gold/20 rounded text-sm leading-relaxed max-h-60 overflow-y-auto">${lifeText}</div>`
              : '';
            commHtmlParts.push(
              `<div class="comm-item">
                <div class="text-sm font-medium ${lifeText ? 'text-blue-600 underline cursor-pointer hover:text-blue-800' : 'text-navy'}">${iconHtml}${name}</div>
                ${lifeHtml}
              </div>`
            );
          }
        }
        if (commHtmlParts.length > 0) {
          commPanel.innerHTML = `
            <h3 class="font-bold text-red mb-2">${this.t.calendar.commemorations}</h3>
            <div class="space-y-1">${commHtmlParts.join('')}</div>
          `;
          commPanel.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.comm-item');
            if (item) {
              const lifeDiv = item.querySelector('.life-text') as HTMLElement;
              if (lifeDiv) lifeDiv.classList.toggle('hidden');
            }
          });
        } else {
          commPanel.innerHTML = `
            <h3 class="font-bold text-red mb-2">${this.t.calendar.commemorations}</h3>
            <p class="text-sm text-navy-light italic">${this.t.calendar.noCommemorations}</p>
          `;
        }
      }
    }

    // Collect readings grouped by service
    const readingsGroups: ReadingsGroup[] = [];
    const addReading = (service: string, reading: string, purpose: string) => {
      const group = findOrCreateGroup(readingsGroups, service);
      const ref = formatReadingRef(reading, this.language);
      if (!group.items.some(i => i.ref === ref)) {
        group.items.push({ ref, purpose });
      }
    };
    const isPeriodCid = (cid: string): boolean => /^9[0-38]\d{2}$/.test(cid);
    const readingContext = (shortName: string, cid?: string): string => {
      if (!shortName) return '';
      if (cid && isPeriodCid(cid)) return '';
      return ` (${shortName})`;
    };
    await loadBookAbbrevs(this.language);
    for (const [cid, shared] of sharedComms) {
      if (shared?.SCRIPTURE) {
        const shortN = typeof shared.NAME === 'object' && 'ShortN' in shared.NAME ? (shared.NAME.ShortN || '') : '';
        const tag = readingContext(shortN, cid);
        const scripts = Array.isArray(shared.SCRIPTURE) ? shared.SCRIPTURE : [shared.SCRIPTURE];
        for (const s of scripts) {
          if (s && typeof s === 'object') {
            const sr = s as Record<string, string>;
            if (sr.Reading) {
              const svc = readingsTypeToService(sr.Type || '', this.t);
              addReading(svc, sr.Reading, tag);
            }
          }
        }
      }
    }
    // Also load readings from saint lives (from services structure)
    for (const [cid, life] of livesData) {
      const shortName = life?.name?.short || '';
      const tag = readingContext(shortName, cid);

      if (life?.services) {
        const svcMap = life.services as Record<string, Record<string, Record<string, string>>>;
        for (const [svcName, scriptures] of Object.entries(svcMap)) {
          for (const [, sc] of Object.entries(scriptures)) {
            const reading = sc.Reading || sc.reading;
            if (!reading) continue;
            const scType = sc.Type || sc.type || '';
            const svc = svcNameToService(svcName, scType, this.t);
            addReading(svc, reading, tag);
          }
        }
      } else if (life?.scripture) {
        for (const s of life.scripture) {
          const sc = s as Record<string, string>;
          const reading = sc.Reading || sc.reading;
          if (reading) {
            const svc = readingsTypeToService(sc.Type || sc.type || '', this.t);
            addReading(svc, reading, tag);
          }
        }
      }
    }
    // Also check calendar entries for Scripture
    for (const entry of allEntries) {
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>;
        if (e.Scripture && typeof e.Scripture === 'object') {
          const s = e.Scripture as Record<string, string>;
          if (s.Reading) {
            const svc = readingsTypeToService(s.Type || '', this.t);
            addReading(svc, s.Reading, '');
          }
        }
      }
    }

    const readingsPanel = document.getElementById('readings-panel');
    if (readingsPanel) {
      if (readingsGroups.length === 0) {
        readingsPanel.innerHTML = `
          <h3 class="font-bold text-red mb-2">${this.t.calendar.readings}</h3>
          <p class="text-sm text-navy-light italic">${this.t.calendar.noReadings}</p>
        `;
      } else {
        const sorted = [...readingsGroups].sort((a, b) => {
          const ai = SERVICE_ORDER.indexOf(a.service);
          const bi = SERVICE_ORDER.indexOf(b.service);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });
        const groupsHtml = sorted.map(g => {
          // Group consecutive items with same purpose; tag only on last of each group
          let refs = '';
          for (let i = 0; i < g.items.length; i++) {
            const item = g.items[i];
            const next = g.items[i + 1];
            if (i > 0) refs += this.t.calendar.readSep;
            refs += item.ref;
            if (!next || next.purpose !== item.purpose) {
              refs += item.purpose;
            }
          }
          return `<div class="text-sm text-navy"><strong>${g.service}</strong>${this.t.calendar.colon}${refs}</div>`;
        }).join('');
        readingsPanel.innerHTML = `
          <h3 class="font-bold text-red mb-2">${this.t.calendar.readings}</h3>
          <div class="space-y-1">${groupsHtml}</div>
        `;
      }
    }

    // Load services
    const svcPanel = document.getElementById('services-panel');
    if (svcPanel) {
      svcPanel.innerHTML = '';
      try {
        const svcView = new ServiceView(svcPanel, this.currentDate, this.language);
        await svcView.render(false);
      } catch {
        svcPanel.innerHTML = `<p class="text-sm text-navy-light italic">${this.t.loading}</p>`;
      }
    }

    // Prefetch current and adjacent month's lives data for faster navigation
    const currentMonth = this.currentDate.getMonth();
    const prevMonth = currentMonth <= 1 ? 12 : currentMonth - 1;
    const nextMonth = currentMonth >= 12 ? 1 : currentMonth + 1;
    this.prefetchMonth(currentMonth);
    this.prefetchMonth(prevMonth);
    this.prefetchMonth(nextMonth);
  }
}