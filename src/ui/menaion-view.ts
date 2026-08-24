/**
 * Menaion view — browse the daily Menaion by month and day.
 * Calendar-style navigation with prev/next month arrows.
 */

import { assembleService, type ServiceContext } from '../core/service-assembler';
import type { EvalContext, ServiceNode } from '../core/types';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { loadSettings, fontClass } from './settings-view';
import { DataCache } from '../core/data-cache';

export class MenaionView {
  private container: HTMLElement;
  private language: LanguageCode;
  private t: ReturnType<typeof getTranslations>;
  private index: Record<string, number> = {};
  private currentMonth: number = 1;

  constructor(container: HTMLElement, language: LanguageCode) {
    this.container = container;
    this.language = language;
    this.t = getTranslations(language);
  }

  private getFontClass(): string {
    const settings = loadSettings();
    return (this.language === 'cu' || this.language === 'ru') && settings.cuFont !== undefined ? fontClass(settings.cuFont) : '';
  }

  private getMonthNames(): string[] {
    const months = this.t.calendar.monthsGenitive;
    // Some i18n month lists are genitive (used in date contexts).
    // For labels we need nominative — derive from genitive or use indices.
    const NOMINATIVE: Record<string, string> = {
      'января': 'Январь', 'февраля': 'Февраль', 'марта': 'Март',
      'апреля': 'Апрель', 'мая': 'Май', 'июня': 'Июнь',
      'июля': 'Июль', 'августа': 'Август', 'сентября': 'Сентябрь',
      'октября': 'Октябрь', 'ноября': 'Ноябрь', 'декабря': 'Декабрь',
      'january': 'January', 'february': 'February', 'march': 'March',
      'april': 'April', 'may': 'May', 'june': 'June',
      'july': 'July', 'august': 'August', 'september': 'September',
      'october': 'October', 'november': 'November', 'december': 'December',
    };
    return months.map(m => NOMINATIVE[m.toLowerCase()] || m);
  }

  async render() {
    try {
      const index = await DataCache.fetchWithFallback<Record<string, number>>('/data/shared/menaion-daily/index.json');
      if (index) {
        this.index = index;
      }
    } catch { /* empty */ }

    const today = new Date();
    this.currentMonth = today.getMonth() + 1;

    this.container.innerHTML = `
      <div class="p-4 max-w-4xl xl:max-w-6xl mx-auto">
        <div class="flex flex-wrap gap-2 mb-2">
          ${[
            { id: 'prayer', view: 'prayer', label: this.t.nav.prayer },
            { id: 'akathists', view: 'akathists', label: this.t.nav.akathists },
            { id: 'horologion', view: 'horologion', label: this.t.nav.horologion },
            { id: 'sbornik', view: 'sbornik', label: this.t.nav.sbornik },
            { id: 'parimii', view: 'parimii', label: this.t.nav.parimii },
            { id: 'paraclete', view: 'paraclete', label: this.t.nav.paraclete },
            { id: 'irmologion', view: 'irmologion', label: this.t.nav.irmologion },
            { id: 'menaion', view: 'menaion', label: this.t.nav.menaion },
            { id: 'triodion', view: 'triodion', label: this.t.nav.triodion },
          ].map(item => `
            <button
              class="sub-nav-chip text-sm transition-colors rounded-lg px-3 py-1
                ${item.id === 'menaion'
                  ? 'border border-gold bg-gold/10 text-navy font-bold'
                  : 'border border-gold/20 bg-surface/50 text-navy hover:border-gold/50'}"
              data-view="${item.view}"
            >${item.label}</button>
          `).join('')}
        </div>
        <div id="menaion-calendar"></div>
        <div id="menaion-content" class="bg-surface/50 border border-gold/20 rounded-lg p-4 min-h-[300px]">
          <p class="text-navy-light italic">${this.t.prayer.selectSection}</p>
        </div>
      </div>
    `;

    this.renderCalendar(this.currentMonth);
    this.setupChips();
  }

