/**
 * Service view — displays assembled liturgical services.
 * Loads XML templates (converted to JSON) and assembles them with
 * dynamic Var nodes from Octoecheos tone data.
 */

import { JDate } from '../core/jdate';
import { computeDay } from '../core/day-computer';
import { assembleService, type ServiceContext } from '../core/service-assembler';
import { evalBool } from '../core/evaluator';
import type { CanonData, GreatCanonPart, EvalContext, ServiceNode } from '../core/types';
import { getTranslations, type LanguageCode } from '../core/i18n';
import {
  TRIODION_NDAY, BRIGHT_WEEK, PENTECOSTARION, FIRST_WEEK, MENAION_FEAST,
  HOLY_WEEK, holyWeekVarName, type ServiceTabDef,
} from '../core/service-tabs';
import { loadSettings, fontClass } from './settings-view';
import { DataCache } from '../core/data-cache';

interface ServiceDef {
  id: string;
  name: string;
  serviceType: string;
  template: string;
  description: string;
  titleNode: ServiceNode;
  divider?: boolean;
  menaionDayIndex?: number;
  menaionDateKey?: string;
  triodionIndex?: number;
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
  private menaionDayCount = new Map<string, number>();

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

    // Load the daily Menaion index (date -> section count) for the Служба дня tabs
    try {
      const index = await DataCache.fetchWithFallback<Record<string, number>>('/data/shared/menaion-daily/index.json');
      if (index) {
        for (const [dk, n] of Object.entries(index)) {
          this.menaionDayCount.set(dk, n);
        }
      }
    } catch { /* keep empty cache */ }

    const availableServices = this.getAvailableServices(dayInfo);
    const fontClass = this.getFontClass();

    const contentClass = `bg-surface/50 border border-gold/20 rounded-lg p-4 ${this.activeService ? 'min-h-[300px]' : ''} ${fontClass}`;

    const tabHtml = `
      <h3 class="font-bold text-red mb-2">${this.t.services.title}</h3>
      <div class="flex flex-wrap gap-2 mb-3">
        ${availableServices.map(s => `
          <button
            class="service-tab text-base transition-colors
              ${this.activeService === s.id
                ? 'border border-gold bg-gold/10 text-navy font-bold rounded-lg px-3 py-1'
                : 'border border-gold/20 bg-surface/50 text-navy hover:border-gold/50 rounded-lg px-3 py-1'}"
            data-service="${s.id}"
          >${s.name}</button>
        `).join('')}
      </div>

      <div id="service-content" class="${contentClass}">
        <p class="text-navy-light italic">${this.t.services.selectService}</p>
      </div>
    `;

