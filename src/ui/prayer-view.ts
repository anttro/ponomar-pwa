/**
 * Prayer view — personal prayers (Молитвослов) and canons/akathists.
 * Loads collection sections (HEADER/TEXT nodes) and renders them
 * with the shared service assembler.
 */

import { assembleService, type ServiceContext } from '../core/service-assembler';
import type { EvalContext, ServiceNode } from '../core/types';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { loadSettings, fontClass } from './settings-view';

export type PrayerCollection = 'prayer-rule' | 'akathists' | 'parimii' | 'horologion' | 'sbornik' | 'paraclete' | 'irmologion' | 'triodion';

interface PrayerSection {
  id: string;
  name: string;
  description: string;
}

export class PrayerView {
  private container: HTMLElement;
  private language: LanguageCode;
  private collection: PrayerCollection;
  private t: ReturnType<typeof getTranslations>;
  private activeSection: string | null = null;

  constructor(container: HTMLElement, language: LanguageCode, collection: PrayerCollection = 'prayer-rule') {
    this.container = container;
    this.language = language;
    this.collection = collection;
    this.t = getTranslations(language);
  }

  private getFontClass(): string {
    const settings = loadSettings();
    return (this.language === 'cu' || this.language === 'ru') && settings.cuFont !== undefined ? fontClass(settings.cuFont) : '';
  }

