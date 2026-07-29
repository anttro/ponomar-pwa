/**
 * Service view — displays assembled liturgical services.
 * Loads XML templates (converted to JSON) and assembles them with
 * dynamic Var nodes from Octoecheos tone data.
 */

import { JDate } from '../core/jdate';
import { computeDay } from '../core/day-computer';
import { assembleService, type ServiceContext } from '../core/service-assembler';
import { evalBool } from '../core/evaluator';
import type { EvalContext, ServiceNode } from '../core/types';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { loadSettings, fontClass } from './settings-view';

interface ServiceDef {
  id: string;
  name: string;
  serviceType: string;
  template: string;
  description: string;
  titleNode: ServiceNode;
}

function title(value: string, header?: string, source?: string, comment?: string): ServiceNode {
  return { type: 'TITLE', value, header: header ?? value, source, comment };
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class ServiceView {
  private container: HTMLElement;
  private currentDate: JDate;
  private evalContext: EvalContext;
  private language: LanguageCode;
  private t: ReturnType<typeof getTranslations>;
  private jsonCache = new Map<string, Record<string, unknown>[]>();
  private nodeCache = new Map<string, ServiceNode[]>();
  private notFound = new Set<string>();
  private bibleCache = new Map<string, string>();
  private livesCache = new Map<string, Record<string, Record<string, Record<string, unknown>>>>();
  private commandCache = new Map<string, string>();
  private timesCache = new Map<string, { cmd: string; value: string }[]>();
  private activeService: string | null = null;

  constructor(container: HTMLElement, date: JDate, language: LanguageCode = 'en') {
    this.container = container;
    this.currentDate = date;
    this.evalContext = computeDay(date).evalContext;
    this.language = language;
    this.t = getTranslations(language);
  }

  private getFontClass(): string {
    const settings = loadSettings();
    return (this.language === 'cu' || this.language === 'ru') && settings.cuFont !== undefined ? fontClass(settings.cuFont) : '';
  }

  private get serviceLang(): string {
    return this.language === 'ru' ? 'cu' : this.language;
  }

  async render(standalone = true) {
    const computed = computeDay(this.currentDate);
    const { dayInfo } = computed;

    const availableServices = this.getAvailableServices(dayInfo);
    const fontClass = this.getFontClass();

    const contentClass = `bg-white/50 border border-gold/20 rounded-lg p-6 ${this.activeService ? 'min-h-[300px]' : ''} ${fontClass}`;

    const tabHtml = `
      <h3 class="font-bold text-navy mb-3">${this.t.services.title}</h3>
      <div class="flex flex-wrap gap-1 mb-6 border-b border-gold/20">
        ${availableServices.map(s => `
          <button
            class="service-tab px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap
              ${this.activeService === s.id
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-navy-light hover:text-navy hover:border-gold/50'}"
            data-service="${s.id}"
          >${s.name}</button>
        `).join('')}
      </div>

      <div id="service-content" class="${contentClass}">
        <p class="text-navy-light italic">${this.t.services.selectService}</p>
      </div>
    `;

    this.container.innerHTML = standalone
      ? `<div class="p-6 max-w-4xl xl:max-w-6xl mx-auto">
          <h2 class="text-2xl font-bold text-navy mb-2">${this.t.services.title}</h2>
          <p class="text-navy-light mb-4">
            ${this.currentDate.toString()}
            ${dayInfo.isLent ? this.t.services.greatLent : ''}
            ${dayInfo.isBrightWeek ? this.t.services.brightWeek : ''}
            ${dayInfo.isApostlesFast ? this.t.services.apostlesFast : ''}
            ${dayInfo.isDormitionFast ? this.t.services.dormitionFast : ''}
            ${dayInfo.isNativityFast ? this.t.services.nativityFast : ''}
            ${dayInfo.Tone > 0 ? `${this.t.services.tone}${dayInfo.Tone}` : ''}
          </p>
          ${tabHtml}
        </div>`
      : tabHtml;

    this.container.querySelectorAll('.service-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const serviceId = btn.getAttribute('data-service')!;
        const service = availableServices.find(s => s.id === serviceId);
        if (service) {
          this.activeService = serviceId;
          this.container.querySelectorAll('.service-tab').forEach(t => {
            const id = t.getAttribute('data-service');
            if (id === serviceId) {
              t.className = 'service-tab px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap border-gold text-navy font-bold';
            } else {
              t.className = 'service-tab px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap border-transparent text-navy-light hover:text-navy';
            }
          });
          this.loadService(service);
        }
      });
    });
  }

  private getAvailableServices(dayInfo: import('../core/types').DayInfo): ServiceDef[] {
    const services: ServiceDef[] = [];

    services.push({
      id: 'primes', name: this.t.services.serviceNames.primes, serviceType: 'PRIMES',
      template: 'Prime',
      description: this.t.services.serviceDescriptions.primes,
      titleNode: title('Primes1', this.t.services.serviceNames.primes, 'PrimeSource'),
    });

    services.push({
      id: 'third', name: this.t.services.serviceNames.third, serviceType: 'TERCE',
      template: 'ThirdHour',
      description: this.t.services.serviceDescriptions.third,
      titleNode: title('Third1', this.t.services.serviceNames.third),
    });

    services.push({
      id: 'sixth', name: this.t.services.serviceNames.sixth, serviceType: 'SEXTE',
      template: 'SixthHour',
      description: this.t.services.serviceDescriptions.sixth,
      titleNode: title('Sixth1', this.t.services.serviceNames.sixth),
    });

    services.push({
      id: 'ninth', name: this.t.services.serviceNames.ninth, serviceType: 'NONE',
      template: 'NinthHour',
      description: this.t.services.serviceDescriptions.ninth,
      titleNode: title('Ninth1', this.t.services.serviceNames.ninth),
    });

    services.push({
      id: 'vespers', name: this.t.services.serviceNames.vespers, serviceType: 'VESPERS',
      template: 'Vespers',
      description: this.t.services.serviceDescriptions.vespers,
      titleNode: title('Vespers1', this.t.services.serviceNames.vespers, 'VesperSource'),
    });

    services.push({
      id: 'liturgy', name: this.t.services.serviceNames.liturgy, serviceType: 'LITURGY',
      template: 'DivineLiturgy',
      description: this.t.services.serviceDescriptions.liturgy,
      titleNode: title('DivineLiturgyTitle', this.t.services.serviceNames.liturgy, 'DivineLiturgySource'),
    });

    if (dayInfo.dRank >= 6) {
      services.push({
        id: 'royalhours', name: this.t.services.serviceNames.royalhours, serviceType: 'ROYALHOURS',
        template: 'RoyalHours',
        description: this.t.services.serviceDescriptions.royalhours,
        titleNode: title('RoyalHours1', this.t.services.serviceNames.royalhours),
      });
    }

    return services;
  }

  private async loadToneData(serviceType: string): Promise<{ troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string } | null> {
    const computed = computeDay(this.currentDate);
    const { dayInfo } = computed;
    const tone = dayInfo.Tone;
    const dow = dayInfo.dow;
    const mm = String(dayInfo.month).padStart(2, '0');
    const dd = String(dayInfo.day).padStart(2, '0');
    const dateKey = `${mm}-${dd}`;

    let result: { troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string } | null = null;

    if (tone > 0 && tone <= 8) {
      const toneNum = tone === 8 ? 0 : tone;
      const weekday = WEEKDAY_NAMES[dow];

      try {
        const tryFetch = async (lang: string) => {
          const url = `/data/${lang}/services/octoecheos/tone${toneNum}/${weekday.toLowerCase()}.json`;
          const resp = await fetch(url);
          if (!resp.ok) return null;
          const nodes: ServiceNode[] = await resp.json();
          for (const node of nodes) {
            if (node.type === serviceType && node.cmd) {
              if (evalBool(node.cmd as string, this.evalContext)) {
                return {
                  troparion1: node.troparion1 as string | undefined,
                  kontakion1: node.kontakion1 as string | undefined,
                  theotokion1: node.theotokion1 as string | undefined,
                  prokimenon1: node.prokimenon1 as string | undefined,
                  alleluia1: node.alleluia1 as string | undefined,
                };
              }
            }
          }
          return null;
        };

        result = await tryFetch(this.serviceLang);
        if (!result && this.serviceLang !== 'cu') result = await tryFetch('cu');
        if (!result) result = await tryFetch('shared');
      } catch { /* fall through to menologion */ }
    }

    // Menologion fallback when Octoecheos has no valid entry
    if (!result) {
      try {
        const tryLoad = async (url: string): Promise<{ cid: string }[] | null> => {
          try {
            const resp = await fetch(url);
            if (!resp.ok) return null;
            const all = await resp.json();
            if (Array.isArray(all)) return all.map((e: Record<string, unknown>) => ({ cid: String(e.id ?? '') }));
            const entries = all[dateKey] as Record<string, unknown>[] | undefined;
            if (Array.isArray(entries)) return entries.map((e: Record<string, unknown>) => ({ cid: String(e.id ?? '') }));
            return null;
          } catch { return null; }
        };

        const allEntries: { cid: string }[] = [];

        const menaionEntries = await tryLoad(`/data/${this.serviceLang}/menaion-bundle.json`);
        if (menaionEntries) allEntries.push(...menaionEntries);

        // Load from merged calendar files
        const loadCalendarEntry = async (file: string, index: number): Promise<{ cid: string }[] | null> => {
          try {
            const resp = await fetch(`/data/shared/calendar/${file}.json`);
            if (!resp.ok) return null;
            const data = await resp.json();
            const key = String(index).padStart(2, '0');
            const entry = data[key];
            return entry ? [{ cid: String(entry.id ?? '') }] : null;
          } catch { return null; }
        };

        if (dayInfo.triodionFile !== null) {
          const triodion = await loadCalendarEntry('triodion', dayInfo.triodionFile);
          if (triodion) allEntries.push(...triodion);
        }
        if (dayInfo.pentecostarionFile !== null) {
          const pent = await loadCalendarEntry('pentecostarion', dayInfo.pentecostarionFile);
          if (pent) allEntries.push(...pent);
        }

        const TONE_NUM = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'];
        for (const entry of allEntries) {
          if (!entry.cid) continue;
          try {
            const shmResp = await fetch(`/data/shared/commemorations/${entry.cid}.json`);
            if (!shmResp.ok) continue;
            const shm = await shmResp.json();
            const troparion = shm.TROPARION as { Tone?: string; text?: string } | undefined;
            const kontakion = shm.KONTAKION as { Tone?: string; text?: string } | undefined;
            if (troparion?.text || kontakion?.text) {
              const key = `MEN_${entry.cid}`;

              if (troparion?.text) {
                const tn = TONE_NUM[parseInt(troparion.Tone ?? '1', 10)] ?? troparion.Tone ?? '1';
                this.jsonCache.set(`/data/${this.serviceLang}/services/CommonPrayers/TROPARION/${key}.json`, [
                  { type: 'HEADER', value: `Тропа́рь, гла́съ ${tn}` },
                  { type: 'TEXT', value: troparion.text },
                ]);
              }

              if (kontakion?.text) {
                const tn = TONE_NUM[parseInt(kontakion.Tone ?? '1', 10)] ?? kontakion.Tone ?? '1';
                this.jsonCache.set(`/data/${this.serviceLang}/services/CommonPrayers/KONTAKION/${key}.json`, [
                  { type: 'HEADER', value: `Конда́къ, гла́съ ${tn}` },
                  { type: 'TEXT', value: kontakion.text },
                ]);
              }

              result = { troparion1: key, kontakion1: key };
              break;
            }
          } catch { continue; }
        }
      } catch { /* fall through to tertiary fallback */ }
    }

    // Tertiary fallback: known feasts not yet in shared commemorations
    if (!result) {
      const MENAION_TROP: Record<string, { troparion1: string; kontakion1: string }> = {
        '03-23': { troparion1: 'PROPHET', kontakion1: 'PROPHET' },
        '03-22': { troparion1: 'PROPHET', kontakion1: 'PROPHET' },
      };
      const m = MENAION_TROP[dateKey];
      if (m) result = m;
    }

    return result;
  }

  private generateVarNodes(toneData: { troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string } | null, serviceType: string): Map<string, ServiceNode[]> {
    const varNodes = new Map<string, ServiceNode[]>();

    const prefix: Record<string, string> = { PRIMES: '', TERCE: '3', SEXTE: '6', NONE: '9', VESPERS: 'V', LITURGY: 'L' };
    const p = prefix[serviceType] ?? '';

    if (toneData?.troparion1) {
      const key1 = `PTrop${p}1`;
      varNodes.set(key1, [{
        type: 'CREATE',
        what: `TROPARION/${toneData.troparion1}`,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    if (toneData?.kontakion1) {
      const key = p ? `PKont${p}` : 'PKont1';
      varNodes.set(key, [{
        type: 'CREATE',
        what: `KONTAKION/${toneData.kontakion1}`,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    if (toneData?.theotokion1) {
      const key = `PTheot${p}1`;
      varNodes.set(key, [{
        type: 'CREATE',
        what: `THEOTOKION/${toneData.theotokion1}`,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    if (toneData?.prokimenon1) {
      const key = `PProk${p}1`;
      varNodes.set(key, [{
        type: 'CREATE',
        what: toneData.prokimenon1,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    if (toneData?.alleluia1) {
      const key = `PAllel${p}1`;
      varNodes.set(key, [{
        type: 'CREATE',
        what: toneData.alleluia1,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    return varNodes;
  }

  private async loadService(service: ServiceDef) {
    const contentEl = document.getElementById('service-content');
    if (!contentEl) return;

    contentEl.innerHTML = `<p class="text-navy-light italic">${this.t.loading}</p>`;

    try {
      const templateNodes = await this.fetchServiceNodes(`Services/${service.template}.json`);
      if (!templateNodes) {
        contentEl.innerHTML = `<p class="text-navy-light">Service template not found</p>`;
        return;
      }

      const toneData = await this.loadToneData(service.serviceType);
      const varNodes = this.generateVarNodes(toneData, service.serviceType);

      // Load Epistle and Gospel readings from commemoration
      const loadReadings = async () => {
        const ids: string[] = [];
        const mm = String(this.currentDate.getMonth()).padStart(2, '0');
        const dd = String(this.currentDate.getDay()).padStart(2, '0');
        const dateKey = `${mm}-${dd}`;
        try {
          const resp = await fetch(`/data/${this.serviceLang}/menaion-bundle.json`);
          if (resp.ok) {
            const bundle = await resp.json();
            const entries = bundle[dateKey];
            if (entries) {
              for (const e of entries) {
                if (e.id) ids.push(String(e.id));
              }
            }
          }
        } catch {}
        for (const cid of ids) {
          try {
            const resp = await fetch(`/data/shared/commemorations/${cid}.json`);
            if (!resp.ok) continue;
            const data = await resp.json();
            const scripts = data.SCRIPTURE;
            if (!Array.isArray(scripts)) continue;
            let epistlePassage = '';
            let gospelPassage = '';
            for (const s of scripts) {
              const r = s.Reading || '';
              if (s.Type === 'apostol' && r && !epistlePassage) epistlePassage = r;
              if (s.Type === 'gospel' && r && !gospelPassage) gospelPassage = r;
            }
            if (epistlePassage) {
              varNodes.set('EpistleReading', [{
                type: 'BIBLE',
                verses: epistlePassage,
                who: 'R',
                redfirst: true,
                newline: true,
              }]);
            }
            if (gospelPassage) {
              varNodes.set('GospelReading', [{
                type: 'BIBLE',
                verses: gospelPassage,
                who: 'D',
                redfirst: true,
                newline: true,
              }]);
            }
            if (epistlePassage || gospelPassage) break;
          } catch {}
        }
      };
      await loadReadings();

      const nodes: ServiceNode[] = [...templateNodes];

      const computed = computeDay(this.currentDate);
      const isMenologionTone = toneData?.troparion1?.startsWith('PROPHET') || toneData?.troparion1?.startsWith('MEN_');
      const dayPFlag2 = computed.dayInfo.PFlag2;
      const evalCtx: EvalContext = {
        ...this.evalContext,
        PFlag1: 0,
        PFlag2: isMenologionTone && dayPFlag2 !== 0 ? 0 : dayPFlag2,
        PFlag3: 0,
        PS: 1,
      };

      const ctx: ServiceContext = {
        evalCtx,
        lang: this.serviceLang,
        t: this.t,
        fetchBibleText: (book, passage, showVerseNumbers, verseNewLine) => this.fetchBibleText(book, passage, showVerseNumbers, verseNewLine),
        fetchLives: (id) => this.fetchLives(id),
        fetchCommandText: (name) => this.fetchCommandText(name),
        resolveTimes: (times) => this.resolveTimes(times),
        fetchText: this.createFetchText(),
        fetchPrayerNodes: this.createFetchPrayerNodes(),
        fetchServiceNodes: async (path: string): Promise<ServiceNode[] | null> => {
          const varMatch = path.match(/Services\/Var\/(\w+)\.xml$/);
          if (varMatch) {
            return varNodes.get(varMatch[1]) || null;
          }
          return this.fetchServiceNodes(path);
        },
      };

      const { html } = await assembleService(nodes, ctx);

      if (html.trim()) {
        const fontClass = this.getFontClass();
        contentEl.className = `prose prose-sm max-w-none liturgical-text ${fontClass}`;
        contentEl.innerHTML = html;
      } else {
        contentEl.className = 'prose prose-sm max-w-none liturgical-text';
        contentEl.innerHTML = `
          <div class="text-center py-8">
            <p class="text-navy-light mb-2">${this.t.services.serviceProducedNoOutput}</p>
            <p class="text-xs text-navy-light">${nodes.length} ${this.t.services.nodesAssembled}</p>
          </div>
        `;
      }
    } catch (err) {
      contentEl.innerHTML = `
        <div class="text-center py-8">
          <p class="text-navy-light mb-2">${this.t.services.errorLoading}</p>
          <p class="text-xs text-navy-light">${err instanceof Error ? err.message : this.t.error}</p>
        </div>
      `;
    }
  }

  private bibleVersion(lang: string): string {
    const map: Record<string, string> = {
      en: 'kjv',
      cu: 'elis',
      fr: 'ls',
      el: 'spt',
      la: 'vulgate',
      zh: 'cuv',
      ar: 'svd',
    };
    return map[lang] || 'kjv';
  }

  private async fetchBibleText(book: string, passage: string, showVerseNumbers = true, verseNewLine = false): Promise<string> {
    const cacheKey = `${this.language}/${book}/${passage}/${showVerseNumbers ? 'vn' : 'nn'}/${verseNewLine ? 'vb' : 'nvb'}`;
    const cached = this.bibleCache.get(cacheKey);
    if (cached) return cached;

    const version = this.bibleVersion(this.serviceLang);
    const tryFetch = async (lang: string): Promise<string | null> => {
      const url = `/data/${lang}/bible/${version}/${book}.text`;
      if (this.notFound.has(url)) return null;
      const resp = await fetch(url);
      if (!resp.ok) { this.notFound.add(url); return null; }
      const ct = resp.headers.get('content-type');
      if (ct && ct.includes('text/html')) { this.notFound.add(url); return null; }
      return resp.text();
    };

    let text = await tryFetch(this.serviceLang);
    if (!text && this.serviceLang !== 'cu') text = await tryFetch('cu');
    if (!text) text = await tryFetch('shared');
    if (!text) return '';

    const lines = text.split('\n');
    // Parse comma-separated passage parts, each potentially: Chapter[:VerseStart[-VerseEnd]]
    const parts = passage.split(',');
    const ranges: { chapter: number; vStart: number; vEnd: number }[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      let chapter: number;
      let verseSpec: string;

      if (trimmed.includes(':')) {
        const colonIdx = trimmed.indexOf(':');
        chapter = parseInt(trimmed.substring(0, colonIdx), 10);
        verseSpec = trimmed.substring(colonIdx + 1);
      } else {
        // Bare number = chapter number (e.g. "50" = Psalm 50, read all verses)
        chapter = parseInt(trimmed, 10);
        verseSpec = '1-';
      }

      let vStart: number;
      let vEnd: number;

      if (verseSpec.includes('-')) {
        const dashIdx = verseSpec.indexOf('-');
        vStart = parseInt(verseSpec.substring(0, dashIdx), 10);
        const after = verseSpec.substring(dashIdx + 1);
        // Check if after contains chapter:verse (cross-chapter range)
        if (after.includes(':')) {
          const afterColon = after.indexOf(':');
          const nextChapter = parseInt(after.substring(0, afterColon), 10);
          vEnd = parseInt(after.substring(afterColon + 1), 10);
          ranges.push({ chapter, vStart, vEnd: -1 }); // all remaining verses in current chapter
          chapter = nextChapter;
          vStart = 1;
          vEnd = vEnd;
        } else {
          vEnd = after ? parseInt(after, 10) : -1; // empty end = all remaining verses
        }
      } else {
        vStart = parseInt(verseSpec, 10);
        vEnd = vStart;
      }

      ranges.push({ chapter, vStart, vEnd });
    }

    // Scan file and collect matching verses
    let result = '';
    let curChapter = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const chapterMatch = trimmed.match(/^#(\d+)/);
      if (chapterMatch) {
        curChapter = parseInt(chapterMatch[1], 10);
        continue;
      }

      const verseMatch = trimmed.match(/^(\d+)\|(.*)/);
      if (verseMatch) {
        const curVerse = parseInt(verseMatch[1], 10);
        const verseText = verseNewLine ? verseMatch[2].replace(/^ /, '') : verseMatch[2];

        for (const range of ranges) {
          if (range.chapter !== curChapter) continue;
          if (curVerse < range.vStart) continue;
          if (range.vEnd !== -1 && curVerse > range.vEnd) continue;
          if (result) result += verseNewLine ? '<br>' : ' ';
          result += showVerseNumbers ? `<sup>${curVerse}</sup>${verseText}` : verseText;
          break;
        }
      } else if (trimmed.startsWith('*')) {
        if (result) result += ' ';
        result += trimmed;
      }
    }

    this.bibleCache.set(cacheKey, result);
    return result;
  }

  private async fetchLives(id: string): Promise<Record<string, Record<string, Record<string, unknown>>> | null> {
    const cacheKey = `${this.language}/${id}`;
    const cached = this.livesCache.get(cacheKey);
    if (cached) return cached;

    const bundleName = /^(0[1-9]|1[0-2])\d+/.test(id) ? id.substring(0, 2) : 'misc';
    const tryFetch = async (lang: string): Promise<Record<string, Record<string, Record<string, unknown>>> | null> => {
      const url = `/data/${lang}/lives/${bundleName}.json`;
      if (this.notFound.has(url)) return null;
      const resp = await fetch(url);
      if (!resp.ok) { this.notFound.add(url); return null; }
      const ct = resp.headers.get('content-type');
      if (ct && ct.includes('text/html')) { this.notFound.add(url); return null; }
      const bundle = await resp.json() as Record<string, Record<string, unknown>>;
      const entry = bundle[id] as { services?: Record<string, Record<string, Record<string, unknown>>> } | undefined;
      return entry?.services || null;
    };

    let result = await tryFetch(this.serviceLang);
    if (!result && this.serviceLang !== 'cu') result = await tryFetch('cu');
    if (!result) result = await tryFetch('shared');
    if (result) this.livesCache.set(cacheKey, result);
    return result;
  }

  private async fetchCommandText(name: string): Promise<string> {
    const cacheKey = `${this.language}/Command/${name}`;
    const cached = this.commandCache.get(cacheKey);
    if (cached) return cached;

    const tryFetch = async (lang: string): Promise<string | null> => {
      const url = `/data/${lang}/services/Command/${name}.json`;
      if (this.notFound.has(url)) return null;
      const resp = await fetch(url);
      if (!resp.ok) { this.notFound.add(url); return null; }
      const ct = resp.headers.get('content-type');
      if (ct && ct.includes('text/html')) { this.notFound.add(url); return null; }
      const json = await resp.json() as Record<string, unknown>[];
      return json
        .filter(n => n.type === 'TEXT')
        .map(n => String(n.value ?? ''))
        .filter(Boolean)
        .join(' ') || null;
    };

    let result = await tryFetch(this.serviceLang);
    if (!result && this.serviceLang !== 'cu') result = await tryFetch('cu');
    if (!result) result = await tryFetch('shared');
    if (result) this.commandCache.set(cacheKey, result);
    return result || '';
  }

  private async resolveTimes(times: number): Promise<string> {
    const cacheKey = this.language;
    let rules = this.timesCache.get(cacheKey);
    if (!rules) {
      const tryFetch = async (lang: string): Promise<{ cmd: string; value: string }[] | null> => {
        const url = `/data/${lang}/commands/Times.json`;
        if (this.notFound.has(url)) return null;
        const resp = await fetch(url);
        if (!resp.ok) { this.notFound.add(url); return null; }
        const ct = resp.headers.get('content-type');
        if (ct && ct.includes('text/html')) { this.notFound.add(url); return null; }
        const json = await resp.json() as { DATA: { TIMES: { '@_Value': string; '@_Cmd': string }[] } };
        const arr = json?.DATA?.TIMES;
        if (!Array.isArray(arr)) return null;
        return arr.map(r => ({ value: r['@_Value'], cmd: r['@_Cmd'] }));
      };
      let loaded = await tryFetch(this.serviceLang);
      if (!loaded && this.serviceLang !== 'cu') loaded = await tryFetch('cu');
      if (!loaded) loaded = await tryFetch('shared');
      if (loaded) {
        this.timesCache.set(cacheKey, loaded);
        rules = loaded;
      }
    }

    if (!rules) return `${times}×`;

    for (const rule of rules) {
      if (rule.cmd) {
        if (evalBool(rule.cmd, { Times: times } as EvalContext)) {
          return rule.value.replace('^#', String(times));
        }
      } else {
        return rule.value.replace('^#', String(times));
      }
    }
    return `${times}×`;
  }

  private createFetchText() {
    return async (path: string): Promise<string | null> => {
      const wantsHeader = path.endsWith('.header');
      const basePath = wantsHeader ? path.slice(0, -'.header'.length) : path;

      const resolvePath = (lang: string): string | null => {
        let fetchPath = basePath;
        if (fetchPath.startsWith('Services/')) {
          fetchPath = fetchPath.slice('Services/'.length);
          // Handle different path patterns
          if (fetchPath.startsWith('CommonPrayers/')) {
            // CommonPrayers -> prayers
            fetchPath = 'prayers/' + fetchPath.slice('CommonPrayers/'.length);
          } else if (fetchPath.startsWith('Text/')) {
            // Text -> texts
            fetchPath = 'texts/' + fetchPath.slice('Text/'.length);
          } else if (fetchPath.startsWith('Command/')) {
            // Command -> commands
            fetchPath = 'commands/' + fetchPath.slice('Command/'.length);
          } else if (fetchPath.startsWith('Header/')) {
            // Header -> headers
            fetchPath = 'headers/' + fetchPath.slice('Header/'.length);
          } else if (fetchPath.startsWith('Var/')) {
            // Var -> var (lowercase)
            fetchPath = 'var/' + fetchPath.slice('Var/'.length);
          } else if (fetchPath.startsWith('Octoecheos/')) {
            // Octoecheos -> octoecheos
            fetchPath = 'octoecheos/' + fetchPath.slice('Octoecheos/'.length);
          }
          fetchPath = fetchPath.replace('.xml', '.json');
        }
        return `/data/${lang}/services/${fetchPath}`;
      };

      const fetchJson = async (url: string): Promise<Record<string, unknown>[] | null> => {
        if (this.notFound.has(url)) return null;
        const cached = this.jsonCache.get(url);
        if (cached) return cached;
        try {
          const resp = await fetch(url);
          if (!resp.ok) { this.notFound.add(url); return null; }
          const ct = resp.headers.get('content-type');
          if (ct && ct.includes('text/html')) { this.notFound.add(url); return null; }
          const json = JSON.parse(await resp.text());
          if (Array.isArray(json)) {
            this.jsonCache.set(url, json);
            return json;
          }
          this.notFound.add(url);
          return null;
        } catch {
          this.notFound.add(url);
          return null;
        }
      };

      const filterNodes = (json: Record<string, unknown>[], header: boolean): string | null => {
        if (header) {
          return json
            .filter(n => n.type === 'HEADER')
            .map(n => String(n.value ?? ''))
            .filter(Boolean)
            .join(' ') || null;
        }
        return json
          .filter(n => n.type === 'TEXT')
          .map(n => String(n.value ?? '').replace(/\n/g, ' '))
          .filter(Boolean)
          .join('<br>') || null;
      };

      try {
        let url = resolvePath(this.serviceLang);
        let json = url ? await fetchJson(url) : null;
        if (!json && this.serviceLang !== 'cu') {
          url = resolvePath('cu');
          json = url ? await fetchJson(url) : null;
        }
        if (!json) {
          url = resolvePath('shared');
          json = url ? await fetchJson(url) : null;
        }
        return json ? filterNodes(json, wantsHeader) : null;
      } catch (err) {
        console.error('Service fetchText error:', err);
        return null;
      }
     };
   }

   private createFetchPrayerNodes() {
     return async (path: string): Promise<ServiceNode[] | null> => {
       const resolvePath = (lang: string): string | null => {
         let fetchPath = path;
         if (fetchPath.startsWith('Services/')) {
           fetchPath = fetchPath.slice('Services/'.length);
           if (fetchPath.startsWith('CommonPrayers/')) {
             fetchPath = 'prayers/' + fetchPath.slice('CommonPrayers/'.length);
           }
           fetchPath = fetchPath.replace('.xml', '.json');
         }
         return `/data/${lang}/services/${fetchPath}`;
       };

       const tryFetch = async (url: string): Promise<ServiceNode[] | null> => {
         if (this.notFound.has(url)) return null;
         const cached = this.nodeCache.get(url);
         if (cached) return cached;
         try {
           const resp = await fetch(url);
           if (!resp.ok) { this.notFound.add(url); return null; }
           const ct = resp.headers.get('content-type') || '';
           if (ct.includes('text/html')) { this.notFound.add(url); return null; }
           const nodes = await resp.json();
           if (Array.isArray(nodes)) {
             this.nodeCache.set(url, nodes);
             return nodes;
           }
           this.notFound.add(url);
           return null;
         } catch {
           this.notFound.add(url);
           return null;
         }
       };

       try {
         let url = resolvePath(this.serviceLang);
         if (url) {
           const result = await tryFetch(url);
           if (result) return result;
         }
         if (this.serviceLang !== 'cu') {
           const fbUrl = resolvePath('cu');
           if (fbUrl) {
             const result = await tryFetch(fbUrl);
             if (result) return result;
           }
         }
         const sharedUrl = resolvePath('shared');
         if (sharedUrl) {
           return await tryFetch(sharedUrl);
         }
         return null;
       } catch (err) {
         console.error('Service fetchPrayerNodes error:', err);
         return null;
       }
     };
   }

   private async fetchServiceNodes(path: string): Promise<ServiceNode[] | null> {
    const resolvePath = (lang: string): string | null => {
      let fetchPath = path;
      if (fetchPath.startsWith('Services/')) {
        fetchPath = fetchPath.slice('Services/'.length);
        // Service templates are in templates/ subdirectory
        // But if path contains a subdirectory, don't add templates/ prefix
        if (!fetchPath.includes('/')) {
          fetchPath = 'templates/' + fetchPath;
        } else {
          // Handle subdirectories like Var/, CommonPrayers/, etc.
          if (fetchPath.startsWith('CommonPrayers/')) {
            fetchPath = 'prayers/' + fetchPath.slice('CommonPrayers/'.length);
          } else if (fetchPath.startsWith('Text/')) {
            fetchPath = 'texts/' + fetchPath.slice('Text/'.length);
          } else if (fetchPath.startsWith('Command/')) {
            fetchPath = 'commands/' + fetchPath.slice('Command/'.length);
          } else if (fetchPath.startsWith('Header/')) {
            fetchPath = 'headers/' + fetchPath.slice('Header/'.length);
          } else if (fetchPath.startsWith('Var/')) {
            fetchPath = 'var/' + fetchPath.slice('Var/'.length);
          } else if (fetchPath.startsWith('Octoecheos/')) {
            fetchPath = 'octoecheos/' + fetchPath.slice('Octoecheos/'.length);
          }
        }
        fetchPath = fetchPath.replace('.xml', '.json');
      }
      return `/data/${lang}/services/${fetchPath}`;
    };
    const tryFetch = async (url: string): Promise<ServiceNode[] | null> => {
      if (this.notFound.has(url)) return null;
      const cached = this.nodeCache.get(url);
      if (cached) return cached;
      try {
        const resp = await fetch(url);
        if (!resp.ok) { this.notFound.add(url); return null; }
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('text/html')) { this.notFound.add(url); return null; }
        const nodes = await resp.json();
        this.nodeCache.set(url, nodes);
        return nodes;
      } catch { this.notFound.add(url); return null; }
    };
    let url = resolvePath(this.serviceLang);
    if (url) {
      const result = await tryFetch(url);
      if (result) return result;
    }
    if (this.serviceLang !== 'cu') {
      const fbUrl = resolvePath('cu');
      if (fbUrl) {
        const result = await tryFetch(fbUrl);
        if (result) return result;
      }
    }
    const sharedUrl = resolvePath('shared');
    if (sharedUrl) {
      return await tryFetch(sharedUrl);
    }
    return null;
  }
}
