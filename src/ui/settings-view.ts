/**
 * Settings view — language, font, and display preferences.
 */

import { getTranslations, type LanguageCode } from '../core/i18n';
import { OfflineManager } from '../core/offline-manager';
import { DataCache } from '../core/data-cache';

const LANGUAGES = [
  { code: 'en', name: 'English', local: 'English' },
  { code: 'ru', name: 'Russian', local: 'Русский' },
  { code: 'cu', name: 'Church Slavonic', local: 'Церковнославянский' },
];

const CU_FONTS = [
  { id: '', name: 'System Default' },
  { id: 'Ponomar', name: 'Ponomar' },
  { id: 'Fedorovsk', name: 'Fedorovsk' },
  { id: 'Menaion', name: 'Menaion' },
  { id: 'Monomakh', name: 'Monomakh' },
  { id: 'Triodion', name: 'Triodion' },
  { id: 'Vilnius', name: 'Vilnius' },
  { id: 'Voskresensky', name: 'Voskresensky' },
];

const SETTINGS_KEY = 'ponomar-settings';

interface Settings {
  language: string;
  cuFont: string;
  fontSize: number;
  theme: string;
  defaultBibleVersion: string;
  showVerseNumbers: boolean;
  verseNewLine: boolean;
  calendarType: 'julian' | 'gregorian';
  serviceRole: 'priest' | 'reader' | 'auto';
  latitude: number;
  longitude: number;
}

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  cuFont: 'Ponomar',
  fontSize: 16,
  theme: 'default',
  defaultBibleVersion: 'kjv',
  showVerseNumbers: true,
  verseNewLine: false,
  calendarType: 'julian',
  serviceRole: 'priest',
  latitude: 55.7558,
  longitude: 37.6176,
};

function defaultBibleForLanguage(lang: string): string {
  const map: Record<string, string> = { en: 'kjv', ru: 'synod', cu: 'elis' };
  return map[lang] || 'kjv';
}

function versionPriority(lang: string, userLang: string): number {
  if (lang === userLang) return 0;
  if ((userLang === 'ru' || userLang === 'cu') && (lang === 'ru' || lang === 'cu')) return 1;
  return 2;
}

function detectBrowserLanguage(): LanguageCode {
  const lang = navigator.language || (navigator as any).userLanguage || '';
  if (lang.startsWith('ru')) return 'ru';
  if (lang.startsWith('cu')) return 'cu';
  return 'en';
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old usePonomarFont to cuFont
      if (parsed.usePonomarFont !== undefined) {
        parsed.cuFont = parsed.usePonomarFont ? 'Ponomar' : '';
        delete parsed.usePonomarFont;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS, language: detectBrowserLanguage(), defaultBibleVersion: defaultBibleForLanguage(detectBrowserLanguage()) };
}

function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function fontClass(fontName: string): string {
  if (!fontName) return 'font-system-slavonic';
  const lower = fontName.toLowerCase();
  const map: Record<string, string> = {
    ponomar: 'font-ponomar',
    fedorovsk: 'font-fedrovsk',
    indiction: 'font-indiction',
    menaion: 'font-menaion',
    monomakh: 'font-monomakh',
    triodion: 'font-triodion',
    vilnius: 'font-vilnius',
    voskresensky: 'font-voskresensky',
  };
  return map[lower] || 'font-slavonic';
}

export { loadSettings, saveSettings, fontClass };
export type { Settings };

export class SettingsView {
  private container: HTMLElement;
  private settings: Settings;
  private onLanguageChange?: () => void;
  private action?: string;

  constructor(container: HTMLElement, onLanguageChange?: () => void, action?: string) {
    this.container = container;
    this.settings = loadSettings();
    this.onLanguageChange = onLanguageChange;
    this.action = action;
  }

