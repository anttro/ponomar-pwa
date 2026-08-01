/**
 * Settings view — language, font, and display preferences.
 */

import { getTranslations, type LanguageCode } from '../core/i18n';
import { OfflineManager } from '../core/offline-manager';

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
  defaultBibleVersion: string;
  showVerseNumbers: boolean;
  verseNewLine: boolean;
  calendarType: 'julian' | 'gregorian';
  serviceRole: 'priest' | 'reader' | 'auto';
}

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  cuFont: 'Ponomar',
  fontSize: 16,
  defaultBibleVersion: 'kjv',
  showVerseNumbers: true,
  verseNewLine: false,
  calendarType: 'julian',
  serviceRole: 'priest',
};

function defaultBibleForLanguage(lang: string): string {
  const map: Record<string, string> = { en: 'kjv', ru: 'synod', cu: 'elis' };
  return map[lang] || 'kjv';
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

  constructor(container: HTMLElement, onLanguageChange?: () => void) {
    this.container = container;
    this.settings = loadSettings();
    this.onLanguageChange = onLanguageChange;
  }

  render() {
    const t = getTranslations(this.settings.language as LanguageCode);

    this.container.innerHTML = `
      <div class="p-6 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-red mb-6">${t.settings.title}</h2>

        <!-- Language -->
        <div class="mb-6">
          <label class="block text-sm font-bold text-navy mb-2">${t.settings.language}</label>
          <select id="language" class="w-full border border-gold/30 rounded p-2 bg-white text-navy">
            ${LANGUAGES.map(l => `
              <option value="${l.code}" ${l.code === this.settings.language ? 'selected' : ''}>
                ${l.name} (${l.local})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Font Settings -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.fontSettings}</h3>

          <div class="mb-3">
            <select id="cu-font" class="w-full border border-gold/30 rounded p-2 bg-white text-navy">
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

        <!-- Bible Settings -->
        <div class="mb-6">
          <h3 class="text-lg font-bold text-red mb-3">${t.settings.bibleSettings}</h3>

          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-1">${t.settings.defaultTranslation}</label>
            <select id="default-bible" class="w-full border border-gold/30 rounded p-2 bg-white text-navy">
              <optgroup label="English">
                <option value="kjv" ${this.settings.defaultBibleVersion === 'kjv' ? 'selected' : ''}>KJV (${t.settings.bibleComments.fullBible})</option>
                <option value="brenton" ${this.settings.defaultBibleVersion === 'brenton' ? 'selected' : ''}>Brenton LXX (${t.settings.bibleComments.otOnly})</option>
                <option value="nonkjv" ${this.settings.defaultBibleVersion === 'nonkjv' ? 'selected' : ''}>Modern (${t.settings.bibleComments.ntOnly})</option>
              </optgroup>
              <optgroup label="Русский">
                <option value="synod" ${this.settings.defaultBibleVersion === 'synod' ? 'selected' : ''}>Синодальный (${t.settings.bibleComments.fullBible})</option>
                <option value="kassian" ${this.settings.defaultBibleVersion === 'kassian' ? 'selected' : ''}>Еп. Кассиана (${t.settings.bibleComments.ntOnly})</option>
                <option value="yungerov" ${this.settings.defaultBibleVersion === 'yungerov' ? 'selected' : ''}>Юнгеров (${t.settings.bibleComments.otProphets})</option>
              </optgroup>
              <optgroup label="Церковнославянский">
                <option value="elis" ${this.settings.defaultBibleVersion === 'elis' ? 'selected' : ''}>Елисаветинская (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="Ἑλληνικά">
                <option value="spt" ${this.settings.defaultBibleVersion === 'spt' ? 'selected' : ''}>Ἡ Ἁγία Γραφή (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="Français">
                <option value="ls" ${this.settings.defaultBibleVersion === 'ls' ? 'selected' : ''}>Louis Segond (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="Latina">
                <option value="vulgate" ${this.settings.defaultBibleVersion === 'vulgate' ? 'selected' : ''}>Vulgata (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="简体中文">
                <option value="cuv" ${this.settings.defaultBibleVersion === 'cuv' ? 'selected' : ''}>简体圣经 (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="正體中文">
                <option value="cuv-hant" ${this.settings.defaultBibleVersion === 'cuv-hant' ? 'selected' : ''}>正體聖經 (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
              <optgroup label="العربية">
                <option value="svd" ${this.settings.defaultBibleVersion === 'svd' ? 'selected' : ''}>Smith - van Dyck (${t.settings.bibleComments.fullBible})</option>
              </optgroup>
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
          <h3 class="text-lg font-bold text-red mb-3">Offline Content</h3>

          <!-- Language selection for offline -->
          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-2">Languages to cache</label>
            <div id="offline-langs" class="flex flex-wrap gap-3">
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="ru" class="offline-lang accent-gold"> <span class="text-sm">Русский</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="cu" class="offline-lang accent-gold"> <span class="text-sm">Церковнославянский</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="en" class="offline-lang accent-gold"> <span class="text-sm">English</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="el" class="offline-lang accent-gold"> <span class="text-sm">Ελληνικά</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="fr" class="offline-lang accent-gold"> <span class="text-sm">Français</span>
              </label>
            </div>
          </div>

          <!-- Data type selection -->
          <div class="mb-3">
            <label class="block text-sm font-bold text-navy mb-2">Data to cache</label>
            <div id="offline-types" class="flex flex-wrap gap-3">
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="lives" checked class="offline-type accent-gold"> <span class="text-sm">Lives</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="calendar" checked class="offline-type accent-gold"> <span class="text-sm">Calendar</span>
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" value="menaion" class="offline-type accent-gold"> <span class="text-sm">Menaion</span>
              </label>
            </div>
          </div>

          <!-- Storage info and controls -->
          <div class="flex items-center justify-between gap-3 mb-2">
            <span id="offline-stats" class="text-sm text-navy-light">Calculating storage...</span>
            <div class="flex gap-2">
              <button id="offline-preload" class="bg-gold text-navy rounded px-3 py-1 text-sm font-bold hover:bg-gold-dark transition-colors">Preload</button>
              <button id="offline-clear" class="bg-red text-parchment rounded px-3 py-1 text-sm hover:bg-red-dark transition-colors">Clear cache</button>
            </div>
          </div>
          <div id="offline-progress" class="hidden">
            <div class="w-full bg-parchment-dark rounded-full h-2 mb-1">
              <div id="offline-progress-bar" class="bg-gold h-2 rounded-full" style="width: 0%"></div>
            </div>
            <p id="offline-progress-text" class="text-xs text-navy-light">0 / 0 files</p>
          </div>
        </div>

        <!-- About -->
        <div class="mt-8 pt-6 border-t border-gold/20">
          <h3 class="text-lg font-bold text-red mb-2">${t.settings.about}</h3>
          <p class="text-sm text-navy-light">
            ${t.settings.aboutText}
          </p>
          <p class="text-xs text-navy-light mt-2">
            <a href="https://github.com/typiconman/ponomar" target="_blank" rel="noopener" class="underline hover:text-gold">
              ${t.settings.aboutLicense}
            </a>
          </p>
        </div>
      </div>
    `;

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
      saveSettings(this.settings);
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
        .map(el => (el as HTMLInputElement).value) as ('lives' | 'bible' | 'calendar' | 'menaion')[];

      if (selectedLangs.length === 0) {
        const progressText = document.getElementById('offline-progress-text');
        if (progressText) progressText.textContent = 'Please select at least one language.';
        return;
      }

      const progressDiv = document.getElementById('offline-progress');
      const progressBar = document.getElementById('offline-progress-bar');
      const progressText = document.getElementById('offline-progress-text');
      if (progressDiv) progressDiv.classList.remove('hidden');

      // Start preloading in background
      OfflineManager.preload({ languages: selectedLangs, types: selectedTypes }).then(() => {
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = 'Done! Data cached for offline use.';
        OfflineManager.getStats().then(stats => {
          const statsEl = document.getElementById('offline-stats');
          if (statsEl) {
            statsEl.textContent = `Cache: ${OfflineManager.formatBytes(stats.usageBytes)} / ${OfflineManager.formatBytes(stats.quotaBytes)} (${stats.cachedFiles} files)`;
          }
        });
      });

      // Poll progress
      const pollInterval = setInterval(() => {
        const prog = OfflineManager.getProgress();
        if (prog && prog.total > 0) {
          const pct = Math.round((prog.current / prog.total) * 100);
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressText) progressText.textContent = `${prog.current} / ${prog.total} files — ${prog.file.substring(0, 60)}...`;
        }
        if (!prog || prog.done) clearInterval(pollInterval);
      }, 200);
    });

    // Clear cache button
    document.getElementById('offline-clear')?.addEventListener('click', async () => {
      await OfflineManager.clearCache();
      const statsEl = document.getElementById('offline-stats');
      if (statsEl) statsEl.textContent = 'Cache cleared.';
      const progressDiv = document.getElementById('offline-progress');
      if (progressDiv) progressDiv.classList.add('hidden');
    });

    // Show initial storage stats
    OfflineManager.getStats().then(stats => {
      const statsEl = document.getElementById('offline-stats');
      if (statsEl) {
        statsEl.textContent = `Cache: ${OfflineManager.formatBytes(stats.usageBytes)} / ${OfflineManager.formatBytes(stats.quotaBytes)} (${stats.cachedFiles} files)`;
      }
    });

    this.updateFontPreview();
  }

  private updateFontPreview() {
    const preview = document.getElementById('font-preview');
    if (preview) {
      preview.className = `${fontClass(this.settings.cuFont)} text-lg`;
    }
  }
}