  private getSections(): PrayerSection[] {
    const s = this.t.prayer.sections;
    if (this.collection === 'triodion') {
      const T = this.t.triodion.sections;
      const IDS: string[] = [];
      for (let i = 1; i <= 37; i++) IDS.push(String(i).padStart(2, '0'));
      return IDS.map((id, i) => ({ id, name: T[i] ?? id, description: '' }));
    }
    if (this.collection === 'irmologion') {
      const I = this.t.irmologion.sections;
      const IDS = [
        'irmos-1', 'irmos-2', 'irmos-3', 'irmos-4', 'irmos-5', 'irmos-6', 'irmos-7', 'irmos-8',
        'irmos-prefeast-nativity', 'irmos-prefeast-theophany', 'liturgy-chants', 'gospodi-vozzvah',
        'theotokia-sunday', 'theotokia-daily', 'stepenna', 'trinity-songs', 'sunday-feast-verses',
        'lent-canon-rules', 'sunday-troparia', 'sunday-prokimena', 'saturday-troparia',
        'paschal-canon', 'chosen-psalms', 'feast-refrains-ode9',
      ];
      return IDS.map((id, i) => ({ id, name: I[i] ?? id, description: '' }));
    }
    if (this.collection === 'paraclete') {
      const p = this.t.paraclete;
      const TONE_NAMES = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'];
      const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const sections: PrayerSection[] = [];
      for (let tone = 1; tone <= 8; tone++) {
        for (let d = 0; d < 6; d++) {
          const toneName = this.language === 'en' ? `Tone ${tone}` : `Гла́съ ${TONE_NAMES[tone]}`;
          sections.push({
            id: `t${tone}-${DAY_KEYS[d]}`,
            name: `${toneName} — ${p.days[d]}`,
            description: '',
          });
        }
      }
      return sections;
    }
    if (this.collection === 'horologion') {
      const h = this.t.horologion.sections;
      return [
        { id: 'midnight-daily', name: h.midnightDaily, description: '' },
        { id: 'midnight-saturday', name: h.midnightSaturday, description: '' },
        { id: 'midnight-sunday', name: h.midnightSunday, description: '' },
        { id: 'typica', name: h.typica, description: '' },
        { id: 'interhour-1', name: h.interhour1, description: '' },
        { id: 'interhour-3', name: h.interhour3, description: '' },
        { id: 'interhour-6', name: h.interhour6, description: '' },
        { id: 'interhour-9', name: h.interhour9, description: '' },
        { id: 'panagia', name: h.panagia, description: '' },
        { id: 'meal-blessing', name: h.mealBlessing, description: '' },
        { id: 'small-compline', name: h.smallCompline, description: '' },
      ];
    }
    if (this.collection === 'sbornik') {
      const b = this.t.sbornik.sections;
      return [
        { id: 'sunday-trop-kont', name: b.sunday, description: '' },
        { id: 'weekday-trop-kont', name: b.weekday, description: '' },
        { id: 'feast-trop-kont', name: b.feast, description: '' },
        { id: 'lent-trop-kont', name: b.lent, description: '' },
        { id: 'pentecost-trop-kont', name: b.pentecost, description: '' },
        { id: 'common-trop-kont', name: b.common, description: '' },
        { id: 'theotokion-sunday', name: b.theotokionSunday, description: '' },
        { id: 'theotokion-8tones', name: b.theotokion8tones, description: '' },
        { id: 'theotokion-dismissal', name: b.theotokionDismissal, description: '' },
        { id: 'katavasia', name: b.katavasia, description: '' },
        { id: 'trinity-troparia', name: b.trinity, description: '' },
        { id: 'lamps-weekday', name: b.lamps, description: '' },
        { id: 'exapostilaria-week', name: b.exapostilaria, description: '' },
        { id: 'biblical-songs-feasts', name: b.songsFeasts, description: '' },
        { id: 'biblical-songs-daily', name: b.songsDaily, description: '' },
        { id: 'biblical-songs-lent', name: b.songsLent, description: '' },
      ];
    }
    if (this.collection === 'parimii') {
      const p = this.t.parimii.sections;
      return [
        { id: 'sept', name: p.sept, description: '' },
        { id: 'oct', name: p.oct, description: '' },
        { id: 'nov', name: p.nov, description: '' },
        { id: 'dec', name: p.dec, description: '' },
        { id: 'jan', name: p.jan, description: '' },
        { id: 'feb', name: p.feb, description: '' },
        { id: 'mar', name: p.mar, description: '' },
        { id: 'apr', name: p.apr, description: '' },
        { id: 'may', name: p.may, description: '' },
        { id: 'jun', name: p.jun, description: '' },
        { id: 'jul', name: p.jul, description: '' },
        { id: 'aug', name: p.aug, description: '' },
        { id: 'cheese-week', name: p.cheeseWeek, description: '' },
        { id: 'lent-week-1', name: p.lentWeek1, description: '' },
        { id: 'lent-week-2', name: p.lentWeek2, description: '' },
        { id: 'lent-week-3', name: p.lentWeek3, description: '' },
        { id: 'lent-week-4', name: p.lentWeek4, description: '' },
        { id: 'lent-week-5', name: p.lentWeek5, description: '' },
        { id: 'palm-week', name: p.palmWeek, description: '' },
        { id: 'holy-week', name: p.holyWeek, description: '' },
        { id: 'pentecostarion', name: p.pentecostarion, description: '' },
        { id: 'common-saints', name: p.commonSaints, description: '' },
      ];
    }
    if (this.collection === 'akathists') {
      const a = this.t.akathists.sections;
      return [
        { id: 'trinity-canon', name: a.trinity, description: '' },
        { id: 'jesus-compunction', name: a.jesusCompunction, description: '' },
        { id: 'akathist-jesus', name: a.akathistJesus, description: '' },
        { id: 'jesus-penitential', name: a.jesusPenitential, description: '' },
        { id: 'pascha-canon', name: a.pascha, description: '' },
        { id: 'nativity-canon', name: a.nativity, description: '' },
        { id: 'cross-canon', name: a.cross, description: '' },
        { id: 'theotokos-moleben', name: a.theotokosMoleben, description: '' },
        { id: 'theotokos-thanksgiving', name: a.theotokosThanksgiving, description: '' },
        { id: 'akathist-theotokos', name: a.akathistTheotokos, description: '' },
        { id: 'theotokos-nativity', name: a.theotokosNativity, description: '' },
        { id: 'pokrov-canon', name: a.pokrov, description: '' },
        { id: 'utoli-pechali', name: a.utoliPechali, description: '' },
        { id: 'skoroposlushnitsa', name: a.skoroposlushnitsa, description: '' },
        { id: 'troeruchitsa', name: a.troeruchitsa, description: '' },
        { id: 'angels-canon', name: a.angels, description: '' },
        { id: 'michael-canon', name: a.michael, description: '' },
        { id: 'gabriel-canon', name: a.gabriel, description: '' },
        { id: 'guardian-angel', name: a.guardianAngel, description: '' },
        { id: 'forerunner-canon', name: a.forerunner, description: '' },
        { id: 'nicholas-canon-akathist', name: a.nicholasCanon, description: '' },
        { id: 'akathist-nicholas', name: a.akathistNicholas, description: '' },
        { id: 'spiridon', name: a.spiridon, description: '' },
        { id: 'cyprian-justina', name: a.cyprian, description: '' },
        { id: 'panteleimon', name: a.panteleimon, description: '' },
        { id: 'tryphon', name: a.tryphon, description: '' },
        { id: 'sergius', name: a.sergius, description: '' },
        { id: 'alexander-svirsky', name: a.alexanderSvirsky, description: '' },
        { id: 'seraphim', name: a.seraphim, description: '' },
        { id: 'john-kronstadt', name: a.johnKronstadt, description: '' },
        { id: 'mary-egypt', name: a.maryEgypt, description: '' },
        { id: 'murom-wonderworkers', name: a.murom, description: '' },
        { id: 'saint-anne', name: a.saintAnne, description: '' },
      ];
    }
    return [
      { id: 'morning', name: s.morning, description: s.morningDesc },
      { id: 'diptychs', name: s.diptychs, description: s.diptychsDesc },
      { id: 'evening', name: s.evening, description: s.eveningDesc },
      { id: 'three-canons', name: s.threeCanons, description: s.threeCanonsDesc },
      { id: 'communion', name: s.communion, description: s.communionDesc },
      { id: 'thanksgiving', name: s.thanksgiving, description: s.thanksgivingDesc },
      { id: 'rule-impurity', name: s.ruleImpurity, description: s.ruleImpurityDesc },
      { id: 'litia-departed', name: s.litiaDeparted, description: s.litiaDepartedDesc },
      { id: 'twelve-psalms', name: s.twelvePsalms, description: s.twelvePsalmsDesc },
      { id: 'beginning-ending', name: s.beginningEnding, description: s.beginningEndingDesc },
    ];
  }