    this.container.innerHTML = standalone
      ? `<div class="p-4 max-w-4xl xl:max-w-6xl mx-auto">
          <h2 class="text-2xl font-bold text-red mb-2">${this.t.services.title}</h2>
          <p class="text-navy-light mb-2">
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
              t.className = 'service-tab text-base transition-colors border border-gold bg-gold/10 text-navy font-bold rounded-lg px-3 py-1';
            } else {
              t.className = 'service-tab text-base transition-colors border border-gold/20 bg-surface/50 text-navy hover:border-gold/50 rounded-lg px-3 py-1';
            }
          });
          this.loadService(service);
        }
      });
    });
  }

  private getAvailableServices(dayInfo: import('../core/types').DayInfo): ServiceDef[] {
    const special: ServiceDef[] = [];
    const daily: ServiceDef[] = [];

    // Triodion movable days (by nday): Pre-Lent Sundays + Lent Sundays
    // (the ones not already covered: week 1, Marias Standing, Palm Sunday, Holy Week)
    const triodionIdx = TRIODION_NDAY[dayInfo.nday];
    if (triodionIdx) {
      special.push({
        id: `triodion-${triodionIdx}`,
        name: this.t.triodion.sections[triodionIdx - 1],
        serviceType: 'TRIODION',
        template: 'Triodion',
        description: this.t.triodion.title,
        titleNode: title('Triodion1', this.t.triodion.sections[triodionIdx - 1]),
        triodionIndex: triodionIdx,
      });
    }

    // Daily Menaion: the day's proper service (menaion-daily/{MM-DD}/{NN}.json)
    const mmDay = `${String(dayInfo.month).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}`;
    const menaionDayCount = this.menaionDayCount.get(mmDay) ?? -1;
    if (menaionDayCount === -1) {
      // Cache lookup is populated in render(); fall back to 0 (fetched async)
    }
    for (let i = 1; i <= Math.max(0, menaionDayCount); i++) {
      special.push({
        id: `menaion-day-${i}`, name: i === 1 ? this.t.services.serviceNames.menaionDay : this.t.services.serviceNames.menaionDay,
        serviceType: 'MENAIONDAY',
        template: 'MenaionDay',
        description: this.t.services.serviceDescriptions.menaionDay,
        titleNode: title('MenaionDay1', this.t.services.serviceNames.menaionDay),
        menaionDayIndex: i,
        menaionDateKey: mmDay,
      });
    }

    daily.push({
      id: 'vespers', name: this.t.services.serviceNames.vespers, serviceType: 'VESPERS',
      template: 'Vespers',
      description: this.t.services.serviceDescriptions.vespers,
      titleNode: title('Vespers1', this.t.services.serviceNames.vespers, 'VesperSource'),
    });

    daily.push({
      id: 'ninth', name: this.t.services.serviceNames.ninth, serviceType: 'NONE',
      template: 'NinthHour',
      description: this.t.services.serviceDescriptions.ninth,
      titleNode: title('Ninth1', this.t.services.serviceNames.ninth),
    });

    daily.push({
      id: 'matins', name: this.t.services.serviceNames.matins, serviceType: 'MATINS',
      template: 'Matins',
      description: this.t.services.serviceDescriptions.matins,
      titleNode: title('Matins1', this.t.services.serviceNames.matins, 'MatinsSource'),
    });

    daily.push({
      id: 'primes', name: this.t.services.serviceNames.primes, serviceType: 'PRIMES',
      template: 'Prime',
      description: this.t.services.serviceDescriptions.primes,
      titleNode: title('Primes1', this.t.services.serviceNames.primes, 'PrimeSource'),
    });

    daily.push({
      id: 'third', name: this.t.services.serviceNames.third, serviceType: 'TERCE',
      template: 'ThirdHour',
      description: this.t.services.serviceDescriptions.third,
      titleNode: title('Third1', this.t.services.serviceNames.third),
    });

    daily.push({
      id: 'sixth', name: this.t.services.serviceNames.sixth, serviceType: 'SEXTE',
      template: 'SixthHour',
      description: this.t.services.serviceDescriptions.sixth,
      titleNode: title('Sixth1', this.t.services.serviceNames.sixth),
    });

    daily.push({
      id: 'liturgy', name: this.t.services.serviceNames.liturgy, serviceType: 'LITURGY',
      template: 'DivineLiturgy',
      description: this.t.services.serviceDescriptions.liturgy,
      titleNode: title('DivineLiturgyTitle', this.t.services.serviceNames.liturgy, 'DivineLiturgySource'),
    });

    if (dayInfo.dRank >= 6) {
      daily.push({
        id: 'royalhours', name: this.t.services.serviceNames.royalhours, serviceType: 'ROYALHOURS',
        template: 'RoyalHours',
        description: this.t.services.serviceDescriptions.royalhours,
        titleNode: title('RoyalHours1', this.t.services.serviceNames.royalhours),
      });
    }

    // Bright Week services (Pascha through Saturday)
    if (dayInfo.isBrightWeek) {
      const def = BRIGHT_WEEK[dayInfo.nday];
      if (def) {
        special.push(this.defToService(def));
      }
    }

    // Pentecostarion services (Antipascha through All Saints)
    if (dayInfo.pentecostarionFile !== null && dayInfo.nday > 6) {
      const pd = PENTECOSTARION[dayInfo.nday];
      if (pd) {
        special.push(this.defToService(pd));
      }
      // All Saints of Russia (appendix, same Sunday as All Saints)
      if (dayInfo.nday === 56) {
        special.push({
          id: 'russiansaints', name: this.t.services.serviceNames.russiansaints, serviceType: 'RUSSIANSAINTS',
          template: 'RussianSaints',
          description: this.t.services.serviceDescriptions.russiansaints,
          titleNode: title('RussianSaints1', this.t.services.serviceNames.russiansaints),
        });
      }
    }

    // First Week of Lent: complete daily cycle (Matins, Hours, Typica, Vespers, Compline)
    if (dayInfo.isLent && dayInfo.nday >= -48 && dayInfo.nday <= -43) {
      const fw = FIRST_WEEK[dayInfo.nday];
      if (fw) {
        special.push(this.defToService(fw));
      }
    }

    // Festal Menaion: Great feasts on fixed Julian dates (Typikon Ch. 47)
    const feast = MENAION_FEAST[`${dayInfo.month}-${dayInfo.day}`];
    if (feast) {
      special.push(this.defToService(feast));
    }
    // Movable Sundays of the Nativity season (dow-based)
    if (dayInfo.dow === 0 && dayInfo.month === 12) {
      let def: ServiceTabDef | null = null;
      if (dayInfo.day >= 11 && dayInfo.day <= 17) {
        def = HOLY_WEEK['FOREFATHERSSUNDAY'];
      } else if (dayInfo.day >= 18 && dayInfo.day <= 24) {
        def = HOLY_WEEK['HOLYFATHERSNATIVITY'];
      } else if (dayInfo.day >= 26 && dayInfo.day <= 31) {
        def = HOLY_WEEK['SUNDAYAFTERNATIVITY'];
      }
      if (def) {
        special.push(this.defToService(def));
      }
    }

    // Great Compline: Lenten weekdays (Mon-Thu)
    if (dayInfo.isLent && dayInfo.dow >= 1 && dayInfo.dow <= 4) {
      special.push({
        id: 'greatcompline', name: this.t.services.serviceNames.greatcompline, serviceType: 'GREATCOMPLINE',
        template: 'GreatCompline',
        description: this.t.services.serviceDescriptions.greatcompline,
        titleNode: title('GreatCompline1', this.t.services.serviceNames.greatcompline),
      });
    }

    // Standing of St. Mary of Egypt: Thursday of the 5th week of Great Lent
    if (dayInfo.isLent && dayInfo.nday === -17) {
      special.push({
        id: 'mariasstanding', name: this.t.services.serviceNames.mariasstanding, serviceType: 'MARIASSTANDING',
        template: 'MariasStanding',
        description: this.t.services.serviceDescriptions.mariasstanding,
        titleNode: title('MariasStanding1', this.t.services.serviceNames.mariasstanding),
      });
    }

    // Holy Week services
    if (dayInfo.isLent) {
      // Palm Sunday: Vespers + Matins
      if (dayInfo.nday === -7) {
        special.push(this.defToService(HOLY_WEEK['PALMSUNDAY']));
      }
      // Great Monday through Thursday: daily cycle (Matins, Hours, Typica, Vespers)
      const greatDay: Record<number, string> = {
        [-6]: 'GREATMONDAY', [-5]: 'GREATTUESDAY', [-4]: 'GREATWEDNESDAY', [-3]: 'GREATTHURSDAY',
      };
      const gd = greatDay[dayInfo.nday];
      if (gd) {
        special.push(this.defToService(HOLY_WEEK[gd]));
      }
      // Matins of the 12 Passion Gospels: Great Thursday evening (Great Friday Matins)
      if (dayInfo.nday === -3) {
        special.push(this.defToService(HOLY_WEEK['PASSIONGOSPELS']));
      }
      // Royal Hours of Great Friday
      if (dayInfo.nday === -2) {
        special.push(this.defToService(HOLY_WEEK['ROYALHOURSFRIDAY']));
      }
      // Lamentations Matins: Great Saturday Matins (served Friday night)
      if (dayInfo.nday === -1) {
        special.push(this.defToService(HOLY_WEEK['LAMENTATIONS']));
      }
      // Vespers of the Burial + cell Compline: Great Friday evening
      if (dayInfo.nday === -2) {
        special.push(this.defToService(HOLY_WEEK['BURIALVESPERS']));
      }
      // Holy Saturday: Hours, Vespers+Liturgy of St. Basil, Midnight Office
      if (dayInfo.nday === -1) {
        special.push(this.defToService(HOLY_WEEK['SATURDAYHOURS']));
        special.push(this.defToService(HOLY_WEEK['SATURDAYLITURGY']));
        special.push(this.defToService(HOLY_WEEK['SATURDAYMIDNIGHT']));
      }
    }

    if (special.length > 0 && daily.length > 0) {
      daily[0].divider = true;
    }
    return [...special, ...daily];
  }

  private defToService(def: ServiceTabDef): ServiceDef {
    const names = this.t.services.serviceNames as Record<string, string>;
    const descs = this.t.services.serviceDescriptions as Record<string, string>;
    return {
      id: def.id,
      name: names[def.id],
      serviceType: def.serviceType,
      template: def.template,
      description: descs[def.id],
      titleNode: title(`${def.template}1`, names[def.id]),
    };
  }

  private async loadToneData(serviceType: string): Promise<{ troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string; hypakoe1?: string } | null> {
    const computed = computeDay(this.currentDate);
    const { dayInfo } = computed;
    const tone = dayInfo.Tone;
    const dow = dayInfo.dow;
    const mm = String(dayInfo.month).padStart(2, '0');
    const dd = String(dayInfo.day).padStart(2, '0');
    const dateKey = `${mm}-${dd}`;

    let result: { troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string; hypakoe1?: string } | null = null;

    if (tone > 0 && tone <= 8) {
      const toneNum = tone === 8 ? 0 : tone;
      const weekday = WEEKDAY_NAMES[dow];

      try {
        const tryFetch = async (lang: string) => {
          const url = `/data/${lang}/services/octoecheos/tone${toneNum}/${weekday.toLowerCase()}.json`;
          const nodes = await DataCache.fetchWithFallback<ServiceNode[]>(url);
          if (!nodes) return null;
          for (const node of nodes) {
            if (node.type === serviceType) {
              if (!node.cmd || evalBool(node.cmd as string, this.evalContext)) {
                return {
                  troparion1: node.troparion1 as string | undefined,
                  kontakion1: node.kontakion1 as string | undefined,
                  theotokion1: node.theotokion1 as string | undefined,
                  prokimenon1: node.prokimenon1 as string | undefined,
                  alleluia1: node.alleluia1 as string | undefined,
                  hypakoe1: node.hypakoe1 as string | undefined,
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
            const all = await DataCache.fetchWithFallback<Record<string, unknown>[]>(url);
            if (!all) return null;
            if (Array.isArray(all)) return all.map((e: Record<string, unknown>) => ({ cid: String(e.id ?? '') }));
            const entries = (all as Record<string, unknown>)[dateKey] as Record<string, unknown>[] | undefined;
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
            const data = await DataCache.fetchWithFallback<Record<string, unknown>>(`/data/shared/calendar/${file}.json`);
            if (!data) return null;
            const key = String(index).padStart(2, '0');
            const entry = data[key] as { id?: unknown } | undefined;
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
            const shm = await DataCache.fetchWithFallback<Record<string, unknown>>(`/data/shared/commemorations/${entry.cid}.json`);
            if (!shm) continue;
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

  private async loadCanonData(tone: number): Promise<ServiceNode[] | null> {
    if (tone < 1 || tone > 8) return null;
    const toneNum = tone === 8 ? 0 : tone;
    const url = `/data/shared/services/canons/tone${toneNum}/sunday.json`;
    try {
      const canonData = await DataCache.fetchWithFallback<CanonData>(url);
      if (!canonData) return null;
      const ODE_SLAV = ['', 'а', 'в', 'г', 'д', 'є', 'ѕ', 'з', 'и', 'ѳ'];

      const nodes: ServiceNode[] = [];
      for (const ode of canonData.odes) {
        const slavNum = ODE_SLAV[ode.ode] ?? String(ode.ode);
        nodes.push({ type: 'HEADER', value: `Пѣснь ${slavNum}҃.` });

        for (const canon of ode.canons) {
          if (canon.irmos) {
            nodes.push({ type: 'HEADER', value: `Ірмосъ, гла́съ ${canonData.tone}:` });
            nodes.push({ type: 'TEXT', value: canon.irmos });
          }
          for (const trop of canon.troparia) {
            nodes.push({ type: 'TEXT', value: trop });
          }
          if (canon.theotokion) {
            nodes.push({ type: 'HEADER', value: 'Бг҃ородиченъ:' });
            nodes.push({ type: 'TEXT', value: canon.theotokion });
          }
        }
      }
      return nodes;
    } catch {
      return null;
    }
  }

  private async loadParacleteCanon(tone: number, dow: number): Promise<ServiceNode[] | null> {
    if (tone < 1 || tone > 8) return null;
    const WEEKDAY = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = WEEKDAY[dow] ?? '';
    if (!dayKey) return null;
    const url = `/data/shared/services/canons/paraclete/tone${tone}/${dayKey}.json`;
    return DataCache.fetchWithFallback<ServiceNode[]>(url);
  }

  private async loadMenaionDay(dateKey: string, index: number): Promise<ServiceNode[] | null> {
    const url = `/data/shared/menaion-daily/${dateKey}/${index}.json`;
    return DataCache.fetchWithFallback<ServiceNode[]>(url);
  }

  private async loadTriodion(index: number): Promise<ServiceNode[] | null> {
    const url = `/data/shared/triodion/${String(index).padStart(2, '0')}.json`;
    return DataCache.fetchWithFallback<ServiceNode[]>(url);
  }

  private async loadMariasStandingData(): Promise<ServiceNode[] | null> {
    const url = `/data/shared/services/marias-standing/full.json`;
    return DataCache.fetchWithFallback<ServiceNode[]>(url);
  }

  private async loadHolyWeekData(service: string): Promise<ServiceNode[] | null> {
    const url = `/data/shared/services/${service}/full.json`;
    return DataCache.fetchWithFallback<ServiceNode[]>(url);
  }

  private async loadGreatCanonData(): Promise<ServiceNode[] | null> {
    const computed = computeDay(this.currentDate);
    const { dayInfo } = computed;
    const nday = dayInfo.nday;
    // Determine which part of the Great Canon:
    // 1st week: nday -48 (Mon) to -45 (Thu) → parts 1-4
    // Other Lenten weekdays: default to part 1
    let part: number;
    if (nday >= -48 && nday <= -45) {
      part = nday + 49; // -48→1, -47→2, -46→3, -45→4
    } else {
      part = 1;
    }

    const url = `/data/shared/services/canons/great-canon/part${part}.json`;
    try {
      const canonData = await DataCache.fetchWithFallback<GreatCanonPart>(url);
      if (!canonData) return null;
      const ODE_SLAV = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃', 'ѳ҃'];
      const nodes: ServiceNode[] = [];

      nodes.push({ type: 'HEADER', value: 'Вели́кїй канѡ́нъ, гла́съ ѕ҃.' });
      nodes.push({ type: 'HEADER', value: 'Творе́нїе ст҃а́гѡ ѻ҆тца̀ на́шегѡ а҆ндре́а кри́тскагѡ.' });

      for (const ode of canonData.odes) {
        const slavNum = ODE_SLAV[ode.ode] ?? String(ode.ode);
        nodes.push({ type: 'HEADER', value: `Пѣ́снь ${slavNum}.` });

        // Irmos
        if (ode.irmos) {
          nodes.push({ type: 'HEADER', value: 'І҆рмо́съ:' });
          nodes.push({ type: 'TEXT', value: ode.irmos });
        }

        // Penitential troparia with refrain
        const refrain = 'Поми́лꙋй мѧ̀, бж҃е, поми́лꙋй мѧ̀.';
        for (const trop of ode.troparia) {
          nodes.push({ type: 'TEXT', value: `${trop}\nПрипѣ́въ: ${refrain}` });
        }

        // Trinity troparion
        if (ode.trinityTroparion) {
          nodes.push({ type: 'HEADER', value: 'Сла́ва, трⷪ҇ченъ:' });
          nodes.push({ type: 'TEXT', value: ode.trinityTroparion });
        }

        // Theotokion
        if (ode.theotokion) {
          nodes.push({ type: 'HEADER', value: 'И҆ ны́нѣ, бг҃оро́диченъ:' });
          nodes.push({ type: 'TEXT', value: ode.theotokion });
        }

        // Saint troparia (St. Mary of Egypt / St. Andrew)
        if (ode.saintTroparia && ode.saintTroparia.length > 0) {
          for (const saintTrop of ode.saintTroparia) {
            nodes.push({ type: 'TEXT', value: saintTrop });
          }
        }

        // Kontakion (after Ode 6)
        if (ode.kontakion) {
          nodes.push({ type: 'HEADER', value: 'Конда́къ, гла́съ ѕ҃:' });
          nodes.push({ type: 'TEXT', value: ode.kontakion });
        }
      }

      return nodes;
    } catch {
      return null;
    }
  }

  private generateVarNodes(toneData: { troparion1?: string; kontakion1?: string; theotokion1?: string; prokimenon1?: string; alleluia1?: string; hypakoe1?: string } | null, serviceType: string): Map<string, ServiceNode[]> {
    const varNodes = new Map<string, ServiceNode[]>();

    const prefix: Record<string, string> = { PRIMES: '', TERCE: '3', SEXTE: '6', NONE: '9', VESPERS: 'V', LITURGY: 'L', MATINS: 'U', GREATCOMPLINE: 'GC', MARIASSTANDING: 'MS', PASSIONGOSPELS: 'PG', ROYALHOURSFRIDAY: 'RF', LAMENTATIONS: 'LM', PALMSUNDAY: 'PS', GREATMONDAY: 'GM', GREATTUESDAY: 'GT', GREATWEDNESDAY: 'GW', GREATTHURSDAY: 'GTH', BURIALVESPERS: 'BV', SATURDAYHOURS: 'SH', SATURDAYLITURGY: 'SL', SATURDAYMIDNIGHT: 'SM', PASCHA: 'PA', BRIGHTMONDAY: 'BM', BRIGHTTUESDAY: 'BT', BRIGHTWEDNESDAY: 'BW', BRIGHTTHURSDAY: 'BTH', BRIGHTFRIDAY: 'BF', BRIGHTSATURDAY: 'BS', ANTIPASCHA: 'AP', MYRRHBEARERS: 'MB', PARALYTIC: 'PL', PREPOLOVENIE: 'PP', SAMARITAN: 'SA', BLINDMAN: 'BM', APODOSIS: 'AD', ASCENSION: 'AS', HOLYFATHERS: 'HF', PENTECOSTSATURDAY: 'PSA', PENTECOST: 'PE', HOLYSPIRIT: 'HS', ALLSAINTS: 'AL', RUSSIANSAINTS: 'RS', FIRSTWEEKMONDAY: 'FM', FIRSTWEEKTUESDAY: 'FT', FIRSTWEEKWEDNESDAY: 'FW', FIRSTWEEKTHURSDAY: 'FTH', FIRSTWEEKFRIDAY: 'FF', FIRSTWEEKSATURDAY: 'FS', NATIVITYTHEOTOKOS: 'NT', EXALTATION: 'EX', VVEDENIE: 'VV', NATIVITYHOURS: 'NH', NATIVITY: 'NA', THEOPHANYHOURS: 'TH', THEOPHANY: 'TP', SRETENIE: 'SR', ANNUNCIATION: 'AN', FORERUNNERBIRTH: 'FB', PETERPAUL: 'PP', TRANSFIGURATION: 'TR', DORMITION: 'DO', FORERUNNERBEHEADING: 'FH', SERGIUS: 'SE', JOHNTHEOLOGIANSEP: 'JT', POKROV: 'PO', AMBROSE: 'AM', SEVENTHCOUNCILFATHERS: 'SC', KAZAN: 'KZ', DEMETRIUS: 'DE', MICHAELSYNAXIS: 'MS', NICHOLAS: 'NI', CIRCUMCISION: 'CI', FINDINGHEAD1ST: 'F1', FORTYMARTYRS: 'FM', JOHNTHEOLOGIANMAY: 'JM', NICHOLASTRANSLATION: 'NT', FINDINGHEAD3RD: 'F3', VLADIMIR: 'VL', SIXCOUNCILFATHERS: 'XC', ELIJAH: 'EL', PANTELEIMON: 'PA', PROCESSIONCROSS: 'PC', FOREFATHERSSUNDAY: 'FD', HOLYFATHERSNATIVITY: 'HFN', SUNDAYAFTERNATIVITY: 'SAN' };
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

    if (toneData?.hypakoe1) {
      const key = `PHypak${p}1`;
      varNodes.set(key, [{
        type: 'CREATE',
        what: toneData.hypakoe1,
        who: '',
        header: true,
        redfirst: true,
        newline: true,
      }]);
    }

    // Exapostilarion uses Eothinon (11-week cycle), not tone
    if (serviceType === 'MATINS') {
      const computed = computeDay(this.currentDate);
      const eoth = computed.dayInfo.eothinon;
      if (eoth >= 1 && eoth <= 11) {
        const key = `PExapost${p}1`;
        varNodes.set(key, [{
          type: 'CREATE',
          what: `Exapostilarion${eoth}`,
          who: '',
          header: true,
          redfirst: true,
          newline: true,
        }]);
      }
    }

    // Troparion after Doxology: odd tones use TroparAfterDoxologyOdd, even use TroparAfterDoxologyEven
    if (serviceType === 'MATINS') {
      const computed = computeDay(this.currentDate);
      const tone = computed.dayInfo.Tone;
      const doxFile = (tone % 2 === 1) ? 'TroparAfterDoxologyOdd' : 'TroparAfterDoxologyEven';
      varNodes.set('PTropDoxU1', [{
        type: 'CREATE',
        what: doxFile,
        who: 'C',
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

    const prevHeight = contentEl.offsetHeight;
    if (prevHeight > 0) {
      contentEl.style.minHeight = prevHeight + 'px';
    }
    contentEl.innerHTML = `<p class="text-navy-light italic">${this.t.loading}</p>`;

    try {
      const templateNodes = await this.fetchServiceNodes(`Services/${service.template}.json`);
      if (!templateNodes) {
        contentEl.innerHTML = `<p class="text-navy-light">Service template not found</p>`;
        return;
      }

      const toneData = await this.loadToneData(service.serviceType);
      const varNodes = this.generateVarNodes(toneData, service.serviceType);

      // Load Matins canon data
      if (service.serviceType === 'MATINS') {
        const computed = computeDay(this.currentDate);
        const tone = computed.dayInfo.Tone;
        const dow = computed.dayInfo.dow;
        // Weekdays (Mon-Sat): use the Параклитика weekday canons; Sunday: Octoechos Sunday canon
        if (dow >= 1 && dow <= 6) {
          const paracleteNodes = await this.loadParacleteCanon(tone, dow);
          if (paracleteNodes) {
            varNodes.set('PCanonU', paracleteNodes);
          }
        } else {
          const canonNodes = await this.loadCanonData(tone);
          if (canonNodes) {
            varNodes.set('PCanonU', canonNodes);
          }
        }
      }

      // Load Daily Menaion service (Служба дня)
      if (service.serviceType === 'MENAIONDAY' && service.menaionDateKey && service.menaionDayIndex) {
        const dayNodes = await this.loadMenaionDay(service.menaionDateKey, service.menaionDayIndex);
        if (dayNodes) {
          varNodes.set('PMenaionDay', dayNodes);
        }
      }

      // Load Triodion movable-day service
      if (service.serviceType === 'TRIODION' && service.triodionIndex) {
        const triodionNodes = await this.loadTriodion(service.triodionIndex);
        if (triodionNodes) {
          varNodes.set('PTriodion', triodionNodes);
        }
      }

      // Load Great Canon data for Great Compline
      if (service.serviceType === 'GREATCOMPLINE') {
        const canonNodes = await this.loadGreatCanonData();
        if (canonNodes) {
          varNodes.set('PGreatCanon', canonNodes);
        }
      }

      // Load Standing of St. Mary of Egypt data
      if (service.serviceType === 'MARIASSTANDING') {
        const standingNodes = await this.loadMariasStandingData();
        if (standingNodes) {
          varNodes.set('PMariasStanding', standingNodes);
        }
      }

      // Load data-backed service content (Holy Week, Bright Week, feasts, first week)
      const hwDef = HOLY_WEEK[service.serviceType];
      if (hwDef && hwDef.dir) {
        const nodes = await this.loadHolyWeekData(hwDef.dir);
        if (nodes) varNodes.set(holyWeekVarName(hwDef), nodes);
      }

      // Load Epistle and Gospel readings from commemoration
      const loadReadings = async () => {
        const ids: string[] = [];
        const mm = String(this.currentDate.getMonth()).padStart(2, '0');
        const dd = String(this.currentDate.getDay()).padStart(2, '0');
        const dateKey = `${mm}-${dd}`;
        try {
          const bundle = await DataCache.fetchWithFallback<Record<string, unknown>>(`/data/${this.serviceLang}/menaion-bundle.json`);
          if (bundle) {
            const entries = bundle[dateKey];
            if (entries) {
              for (const e of entries as Record<string, unknown>[]) {
                if (e.id) ids.push(String(e.id));
              }
            }
          }
        } catch {}
        for (const cid of ids) {
          try {
            const data = await DataCache.fetchWithFallback<Record<string, unknown>>(`/data/shared/commemorations/${cid}.json`);
            if (!data) continue;
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
          const varMatch = path.match(/Services\/(?:Var\/)?(\w+)\.xml$/);
          if (varMatch && varNodes.has(varMatch[1])) {
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
            <p class="text-sm text-navy-light">${nodes.length} ${this.t.services.nodesAssembled}</p>
          </div>
        `;
      }
    } catch (err) {
      contentEl.innerHTML = `
        <div class="text-center py-8">
          <p class="text-navy-light mb-2">${this.t.services.errorLoading}</p>
          <p class="text-sm text-navy-light">${err instanceof Error ? err.message : this.t.error}</p>
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
      const text = await DataCache.fetchWithFallback<string>(url, 'text');
      if (!text) { this.notFound.add(url); return null; }
      return text;
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

    const bundleName = /^(0[1-9]|1[0-2])\d+/.test(id) ? id.substring(0, 2) : `misc/${id.charAt(0)}`;
    const tryFetch = async (lang: string): Promise<Record<string, Record<string, Record<string, unknown>>> | null> => {
      const url = `/data/${lang}/lives/${bundleName}.json`;
      if (this.notFound.has(url)) return null;
      const bundle = await DataCache.fetchWithFallback<Record<string, Record<string, unknown>>>(url);
      if (!bundle) { this.notFound.add(url); return null; }
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
      const url = `/data/${lang}/services/commands/${name}.json`;
      if (this.notFound.has(url)) return null;
      const json = await DataCache.fetchWithFallback<Record<string, unknown>[]>(url);
      if (!json) { this.notFound.add(url); return null; }
      return json
        .filter(n => n.type === 'TEXT' || n.type === 'text')
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
        const json = await DataCache.fetchWithFallback<{ DATA?: { TIMES?: { '@_Value': string; '@_Cmd': string }[] } }>(url);
        if (!json) { this.notFound.add(url); return null; }
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
        const json = await DataCache.fetchWithFallback<Record<string, unknown>[]>(url);
        if (Array.isArray(json)) {
          this.jsonCache.set(url, json);
          return json;
        }
        this.notFound.add(url);
        return null;
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
          .filter(n => n.type === 'TEXT' || n.type === 'text')
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
          const nodes = await DataCache.fetchWithFallback<ServiceNode[]>(url);
          if (Array.isArray(nodes)) {
            this.nodeCache.set(url, nodes);
            return nodes;
          }
          this.notFound.add(url);
          return null;
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
      const nodes = await DataCache.fetchWithFallback<ServiceNode[]>(url);
      if (!nodes) { this.notFound.add(url); return null; }
      this.nodeCache.set(url, nodes);
      return nodes;
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
