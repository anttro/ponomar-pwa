/**
 * Bible view — reader with all translation variants.
 */

import {
  parsePassage,
  parseTextFile,
  extractPassage,
  formatPassageHTML,
} from '../core/bible-reader';
import { getTranslations, type LanguageCode } from '../core/i18n';

const SETTINGS_KEY = 'ponomar-settings';
const BIBLE_STATE_KEY = 'ponomar-bible-state';

function loadBibleState(version: string): { book: string; passage: string } | null {
  try {
    const stored = localStorage.getItem(BIBLE_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const pos = parsed.positions?.[version];
      if (pos?.book && pos?.passage) return pos;
    }
  } catch { /* ignore */ }
  return null;
}

function saveBibleState(version: string, book: string, passage: string) {
  try {
    const stored = localStorage.getItem(BIBLE_STATE_KEY);
    const state: { positions: Record<string, { book: string; passage: string }> } = stored ? JSON.parse(stored) : { positions: {} };
    state.positions[version] = { book, passage };
    localStorage.setItem(BIBLE_STATE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadSettings(): { cuFont: string; showVerseNumbers: boolean; verseNewLine: boolean } {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    const defaults = { cuFont: 'Ponomar', showVerseNumbers: true, verseNewLine: false };
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.usePonomarFont !== undefined) {
        parsed.cuFont = parsed.usePonomarFont ? 'Ponomar' : '';
        delete parsed.usePonomarFont;
      }
      return { ...defaults, ...parsed };
    }
  } catch { /* ignore */ }
  return { cuFont: 'Ponomar', showVerseNumbers: true, verseNewLine: false };
}

const FONT_CSS_MAP: Record<string, string> = {
  Ponomar: 'font-ponomar',
  Fedorovsk: 'font-fedrovsk',
  Indiction: 'font-indiction',
  Menaion: 'font-menaion',
  Monomakh: 'font-monomakh',
  Triodion: 'font-triodion',
  Vilnius: 'font-vilnius',
  Voskresensky: 'font-voskresensky',
};

function fontClass(fontName: string): string {
  return FONT_CSS_MAP[fontName] || (fontName ? '' : 'font-system-slavonic');
}

interface BibleVersion {
  id: string;
  name: string;
  language: string;
  books: { id: string; name: string; short: string; chapters: number }[];
}

export class BibleView {
  private container: HTMLElement;
  private currentVersion: string;
  private currentBook: string;
  private currentPassage: string;
  private versions: BibleVersion[] = [];
  private loadedText: Map<string, string> = new Map();
  private t: ReturnType<typeof getTranslations>;
  private language: LanguageCode;

  constructor(container: HTMLElement, language: LanguageCode = 'en', version = '', book = '', passage = '') {
    this.container = container;
    this.language = language;
    this.t = getTranslations(language);
    this.currentVersion = version || 'en/bible/kjv';

    if (!book && !passage) {
      const saved = loadBibleState(this.currentVersion);
      if (saved) { book = saved.book; passage = saved.passage; }
    }

    this.currentBook = book || 'Gen';
    this.currentPassage = passage || '1';
    this.loadVersions();
  }

  private async loadVersions() {
    try {
      const resp = await fetch('/data/bible/versions.json');
      this.versions = await resp.json();
      this.sortVersionsByLanguage();
    } catch {
      this.versions = [
        { id: 'en/bible/kjv', name: 'English (KJV)', language: 'en', books: [] },
        { id: 'ru/bible/synod', name: 'Русский (Синодальный)', language: 'ru', books: [] },
        { id: 'cu/bible/elis', name: 'Церковнославянская', language: 'cu', books: [] },
      ];
    }
  }

  private sortVersionsByLanguage() {
    const lang = this.language;
    const priority = (l: string) => {
      if (l === lang) return 0;
      if ((lang === 'ru' || lang === 'cu') && (l === 'ru' || l === 'cu')) return 1;
      return 2;
    };
    this.versions.sort((a, b) => {
      const pa = priority(a.language);
      const pb = priority(b.language);
      return pa - pb || a.name.localeCompare(b.name);
    });
  }