  render() {
    const t = getTranslations(this.settings.language as LanguageCode);

    this.container.innerHTML = `
      <div class="p-6 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-red mb-6">${t.settings.title}</h2>

        <!-- Language -->
        <div class="mb-6">
          <label class="block text-sm font-bold text-navy mb-2">${t.settings.language}</label>
          <select id="language" class="w-full border border-gold/30 rounded p-2 bg-surface text-navy">
            ${LANGUAGES.map(l => `
              <option value="${l.code}" ${l.code === this.settings.language ? 'selected' : ''}>
                ${l.name} (${l.local})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Theme -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.theme}</h3>
          <div class="mb-3">
            <select id="theme" class="w-full border border-gold/30 rounded p-2 bg-surface text-navy">
              <option value="default" ${this.settings.theme === 'default' ? 'selected' : ''}>${t.settings.themeDefault}</option>
              <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>${t.settings.themeDark}</option>
              <option value="sepia" ${this.settings.theme === 'sepia' ? 'selected' : ''}>${t.settings.themeSepia}</option>
              <option value="hc" ${this.settings.theme === 'hc' ? 'selected' : ''}>${t.settings.themeHC}</option>
            </select>
          </div>
        </div>

        <!-- Font Settings -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.fontSettings}</h3>

          <div class="mb-3">
            <select id="cu-font" class="w-full border border-gold/30 rounded p-2 bg-surface text-navy">
              ${CU_FONTS.map(f => `
                <option value="${f.id}" ${f.id === this.settings.cuFont ? 'selected' : ''}>
                   ${f.id === '' ? t.settings.systemFont : f.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="p-3 bg-parchment-dark rounded border border-gold/20">
            <p class="text-sm text-navy mb-2">${t.settings.fontPreview}</p>
            <div id="font-preview" class="text-lg">
              Сохрани́ мѧ, гдⷭ҇и, ꙗ҆́кѡ на тѧ̀ ᲂу҆пова́хъ
            </div>
          </div>
        </div>

        <!-- Font Size -->
        <div class="mb-6">
          <label class="block text-sm font-bold text-navy mb-2">
            ${t.settings.fontSize} <span id="font-size-value">${this.settings.fontSize}px</span>
          </label>
          <input type="range" id="font-size" min="12" max="32" value="${this.settings.fontSize}"
            class="w-full accent-gold">
        </div>

        <!-- Calendar Type -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.calendarType}</h3>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="calendar-type" value="julian" ${this.settings.calendarType === 'julian' ? 'checked' : ''}
                class="accent-gold">
              <span class="text-sm text-navy">${t.settings.julian}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="calendar-type" value="gregorian" ${this.settings.calendarType === 'gregorian' ? 'checked' : ''}
                class="accent-gold">
              <span class="text-sm text-navy">${t.settings.gregorian}</span>
            </label>
          </div>
        </div>

        <!-- Location -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.locationTitle}</h3>
          <div class="flex gap-2 mb-2">
            <div class="flex-1">
              <label class="block text-xs font-bold text-navy mb-1">${t.settings.latitude}</label>
              <input type="number" id="latitude" step="0.0001" value="${this.settings.latitude}"
                class="w-full border border-gold/30 rounded p-2 bg-surface text-navy text-sm">
            </div>
            <div class="flex-1">
              <label class="block text-xs font-bold text-navy mb-1">${t.settings.longitude}</label>
              <input type="number" id="longitude" step="0.0001" value="${this.settings.longitude}"
                class="w-full border border-gold/30 rounded p-2 bg-surface text-navy text-sm">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="request-location" class="bg-navy text-parchment rounded px-3 py-1 text-sm hover:bg-navy-light transition-colors">
              ${t.settings.requestLocation}
            </button>
            <span class="text-xs text-navy-light">${t.settings.locationNote}</span>
          </div>
        </div>

        <!-- Bible Settings -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.bibleSettings}</h3>

          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-1">${t.settings.defaultTranslation}</label>
            <select id="default-bible" class="w-full border border-gold/30 rounded p-2 bg-surface text-navy">
              <option value="">${t.settings.offlineCalculating}</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input type="checkbox" id="show-verses" ${this.settings.showVerseNumbers ? 'checked' : ''}
              class="w-4 h-4 accent-gold">
            <label for="show-verses" class="text-sm text-navy">${t.settings.showVerseNumbers}</label>
          </div>

          <div class="flex items-center gap-3">
            <input type="checkbox" id="verse-newline" ${this.settings.verseNewLine ? 'checked' : ''}
              class="w-4 h-4 accent-gold">
            <label for="verse-newline" class="text-sm text-navy">${t.settings.verseNewLine}</label>
          </div>
        </div>

        <!-- Install PWA -->
        <div class="mb-6">
          <button id="install-pwa" class="w-full bg-navy text-parchment rounded p-3 font-bold hover:bg-navy-light transition-colors ${!('serviceWorker' in navigator) || window.matchMedia('(display-mode: standalone)').matches ? 'hidden' : ''}">
            ${t.settings.installPwa}
          </button>
        </div>

        <!-- Offline Content -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.offlineContent}</h3>

          <!-- Language selection for offline -->
          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-2">${t.settings.offlineLangs}</label>
            <div id="offline-langs" class="flex flex-wrap gap-3">
              ${LANGUAGES.map(l => `
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" value="${l.code}" class="offline-lang accent-gold"> <span class="text-sm">${l.local}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Data type selection -->
          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-2">${t.settings.offlineDataTypes}</label>
            <div id="offline-types" class="flex flex-wrap gap-3">
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="calendar" checked class="offline-type accent-gold"> <span class="text-sm">${t.settings.offlineCalendar}</span>
              </label>
              <div id="bible-row" class="flex items-center gap-1 cursor-pointer">
                <span class="text-sm">${t.settings.offlineBible} <span id="bible-count" class="text-xs text-navy-light">(0/0)</span></span>
                <span id="bible-chevron" class="text-xs text-navy-light hover:text-navy select-none">▶</span>
              </div>
            </div>
            <div id="bible-translations" class="hidden ml-4 mt-1 space-y-1 border-l border-gold/20 pl-3"></div>
          </div>

          <!-- Storage info and controls -->
          <div class="flex items-center justify-between gap-3 mb-2">
            <span id="offline-stats" class="text-sm text-navy-light">${t.settings.offlineCalculating}</span>
            <div class="flex gap-2">
              <button id="offline-preload" class="bg-gold text-navy rounded px-3 py-1 text-sm font-bold hover:bg-gold-dark transition-colors">${t.settings.offlinePreload}</button>
              <button id="offline-clear" class="bg-red text-parchment rounded px-3 py-1 text-sm hover:bg-red-dark transition-colors">${t.settings.offlineClearCache}</button>
            </div>
          </div>
          <div id="offline-progress" class="hidden">
            <div class="w-full bg-parchment-dark rounded-full h-2 mb-1">
              <div id="offline-progress-bar" class="bg-gold h-2 rounded-full" style="width: 0%"></div>
            </div>
            <p id="offline-progress-text" class="text-xs text-navy-light">0 / 0 ${t.settings.offlineDataTypes}</p>
          </div>
        </div>

        <!-- About -->
        <div class="mt-8 pt-6 border-t border-gold/20">
          <h3 class="text-lg font-bold text-red mb-2">${t.settings.about}</h3>
          <p class="text-sm text-navy-light">
            <a href="https://github.com/anttro/ponomar-pwa" target="_blank" rel="noopener" class="underline hover:text-gold">${t.settings.aboutAppName}</a>${t.settings.aboutText}
          </p>
          <p class="text-xs text-navy-light mt-2">
            <a href="https://github.com/typiconman/ponomar" target="_blank" rel="noopener" class="underline hover:text-gold">
              ${t.settings.aboutLicense}
            </a>
          </p>
        </div>
      </div>
    `;

    // Load default Bible versions dynamically
    (async () => {
      try {
        const resp = await fetch('/data/bible/versions.json');
        const versions = await resp.json();
        const userLang = this.settings.language;

        // Sort by language priority
        versions.sort((a: any, b: any) => {
          const pa = versionPriority(a.language, userLang);
          const pb = versionPriority(b.language, userLang);
          return pa - pb || a.name.localeCompare(b.name);
        });

        // Build options in priority order
        const select = document.getElementById('default-bible') as HTMLSelectElement;
        if (select) {
          select.innerHTML = versions.map((v: any) => {
              const shortId = v.id.split('/').pop();
              const size = OfflineManager.getBibleSize(v.id);
              const comment = size ? ` (${size})` : '';
              return `<option value="${shortId}" ${this.settings.defaultBibleVersion === shortId ? 'selected' : ''}>${v.name}${comment}</option>`;
            }).join('');
        }
      } catch {}
    })();

    // Event listeners
    document.getElementById('language')?.addEventListener('change', (e) => {
      this.settings.language = (e.target as HTMLSelectElement).value;
      this.settings.defaultBibleVersion = defaultBibleForLanguage(this.settings.language);
      saveSettings(this.settings);
      const bibleSelect = document.getElementById('default-bible') as HTMLSelectElement | null;
      if (bibleSelect) bibleSelect.value = this.settings.defaultBibleVersion;
      this.onLanguageChange?.();
    });

    document.getElementById('cu-font')?.addEventListener('change', (e) => {
      this.settings.cuFont = (e.target as HTMLSelectElement).value;
      saveSettings(this.settings);
      this.updateFontPreview();
    });

    document.getElementById('font-size')?.addEventListener('input', (e) => {
      this.settings.fontSize = parseInt((e.target as HTMLInputElement).value, 10);
      document.getElementById('font-size-value')!.textContent = `${this.settings.fontSize}px`;
      document.documentElement.style.setProperty('--liturgical-font-size', this.settings.fontSize + 'px');
      this.updateFontPreview();
      saveSettings(this.settings);
    });

    document.getElementById('theme')?.addEventListener('change', (e) => {
      this.settings.theme = (e.target as HTMLSelectElement).value;
      saveSettings(this.settings);
      document.documentElement.className = 'theme-' + this.settings.theme;
      const chromeColor = getComputedStyle(document.documentElement).getPropertyValue('--clr-browser-chrome').trim();
      if (chromeColor) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chromeColor);
      }
    });

    document.getElementById('default-bible')?.addEventListener('change', (e) => {
      this.settings.defaultBibleVersion = (e.target as HTMLSelectElement).value;
      saveSettings(this.settings);
    });

    document.getElementById('show-verses')?.addEventListener('change', (e) => {
      this.settings.showVerseNumbers = (e.target as HTMLInputElement).checked;
      saveSettings(this.settings);
    });

    document.getElementById('verse-newline')?.addEventListener('change', (e) => {
      this.settings.verseNewLine = (e.target as HTMLInputElement).checked;
      saveSettings(this.settings);
    });

    document.querySelectorAll('input[name="calendar-type"]').forEach(el => {
      el.addEventListener('change', (e) => {
        this.settings.calendarType = (e.target as HTMLInputElement).value as 'julian' | 'gregorian';
        saveSettings(this.settings);
      });
    });
    document.getElementById('install-pwa')?.addEventListener('click', async () => {
      const prompt = (window as any).__deferredPrompt;
      if (prompt) {
        prompt.prompt();
        await prompt.userChoice;
        (window as any).__deferredPrompt = null;
        document.getElementById('install-pwa')?.remove();
      }
    });

    // Location
    const saveLatLng = () => {
      const lat = parseFloat((document.getElementById('latitude') as HTMLInputElement)?.value);
      const lng = parseFloat((document.getElementById('longitude') as HTMLInputElement)?.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.settings.latitude = lat;
        this.settings.longitude = lng;
        saveSettings(this.settings);
      }
    };
    document.getElementById('latitude')?.addEventListener('change', saveLatLng);
    document.getElementById('longitude')?.addEventListener('change', saveLatLng);
    document.getElementById('request-location')?.addEventListener('click', () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.settings.latitude = Math.round(pos.coords.latitude * 10000) / 10000;
            this.settings.longitude = Math.round(pos.coords.longitude * 10000) / 10000;
            saveSettings(this.settings);
            (document.getElementById('latitude') as HTMLInputElement).value = String(this.settings.latitude);
            (document.getElementById('longitude') as HTMLInputElement).value = String(this.settings.longitude);
          },
          () => alert('Could not get location. Make sure location access is allowed.')
        );
      } else {
        alert('Geolocation is not available in this browser.');
      }
    });

    // Bible translations expand/collapse via Bible row
    document.getElementById('bible-row')?.addEventListener('click', async () => {
      const container = document.getElementById('bible-translations');
      const chevron = document.getElementById('bible-chevron');
      if (!container || !chevron) return;
      const isHidden = container.classList.contains('hidden');
      if (isHidden) {
        // Load translations on first expand
        if (container.innerHTML === '') {
          try {
            const resp = await fetch('/data/bible/versions.json');
            const versions = await resp.json();
            const userLang = this.settings.language;
            versions.sort((a: any, b: any) => {
              const pa = versionPriority(a.language, userLang);
              const pb = versionPriority(b.language, userLang);
              return pa - pb || a.name.localeCompare(b.name);
            });
            const html = await Promise.all(versions.map(async (v: any) => {
              const firstBook = v.books?.[0]?.id;
              let isCached = false;
              if (firstBook) {
                isCached = (await DataCache.get(`url:/data/${v.id}/${firstBook}.text`)) !== null;
              }
              return `
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" value="${v.id}" class="bible-trans accent-gold" ${isCached ? 'checked' : ''}>
                  <span class="text-xs text-navy">${v.name}</span>
                  <span class="text-[10px] text-navy-light">(${OfflineManager.getBibleSize(v.id) || '?'})</span>
                </label>
              `;
            }));
            container.innerHTML = `
              <div class="mb-1">
                <button id="select-all-bible" class="text-xs text-blue-600 underline hover:text-blue-800 cursor-pointer">${t.settings.offlineSelectAll}</button>
              </div>
            ` + html.join('');
            document.getElementById('select-all-bible')?.addEventListener('click', () => {
              document.querySelectorAll('.bible-trans').forEach(el => {
                (el as HTMLInputElement).checked = true;
              });
            });
          } catch {}
        }
        container.classList.remove('hidden');
        chevron.textContent = '▼';
      } else {
        container.classList.add('hidden');
        chevron.textContent = '▶';
      }
    });

    // Offline content - auto-select ru+cu when ru is selected
    document.querySelectorAll('.offline-lang').forEach(el => {
      el.addEventListener('change', () => {
        const ruChecked = (document.querySelector('.offline-lang[value="ru"]') as HTMLInputElement)?.checked;
        const cuCheckbox = document.querySelector('.offline-lang[value="cu"]') as HTMLInputElement;
        if (ruChecked && cuCheckbox) {
          cuCheckbox.checked = true;
        }
      });
    });

    // Preload button
    document.getElementById('offline-preload')?.addEventListener('click', async () => {
      const selectedLangs = Array.from(document.querySelectorAll('.offline-lang:checked'))
        .map(el => (el as HTMLInputElement).value);
      const selectedTypes = Array.from(document.querySelectorAll('.offline-type:checked'))
        .map(el => (el as HTMLInputElement).value) as ('calendar' | 'bible')[];

      if (selectedLangs.length === 0) {
        const progressDiv = document.getElementById('offline-progress');
        if (progressDiv) progressDiv.classList.remove('hidden');
        const progressText = document.getElementById('offline-progress-text');
        if (progressText) progressText.textContent = t.settings.offlineSelectLang;
        return;
      }

      const progressDiv = document.getElementById('offline-progress');
      const progressBar = document.getElementById('offline-progress-bar');
      const progressText = document.getElementById('offline-progress-text');
      if (progressDiv) progressDiv.classList.remove('hidden');

      const bibleTrans = Array.from(document.querySelectorAll('.bible-trans:checked'))
        .map(el => (el as HTMLInputElement).value);

      // Start preloading in background
      OfflineManager.preload({
        languages: selectedLangs,
        types: selectedTypes,
        bibleTranslations: bibleTrans,
      }).then((prog) => {
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) {
          if (prog.failed > 0) {
            progressText.textContent = `${t.settings.offlineDone} ${prog.failed} ${t.settings.offlineFailed}`;
          } else {
            progressText.textContent = t.settings.offlineDone;
          }
        }
        OfflineManager.getStats().then(stats => {
          const statsEl = document.getElementById('offline-stats');
          if (statsEl) {
            statsEl.textContent = t.settings.offlineCacheInfo
              .replace('{0}', OfflineManager.formatBytes(stats.usageBytes))
              .replace('{2}', String(stats.cachedFiles));
          }
        });
      });

      // Poll progress
      const pollInterval = setInterval(() => {
        const prog = OfflineManager.getProgress();
        if (prog && prog.total > 0) {
          const pct = Math.round((prog.current / prog.total) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressText) progressText.textContent = `${prog.current} / ${prog.total} ${t.settings.offlineDataTypes} — ${prog.file.substring(0, 60)}...`;
        }
        if (!prog || prog.done) clearInterval(pollInterval);
      }, 200);
    });

    // Clear cache button
    document.getElementById('offline-clear')?.addEventListener('click', async () => {
      await OfflineManager.clearCache();
      const statsEl = document.getElementById('offline-stats');
      if (statsEl) statsEl.textContent = t.settings.offlineCleared;
      const progressDiv = document.getElementById('offline-progress');
      if (progressDiv) progressDiv.classList.add('hidden');
    });

    // Show initial storage stats
    OfflineManager.getStats().then(stats => {
      const statsEl = document.getElementById('offline-stats');
      if (statsEl) {
        statsEl.textContent = t.settings.offlineCacheInfo
        .replace('{0}', OfflineManager.formatBytes(stats.usageBytes))
        .replace('{1}', OfflineManager.formatBytes(stats.quotaBytes))
        .replace('{2}', String(stats.cachedFiles));
      }
    });

    // Check cache status for each data type and set checkbox states
    (async () => {
      const checkCache = async (key: string): Promise<boolean> => {
        return (await DataCache.get(key)) !== null;
      };
      const setChecked = (selector: string, checked: boolean) => {
        const el = document.querySelector(selector) as HTMLInputElement | null;
        if (el) el.checked = checked;
      };

      // Check main types
      setChecked('.offline-type[value="calendar"]', await checkCache('url:/data/shared/fasting.json'));

      // Count cached Bible translations
      (async () => {
        try {
          const resp = await fetch('/data/bible/versions.json');
          const versions = await resp.json();
          const total = versions.length;
          let cached = 0;
          for (const v of versions) {
            const firstBook = v.books?.[0]?.id;
            if (firstBook && await checkCache(`url:/data/${v.id}/${firstBook}.text`)) {
              cached++;
            }
          }
          const countEl = document.getElementById('bible-count');
          if (countEl) countEl.textContent = `(${cached}/${total})`;
        } catch {}
      })();

      // Check language checkboxes based on cache status
      for (const lang of ['en', 'ru', 'cu']) {
        const isCached = await checkCache(`url:/data/${lang}/lives/01.json`);
        setChecked(`.offline-lang[value="${lang}"]`, isCached);
      }

      // If nothing cached, default to current interface language
      const anyChecked = document.querySelector('.offline-lang:checked');
      if (!anyChecked) {
        setChecked(`.offline-lang[value="${this.settings.language}"]`, true);
      }

      // Auto-select cu when ru is checked
      const ruChecked = (document.querySelector('.offline-lang[value="ru"]') as HTMLInputElement)?.checked;
      const cuCheckbox = document.querySelector('.offline-lang[value="cu"]') as HTMLInputElement;
      if (ruChecked && cuCheckbox) {
        cuCheckbox.checked = true;
      }

      // Auto-preload everything if triggered from first-launch offer
      if (this.action === 'autopreload') {
        document.querySelectorAll('.offline-lang').forEach(el => (el as HTMLInputElement).checked = true);
        document.querySelectorAll('.offline-type').forEach(el => (el as HTMLInputElement).checked = true);
        const bibleChevron = document.getElementById('bible-chevron');
        if (bibleChevron) bibleChevron.click();
        setTimeout(() => {
          document.querySelectorAll('.bible-trans').forEach(el => (el as HTMLInputElement).checked = true);
          document.getElementById('offline-preload')?.click();
        }, 300);
        window.history.replaceState(null, '', '#settings');
      }
    })();

    this.updateFontPreview();
  }

  private updateFontPreview() {
    const preview = document.getElementById('font-preview');
    if (preview) {
      preview.className = `${fontClass(this.settings.cuFont)} text-lg`;
      preview.style.fontSize = `${this.settings.fontSize}px`;
    }
  }
}