  async render() {
    const sections = this.getSections();
    const isAkathists = this.collection === 'akathists';
    const isParimii = this.collection === 'parimii';
    const isHorologion = this.collection === 'horologion';
    const isSbornik = this.collection === 'sbornik';
    const isParaclete = this.collection === 'paraclete';
    const isIrmologion = this.collection === 'irmologion';
    const isTriodion = this.collection === 'triodion';
    const title = isTriodion ? this.t.triodion.title
      : isAkathists ? this.t.akathists.title
      : isParimii ? this.t.parimii.title
      : isHorologion ? this.t.horologion.title
      : isSbornik ? this.t.sbornik.title
      : isParaclete ? this.t.paraclete.title
      : isIrmologion ? this.t.irmologion.title
      : this.t.prayer.title;
    const subtitle = isTriodion ? this.t.triodion.subtitle
      : isAkathists ? this.t.akathists.subtitle
      : isParimii ? this.t.parimii.subtitle
      : isHorologion ? this.t.horologion.subtitle
      : isSbornik ? this.t.sbornik.subtitle
      : isParaclete ? this.t.paraclete.subtitle
      : isIrmologion ? this.t.irmologion.subtitle
      : this.t.prayer.subtitle;

    this.container.innerHTML = `
      <div class="p-6 max-w-4xl xl:max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold text-red mb-2">${title}</h2>
        <p class="text-navy-light mb-6">${subtitle}</p>
        <div class="grid gap-2 sm:grid-cols-2 mb-6">
          ${sections.map(s => `
            <button
              class="prayer-section text-left px-4 py-3 rounded-lg border transition-colors
                ${this.activeSection === s.id ? 'border-gold bg-gold/10 text-navy font-bold' : 'border-gold/20 bg-white/50 text-navy hover:border-gold/50'}"
              data-section="${s.id}"
            >
              <div class="text-sm font-bold">${s.name}</div>
              ${s.description ? `<div class="text-xs text-navy-light">${s.description}</div>` : ''}
            </button>
          `).join('')}
        </div>
        <div id="prayer-content" class="bg-white/50 border border-gold/20 rounded-lg p-6 min-h-[300px]">
          <p class="text-navy-light italic">${this.t.prayer.selectSection}</p>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.prayer-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-section')!;
        this.activeSection = id;
        this.container.querySelectorAll('.prayer-section').forEach(b => {
          const bid = b.getAttribute('data-section');
          b.className = `prayer-section text-left px-4 py-3 rounded-lg border transition-colors ${bid === id ? 'border-gold bg-gold/10 text-navy font-bold' : 'border-gold/20 bg-white/50 text-navy hover:border-gold/50'}`;
        });
        this.loadSection(id);
      });
    });
  }

  private async loadSection(id: string) {
    const contentEl = document.getElementById('prayer-content');
    if (!contentEl) return;

    contentEl.innerHTML = `<p class="text-navy-light italic">${this.t.loading}</p>`;

    try {
      // Paraclete ids are t{tone}-{day}; others map directly
      let dataPath = `/data/shared/${this.collection}/${id}/full.json`;
      if (this.collection === 'paraclete') {
        const m = id.match(/^t(\d)-(\w+)$/);
        if (!m) {
          contentEl.innerHTML = `<p class="text-navy-light">${this.t.prayer.notFound}</p>`;
          return;
        }
        dataPath = `/data/shared/services/paraclete/tone${m[1]}/${m[2]}.json`;
      }
      const resp = await fetch(dataPath);
      if (!resp.ok) {
        contentEl.innerHTML = `<p class="text-navy-light">${this.t.prayer.notFound}</p>`;
        return;
      }
      const nodes: ServiceNode[] = await resp.json();

      const evalCtx: EvalContext = {};
      const ctx: ServiceContext = {
        evalCtx,
        lang: 'cu',
        t: this.t,
        fetchBibleText: async () => '',
        fetchLives: async () => null,
        fetchCommandText: async () => '',
        resolveTimes: async () => '',
        fetchText: async () => null,
        fetchPrayerNodes: async () => null,
        fetchServiceNodes: async () => null,
      };

      const { html } = await assembleService(nodes, ctx);

      if (html.trim()) {
        const fontClass = this.getFontClass();
        contentEl.className = `prose prose-sm max-w-none liturgical-text ${fontClass}`;
        contentEl.innerHTML = html;
      } else {
        contentEl.className = 'prose prose-sm max-w-none liturgical-text';
        contentEl.innerHTML = `<p class="text-navy-light italic">${this.t.prayer.empty}</p>`;
      }
    } catch (err) {
      contentEl.innerHTML = `<p class="text-navy-light">${this.t.error}</p>`;
    }
  }
}
