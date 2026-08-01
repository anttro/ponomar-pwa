/**
 * Menaion view — browse the daily Menaion by month and day.
 * Two-step selector: month → day grid → section list.
 */

import { assembleService, type ServiceContext } from '../core/service-assembler';
import type { EvalContext, ServiceNode } from '../core/types';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { loadSettings, fontClass } from './settings-view';

export class MenaionView {
  private container: HTMLElement;
  private language: LanguageCode;
  private t: ReturnType<typeof getTranslations>;
  private index: Record<string, number> = {};

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
    return this.t.calendar.monthsGenitive;
  }

  async render() {
    try {
      const resp = await fetch('/data/shared/menaion-daily/index.json');
      if (resp.ok) {
        this.index = await resp.json() as Record<string, number>;
      }
    } catch { /* empty */ }

    const months = this.getMonthNames();
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const today = new Date();

    // Count sections per month
    const monthCounts: number[] = new Array(12).fill(0);
    for (const [dk, n] of Object.entries(this.index)) {
      const m = parseInt(dk.slice(0, 2), 10) - 1;
      if (m >= 0 && m < 12) monthCounts[m] += n;
    }

    const monthHtml = months.map((m, i) => `
      <button class="menaion-month px-3 py-1.5 text-sm rounded border transition-colors
        border-gold/20 bg-white/50 text-navy hover:border-gold/50" data-month="${i + 1}">
        ${m} <span class="text-xs text-navy-light">(${monthCounts[i]})</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="p-6 max-w-4xl xl:max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold text-red mb-2">${this.t.menaion.title}</h2>
        <p class="text-navy-light mb-4">${months[0]}</p>
        <div class="flex flex-wrap gap-1 mb-6">
          ${monthHtml}
        </div>
        <div id="menaion-days" class="grid gap-1 sm:grid-cols-7 mb-6"></div>
        <div id="menaion-content" class="bg-white/50 border border-gold/20 rounded-lg p-6 min-h-[300px]">
          <p class="text-navy-light italic">${this.t.prayer.selectSection}</p>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.menaion-month').forEach(btn => {
      btn.addEventListener('click', () => {
        const month = parseInt(btn.getAttribute('data-month')!, 10);
        this.renderMonth(month, daysInMonth[month - 1]);
      });
    });

    // Default: current month
    this.renderMonth(today.getMonth() + 1, daysInMonth[today.getMonth()]);
  }

  private renderMonth(month: number, maxDay: number) {
    const daysEl = this.container.querySelector('#menaion-days');
    if (!daysEl) return;
    const mm = String(month).padStart(2, '0');
    const days = [];
    for (let d = 1; d <= maxDay; d++) {
      const dd = String(d).padStart(2, '0');
      const key = `${mm}-${dd}`;
      const n = this.index[key];
      days.push(`
        <button class="menaion-day px-2 py-1 text-xs rounded border transition-colors
          ${n ? 'border-gold/40 bg-gold/10 text-navy hover:border-gold' : 'border-gold/10 text-navy-light opacity-40 cursor-default'}"
          data-date="${key}" ${n ? '' : 'disabled'}>
          ${d}${n ? ` <span class="text-[10px]">(${n})</span>` : ''}
        </button>
      `);
    }
    daysEl.innerHTML = days.join('');
    this.container.querySelectorAll('.menaion-day:not([disabled])').forEach(btn => {
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
        const resp = await fetch(`/data/shared/menaion-daily/${dateKey}/${i}.json`);
        if (!resp.ok) continue;
        const nodes: ServiceNode[] = await resp.json();
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
