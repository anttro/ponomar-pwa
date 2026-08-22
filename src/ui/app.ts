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

type View = 'calendar' | 'bible' | 'prayer' | 'akathists' | 'parimii' | 'horologion' | 'sbornik' | 'paraclete' | 'irmologion' | 'menaion' | 'triodion' | 'lives' | 'settings';

export class App {
  private container: HTMLElement;
  private currentView: View = 'calendar';
  private currentDate: JDate;
  private settings: Settings;
  private routeParam: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentDate = JDate.today();
    this.settings = loadSettings();
    document.documentElement.style.setProperty('--liturgical-font-size', this.settings.fontSize + 'px');
    this.applyTheme();
  }

  private faviconImage: HTMLImageElement | null = null;
  private faviconCanvas: HTMLCanvasElement | null = null;

  private applyTheme() {
    document.documentElement.className = 'theme-' + (this.settings.theme || 'default');
    const chromeColor = getComputedStyle(document.documentElement).getPropertyValue('--clr-browser-chrome').trim();
    if (chromeColor) {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chromeColor);
    }
    this.updateFavicon(chromeColor || '#1a1a2e');
  }

  private updateFavicon(bgColor: string) {
    const size = 64;
    if (!this.faviconCanvas) this.faviconCanvas = document.createElement('canvas');
    const canvas = this.faviconCanvas;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    const draw = () => {
      if (!this.faviconImage?.complete || !this.faviconImage.naturalWidth) return;
      const artSize = Math.round(size * 0.8);
      ctx.drawImage(this.faviconImage, (size - artSize) / 2, (size - artSize) / 2, artSize, artSize);
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = canvas.toDataURL('image/png');
    };
    if (!this.faviconImage) {
      this.faviconImage = new Image();
      this.faviconImage.onload = draw;
      this.faviconImage.src = '/icons/cross-gold.png';
    }
    draw();
  }

  private async checkDataVersion() {
    const DATA_VERSION = '2026-08-04'; // bump when data structure changes
    try {
      const cachedVer = await DataCache.get('__data_version__') as string | null;
      if (cachedVer !== DATA_VERSION) {
        await DataCache.clear();
        await DataCache.set('__data_version__', DATA_VERSION);
      }
    } catch {
      // Silently fail — cache is best-effort
    }
  }

  init() {
    this.container.innerHTML = '';
    this.render();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    // Data version check — bump DATA_VERSION when static data structure changes
    this.checkDataVersion();

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
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('.nav-link');
      if (link) {
        document.querySelectorAll('details.nav-group[open]').forEach(d => {
          d.removeAttribute('open');
        });
      }
    });

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      (window as any).__deferredPrompt = e;
    });

    // Clear first-launch flag on re-install
    window.addEventListener('appinstalled', () => {
      localStorage.removeItem('ponomar-installed');
    });

    // Show offline offer on first standalone launch
    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone() && !localStorage.getItem('ponomar-installed')) {
      localStorage.setItem('ponomar-installed', '1');
      this.showOfflineOfferModal();
    }

    // Auto-preload essential data for the current language
    this.autoPreload();
  }

  private async autoPreload(): Promise<void> {
    try {
      const key = 'ponomar-preloaded';
      if (localStorage.getItem(key)) return;
      const lang = this.settings.language as LanguageCode;
      const liturgicalLangs = lang === 'ru' || lang === 'cu' ? ['cu'] : [lang];
      for (const l of liturgicalLangs) {
        await DataCache.fetch(`/data/${l}/menaion-bundle.json`).catch(() => {});
      }
      const livesLangs = lang === 'ru' ? ['ru', 'cu'] : [lang];
      for (const l of livesLangs) {
        const mm = String(JDate.today().getMonth()).padStart(2, '0');
        await DataCache.fetch(`/data/${l}/lives/${mm}.json`).catch(() => {});
      }
      await DataCache.fetch('/data/shared/fasting.json').catch(() => {});
      localStorage.setItem(key, '1');
    } catch {
      // Silently fail — user can manually preload via settings
    }
  }

  private showOfflineOfferModal() {
    const t = getTranslations(this.settings.language as LanguageCode);
    const overlay = document.createElement('div');
    overlay.id = 'offline-offer-overlay';
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    overlay.innerHTML = `
      <div class="bg-surface rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <h3 class="text-lg font-bold text-navy mb-2">${t.settings.offlineOfferTitle}</h3>
        <p class="text-sm text-navy mb-4">${t.settings.offlineOfferText}</p>
        <div class="flex flex-col gap-2">
          <button id="offline-offer-all" class="w-full bg-navy text-parchment rounded-lg px-4 py-2 font-bold hover:bg-navy-light transition-colors">${t.settings.offlineOfferPreloadAll}</button>
          <button id="offline-offer-choose" class="w-full bg-gold text-navy rounded-lg px-4 py-2 font-bold hover:bg-gold-light transition-colors">${t.settings.offlineOfferChoose}</button>
          <button id="offline-offer-skip" class="w-full text-sm text-navy-light underline hover:text-navy text-center cursor-pointer">${t.settings.offlineOfferSkip}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('offline-offer-all')?.addEventListener('click', () => {
      overlay.remove();
      window.location.hash = '#settings/autopreload';
    });
    document.getElementById('offline-offer-choose')?.addEventListener('click', () => {
      overlay.remove();
      window.location.hash = '#settings';
    });
    document.getElementById('offline-offer-skip')?.addEventListener('click', () => {
      overlay.remove();
    });
  }

  private handleRoute() {
    const hash = window.location.hash.slice(1) || 'calendar';
    const parts = hash.split('/');
    this.currentView = parts[0] as View || 'calendar';
    this.routeParam = parts[1] || '';
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
    this.settings = loadSettings();
    this.applyTheme();
    const t = getTranslations(this.settings.language as LanguageCode);
    this.container.innerHTML = `
      <div class="app-container min-h-screen flex flex-col">
        <header class="bg-header-bg text-header-text p-3 flex items-center shadow-md relative">
          <span id="app-title" class="hidden md:inline-flex items-center gap-2 text-lg font-bold whitespace-nowrap absolute left-3 top-1/2 -translate-y-1/2">
            <img src="/icons/icon-192.png" class="w-6 h-6" alt="">
            ${t.nav.appTitle}
          </span>
          <nav class="flex flex-wrap gap-4 text-sm mx-auto">
            <a href="#calendar" class="nav-link hover:text-gold transition-colors" data-view="calendar">${t.nav.calendar}</a>
            <details class="nav-group relative" data-nav="library">
              <summary class="cursor-pointer list-none hover:text-gold transition-colors flex items-center gap-1">${t.nav.library} <span class="text-xs">▾</span></summary>
              <div class="absolute left-0 top-full mt-1 z-50 min-w-56 rounded-lg bg-dropdown-bg shadow-xl p-2 flex flex-col gap-1">
                <a href="#bible" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="bible"><span>📖</span> <span class="font-bold">${t.nav.bible}</span></a>
                <a href="#prayer" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="prayer">${t.nav.prayer}</a>
                <a href="#akathists" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="akathists">${t.nav.akathists}</a>
                <a href="#horologion" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="horologion">${t.nav.horologion}</a>
                <a href="#sbornik" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="sbornik">${t.nav.sbornik}</a>
                <a href="#parimii" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="parimii">${t.nav.parimii}</a>
                <a href="#paraclete" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="paraclete">${t.nav.paraclete}</a>
                <a href="#irmologion" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="irmologion">${t.nav.irmologion}</a>
                <a href="#menaion" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="menaion">${t.nav.menaion}</a>
                <a href="#triodion" class="nav-link hover:text-gold transition-colors px-2 py-1" data-view="triodion">${t.nav.triodion}</a>
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
    const calendarType = this.settings.calendarType || 'gregorian';

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
          const lastVersion = localStorage.getItem('ponomar-last-bible-version');
          bibleVersion = lastVersion || this.resolveBibleVersion(this.settings.defaultBibleVersion, lang);
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
        }, this.routeParam).render();
        break;
    }
  }

  go(view: View) {
    window.location.hash = view;
  }
}