  async render() {
    await this.loadVersions();

    this.container.innerHTML = `
      <div class="flex flex-col h-full">
        <div class="bg-navy text-parchment p-3 flex items-center gap-4 flex-wrap">
          <select id="version-select" class="bg-navy-light text-parchment border border-gold/30 rounded px-2 py-1 text-sm">
            ${this.versions.map(v =>
              `<option value="${v.id}" ${v.id === this.currentVersion ? 'selected' : ''}>${v.name}</option>`
            ).join('')}
          </select>
          <select id="book-select" class="bg-navy-light text-parchment border border-gold/30 rounded px-2 py-1 text-sm">
            ${this.getBooksForVersion().map(b =>
              `<option value="${b.id}" ${b.id === this.currentBook ? 'selected' : ''}>${b.name}</option>`
            ).join('')}
          </select>
          <div class="flex items-center gap-1">
            <button id="prev-chapter" class="bg-navy-light text-parchment border border-gold/30 rounded px-2 py-1 text-sm hover:bg-gold/20 disabled:opacity-40">◀</button>
            <select id="chapter-select" class="bg-navy-light text-parchment border border-gold/30 rounded px-2 py-1 text-sm">
            </select>
            <button id="next-chapter" class="bg-navy-light text-parchment border border-gold/30 rounded px-2 py-1 text-sm hover:bg-gold/20 disabled:opacity-40">▶</button>
          </div>
        </div>

        <div id="bible-text" class="flex-1 overflow-auto p-2 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto liturgical-text">
          <p class="text-navy-light italic">${this.t.bible.selectBook}</p>
        </div>
      </div>
    `;

    this.updateChapterSelect();
    this.loadReading();

    document.getElementById('version-select')?.addEventListener('change', (e) => {
      this.currentVersion = (e.target as HTMLSelectElement).value;
      const books = this.getBooksForVersion();
      const sameBook = books.find(b => b.id === this.currentBook);
      if (sameBook) {
        const ch = parseInt(this.currentPassage, 10);
        if (ch > sameBook.chapters) this.currentPassage = '1';
      } else {
        this.currentBook = books[0]?.id || 'Gen';
        this.currentPassage = '1';
      }
      this.updateBookSelect();
      this.loadReading();
    });

    document.getElementById('book-select')?.addEventListener('change', (e) => {
      this.currentBook = (e.target as HTMLSelectElement).value;
      this.currentPassage = '1';
      this.updateChapterSelect();
      this.loadReading();
    });

    document.getElementById('chapter-select')?.addEventListener('change', (e) => {
      this.currentPassage = (e.target as HTMLSelectElement).value;
      this.loadReading();
    });

    document.getElementById('prev-chapter')?.addEventListener('click', () => {
      const ch = parseInt(this.currentPassage, 10);
      if (ch > 1) {
        this.currentPassage = String(ch - 1);
        this.updateChapterSelect();
        this.loadReading();
      } else {
        const books = this.getBooksForVersion();
        const idx = books.findIndex(b => b.id === this.currentBook);
        if (idx > 0) {
          const prevBook = books[idx - 1];
          this.currentBook = prevBook.id;
          this.currentPassage = String(prevBook.chapters);
          this.updateBookSelect();
          this.loadReading();
        }
      }
    });

    document.getElementById('next-chapter')?.addEventListener('click', () => {
      const ch = parseInt(this.currentPassage, 10);
      const books = this.getBooksForVersion();
      const book = books.find(b => b.id === this.currentBook);
      const maxCh = book?.chapters ?? 50;
      if (ch < maxCh) {
        this.currentPassage = String(ch + 1);
        this.updateChapterSelect();
        this.loadReading();
      } else {
        const idx = books.findIndex(b => b.id === this.currentBook);
        if (idx < books.length - 1) {
          const nextBook = books[idx + 1];
          this.currentBook = nextBook.id;
          this.currentPassage = '1';
          this.updateBookSelect();
          this.loadReading();
        }
      }
    });
  }

  private getBooksForVersion(): { id: string; name: string; chapters: number }[] {
    const version = this.versions.find(v => v.id === this.currentVersion);
    return version?.books ?? [];
  }

  private updateBookSelect() {
    const select = document.getElementById('book-select') as HTMLSelectElement;
    if (!select) return;
    const books = this.getBooksForVersion();
    select.innerHTML = books.map(b =>
      `<option value="${b.id}" ${b.id === this.currentBook ? 'selected' : ''}>${b.name}</option>`
    ).join('');
    this.updateChapterSelect();
  }

  private updateChapterSelect() {
    const select = document.getElementById('chapter-select') as HTMLSelectElement;
    if (!select) return;
    const books = this.getBooksForVersion();
    const book = books.find(b => b.id === this.currentBook);
    const chapters = book?.chapters ?? 50;
    select.innerHTML = Array.from({ length: chapters }, (_, i) =>
      `<option value="${i + 1}" ${i + 1 === parseInt(this.currentPassage, 10) ? 'selected' : ''}>${i + 1}</option>`
    ).join('');
    // Sync passage to selected chapter
    this.currentPassage = select.value;
  }

  private async loadReading() {
    const textEl = document.getElementById('bible-text');
    if (!textEl) return;

    textEl.innerHTML = `<p class="text-navy-light italic">${this.t.loading}</p>`;

    try {
      const cacheKey = `${this.currentVersion}/${this.currentBook}`;
      let text = this.loadedText.get(cacheKey);

      if (!text) {
        // Version IDs are full paths like "en/bible/kjv"
        const resp = await fetch(`/data/${this.currentVersion}/${this.currentBook}.text`);
        if (!resp.ok) throw new Error('Not found');
        text = await resp.text();
        this.loadedText.set(cacheKey, text);
      }

      const chapters = parseTextFile(text!);
      const reading = parsePassage(this.currentPassage);
      const passages = extractPassage(chapters, reading);
      const settings = loadSettings();
      const html = formatPassageHTML(passages, { showVerseNumbers: settings.showVerseNumbers, verseNewLine: settings.verseNewLine });

      // Apply Ponomar font for Church Slavonic texts
      const version = this.versions.find(v => v.id === this.currentVersion);
      const isChurchSlavonic = version?.language === 'cu';
      const fnClass = isChurchSlavonic ? fontClass(settings.cuFont) : '';

      textEl.className = `flex-1 overflow-auto p-2 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto liturgical-text ${fnClass}`;
      textEl.innerHTML = html || `<p class="text-navy-light">${this.t.bible.noTextFound}</p>`;
    } catch {
      textEl.innerHTML = `
        <div class="text-center py-12">
          <p class="text-navy-light mb-4">${this.t.bible.notAvailableOffline}</p>
          <p class="text-sm text-navy-light">
            ${this.t.bible.ensureDataConverted}
          </p>
        </div>
      `;
    }

    saveBibleState(this.currentVersion, this.currentBook, this.currentPassage);
    localStorage.setItem('ponomar-last-bible-version', this.currentVersion);
  }
}