  private setupChips() {
    this.container.querySelectorAll('.sub-nav-chip[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = btn.getAttribute('data-view')!;
      });
    });
  }

  private renderCalendar(month: number) {
    const calEl = this.container.querySelector('#menaion-calendar');
    if (!calEl) return;

    const months = this.getMonthNames();
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDay = daysInMonth[month - 1];
    const mm = String(month).padStart(2, '0');

    // First day of month (Julian) — approximate day-of-week
    // Use a simple approach: Jan 1 Julian 2025 = Wednesday (3)
    const firstDow = (month === 1 ? 3 : new Date(2025, month - 1, 1).getDay() + 1) % 7;

    let daysHtml = '';
    for (let i = 0; i < firstDow; i++) {
      daysHtml += '<div></div>';
    }
    for (let d = 1; d <= maxDay; d++) {
      const dd = String(d).padStart(2, '0');
      const key = `${mm}-${dd}`;
      const n = this.index[key];
      daysHtml += `
        <button class="px-1.5 py-0.5 text-xs rounded border transition-colors
          ${n ? 'border-gold/40 bg-gold/10 text-navy hover:border-gold cursor-pointer' : 'border-transparent text-navy-light opacity-30 cursor-default'}"
          data-date="${key}" ${n ? '' : 'disabled'}>
          ${d}
        </button>
      `;
    }

    calEl.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <button id="menaion-prev" class="text-sm text-navy-light hover:text-navy px-2 py-1">◀</button>
        <span class="text-base font-bold text-navy">${months[month - 1]}</span>
        <button id="menaion-next" class="text-sm text-navy-light hover:text-navy px-2 py-1">▶</button>
      </div>
      <div class="grid gap-1 grid-cols-7 mb-2">
        ${daysHtml}
      </div>
    `;

    document.getElementById('menaion-prev')?.addEventListener('click', () => {
      const prev = this.currentMonth <= 1 ? 12 : this.currentMonth - 1;
      this.currentMonth = prev;
      this.renderCalendar(prev);
    });
    document.getElementById('menaion-next')?.addEventListener('click', () => {
      const next = this.currentMonth >= 12 ? 1 : this.currentMonth + 1;
      this.currentMonth = next;
      this.renderCalendar(next);
    });

    calEl.querySelectorAll('[data-date]:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        this.loadDay(btn.getAttribute('data-date')!);
      });
    });
  }

  private async loadDay(dateKey: string) {
    const contentEl = this.container.querySelector('#menaion-content') as HTMLElement | null;
    if (!contentEl) return;
    contentEl.innerHTML = `<p class="text-navy-light italic">${this.t.loading}</p>`;

    const count = this.index[dateKey] ?? 0;
    let html = '';
    for (let i = 1; i <= count; i++) {
      try {
        const nodes = await DataCache.fetchWithFallback<ServiceNode[]>(`/data/shared/menaion-daily/${dateKey}/${i}.json`);
        if (!nodes) continue;
        const evalCtx: EvalContext = {};
        const ctx: ServiceContext = {
          evalCtx, lang: 'cu', t: this.t,
          fetchBibleText: async () => '', fetchLives: async () => null,
          fetchCommandText: async () => '', resolveTimes: async () => '',
          fetchText: async () => null, fetchPrayerNodes: async () => null,
          fetchServiceNodes: async () => null,
        };
        const { html: h } = await assembleService(nodes, ctx);
        if (h.trim()) {
          html += `<div class="${i > 1 ? 'mt-6 pt-4 border-t border-gold/20' : ''}">${h}</div>`;
        }
      } catch { /* skip section */ }
    }

    const fontClass = this.getFontClass();
    contentEl.className = `prose prose-sm max-w-none liturgical-text ${fontClass}`;
    contentEl.innerHTML = html.trim() ? html : `<p class="text-navy-light italic">${this.t.prayer.empty}</p>`;
  }
}
