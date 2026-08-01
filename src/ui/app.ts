/**
 * Main application shell — SPA router and layout.
 */

import { CalendarView } from './calendar-view';
import { BibleView } from './bible-view';
import { PrayerView } from './prayer-view';
import { MenaionView } from './menaion-view';
import { SettingsView } from './settings-view';
import { JDate } from '../core/jdate';
import { loadSettings, type Settings } from './settings-view';
import { getTranslations, type LanguageCode } from '../core/i18n';
import { DataCache } from '../core/data-cache';

type View = 'calendar' | 'bible' | 'prayer' | 'akathists' | 'parimii' | 'horologion' | 'sbornik' | 'paraclete' | 'irmologion' | 'menaion' | 'triodion' | 'settings';

export class App {
  private container: HTMLElement;
  private currentView: View = 'calendar';
  private currentDate: JDate;
  private settings: Settings;

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentDate = JDate.today();
    this.settings = loadSettings();
    document.documentElement.style.setProperty('--liturgical-font-size', this.settings.fontSize + 'px');
  }

  init() {
    this.container.innerHTML = '';
    this.render();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    // Close dropdown menus on click/touch outside
    const closeOpenDropdowns = (e: Event) => {
      const target = e.target as Node;
      document.querySelectorAll('details.nav-group[open]').forEach(d => {
        if (!d.contains(target)) {
          d.removeAttribute('open');
        }
      });
    };
    document.addEventListener('click', closeOpenDropdowns);
    document.addEventListener('touchstart', closeOpenDropdowns, { passive: true });

    // Close library dropdown when a nav link inside it is clicked
    document.querySelector('nav')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('.nav-link');
      if (link) {
        const details = link.closest('details.nav-group');
        if (details) {
          details.removeAttribute('open');
        }
      }
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      (window as any).__deferredPrompt = e;
    });

    // Auto-preload essential data for the current language
    this.autoPreload();
  }

  private async autoPreload(): Promise<void> {
    try {
      const key = 'ponomar-preloaded';
      if (localStorage.getItem(key)) return;
      const lang = this.settings.language as LanguageCode;
      const languages = lang === 'ru' ? ['ru', 'cu'] : [lang];
      for (const l of languages) {
        // Preload menaion bundle
        await DataCache.fetch(`/data/${l}/menaion-bundle.json`).catch(() => {});
        // Preload current month lives
        const mm = String(JDate.today().getMonth()).padStart(2, '0');
        await DataCache.fetch(`/data/${l}/lives/${mm}.json`).catch(() => {});
      }
      // Preload calendar data
      await DataCache.fetch('/data/shared/fasting.json').catch(() => {});
      localStorage.setItem(key, '1');
    } catch {
      // Silently fail — user can manually preload via settings
    }
  }

  private handleRoute() {
    const hash = window.location.hash.slice(1) || 'calendar';
    const parts = hash.split('/');
    this.currentView = parts[0] as View || 'calendar';
    this.renderView();
  }

  private resolveBibleVersion(shortId: string, lang: string): string {
    // Map short version IDs like "kjv" to full paths like "en/bible/kjv"
    const langMap: Record<string, string> = {
      en: 'en/bible/kjv',
      ru: 'ru/bible/synod',
      cu: 'cu/bible/elis',
    };
    if (shortId === 'kjv' || shortId === 'brenton' || shortId === 'nonkjv') return `en/bible/${shortId}`;
    if (shortId === 'synod' || shortId === 'kassian' || shortId === 'yungerov') return `ru/bible/${shortId}`;
    if (shortId === 'elis') return 'cu/bible/elis';
    if (shortId === 'ls') return 'fr/bible/ls';
    if (shortId === 'spt') return 'el/bible/spt';
    if (shortId === 'vulgate') return 'la/bible/vulgate';
    if (shortId === 'cuv') return 'zh/Hans/bible/cuv';
    if (shortId === 'cuv-hant') return 'zh/Hant/bible/cuv';
    if (shortId === 'svd') return 'ar/bible/svd';
    return langMap[lang] || 'en/bible/kjv';
  }

  private render() {
    const t = getTranslations(this.settings.language as LanguageCode);
    this.container.innerHTML = `
      <div class="app-container min-h-screen flex flex-col">
        <header class="bg-navy text-parchment p-3 flex items-center justify-end shadow-md">
          <nav class="flex flex-wrap gap-4 text-sm">
            <a href="#calendar" class="nav-link hover:text-gold transition-colors" data-view="calendar">${t.nav.calendar}</a>
            <details class="nav-group relative" data-nav="library">
              <summary class="cursor-pointer list-none hover:text-gold transition-colors flex items-center gap-1">${t.nav.library} <span class="text-xs">▾</span></summary>
              <div class="absolute left-0 top-full mt-1 z-50 min-w-56 rounded-lg bg-navy-light shadow-xl p-2 flex flex-col gap-1">
                <a href="#bible" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="bible">${t.nav.bible}</a>
                <details class="nav-group">
                  <summary class="cursor-pointer list-none hover:text-gold transition-colors px-2 py-1 flex items-center gap-1">${t.nav.service} <span class="text-xs">▸</span></summary>
                  <div class="ml-2 flex flex-col gap-1">
                    <a href="#horologion" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="horologion">${t.nav.horologion}</a>
                    <a href="#sbornik" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="sbornik">${t.nav.sbornik}</a>
                    <a href="#prayer" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="prayer">${t.nav.prayer}</a>
                    <a href="#akathists" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="akathists">${t.nav.akathists}</a>
                    <a href="#parimii" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="parimii">${t.nav.parimii}</a>
                    <a href="#paraclete" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="paraclete">${t.nav.paraclete}</a>
                    <a href="#irmologion" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="irmologion">${t.nav.irmologion}</a>
                  </div>
                </details>
                <details class="nav-group">
                  <summary class="cursor-pointer list-none hover:text-gold transition-colors px-2 py-1 flex items-center gap-1">${t.nav.festal} <span class="text-xs">▸</span></summary>
                  <div class="ml-2 flex flex-col gap-1">
                    <a href="#menaion" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="menaion">${t.nav.menaion}</a>
                    <a href="#triodion" class="nav-link hover:text-gold transition-colors px-2 py-1 text-sm" data-view="triodion">${t.nav.triodion}</a>
                  </div>
                </details>
              </div>
            </details>
            <a href="#settings" class="nav-link hover:text-gold transition-colors" data-view="settings">${t.nav.settings}</a>
          </nav>
        </header>
        <main id="view-container" class="flex-1 overflow-auto"></main>
      </div>
    `;
  }

  private renderView() {
    const viewContainer = document.getElementById('view-container')!;
    viewContainer.innerHTML = '';

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(el => {
      const v = el.getAttribute('data-view');
      const isActive = v === this.currentView;
      el.classList.toggle('text-gold', isActive);
      el.classList.toggle('font-bold', isActive);
    });

    // Re-read settings fresh on each navigation
    this.settings = loadSettings();
    const lang = this.settings.language as LanguageCode;
    const calendarType = this.settings.calendarType || 'julian';

    switch (this.currentView) {
      case 'calendar':
        new CalendarView(viewContainer, this.currentDate, (date) => {
          this.currentDate = date;
        }, lang, calendarType).render();
        break;
      case 'bible': {
        // Parse route params: #bible/{lang~short}/{book}/{passage}
        const hash = window.location.hash.slice(1);
        const bp = hash.split('/');
        const versionSpec = bp[1] || '';
        const bibleBook = bp[2] || '';
        const biblePassage = bp[3] || '';
        let bibleVersion: string;
        if (!versionSpec) {
          bibleVersion = this.resolveBibleVersion(this.settings.defaultBibleVersion, lang);
        } else if (versionSpec.includes('~')) {
          // Format: lang~short e.g. "en~kjv" → "en/bible/kjv"
          const [vl, vs] = versionSpec.split('~');
          bibleVersion = `${vl}/bible/${vs}`;
        } else if (versionSpec.includes('/')) {
          bibleVersion = versionSpec; // legacy full path
        } else {
          bibleVersion = this.resolveBibleVersion(versionSpec, lang);
        }
        new BibleView(viewContainer, lang, bibleVersion, bibleBook, biblePassage).render();
        break;
      }
      case 'prayer':
        new PrayerView(viewContainer, lang, 'prayer-rule').render();
        break;
      case 'akathists':
        new PrayerView(viewContainer, lang, 'akathists').render();
        break;
      case 'parimii':
        new PrayerView(viewContainer, lang, 'parimii').render();
        break;
      case 'horologion':
        new PrayerView(viewContainer, lang, 'horologion').render();
        break;
      case 'sbornik':
        new PrayerView(viewContainer, lang, 'sbornik').render();
        break;
      case 'paraclete':
        new PrayerView(viewContainer, lang, 'paraclete').render();
        break;
      case 'irmologion':
        new PrayerView(viewContainer, lang, 'irmologion').render();
        break;
      case 'menaion':
        new MenaionView(viewContainer, lang).render();
        break;
      case 'triodion':
        new PrayerView(viewContainer, lang, 'triodion').render();
        break;
      case 'settings':
        new SettingsView(viewContainer, () => {
          this.render();
          this.renderView();
        }).render();
        break;
    }
  }

  go(view: View) {
    window.location.hash = view;
  }
}
