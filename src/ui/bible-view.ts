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
import { DataCache } from '../core/data-cache';

const SETTINGS_KEY = 'ponomar-settings';
const BIBLE_STATE_KEY = 'ponomar-bible-state';
const BOOKMARKS_KEY = 'ponomar-bible-bookmarks';

interface BibleBookmark {
  id: number;
  name: string;
  versionId: string;
  bookId: string;
  chapter: number;
  verse?: number;
  created: number;
}

function loadBookmarks(): BibleBookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as BibleBookmark[];
    }
  } catch { /* ignore */ }
  return [];
}

function saveBookmarks(bookmarks: BibleBookmark[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch { /* ignore */ }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let bookmarksOutsideClickInstalled = false;

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
  private bookmarks: BibleBookmark[];
  private bookmarksOpen = false;
  private pendingScroll: { chapter: number; verse: number } | null = null;

  constructor(container: HTMLElement, language: LanguageCode = 'en', version = '', book = '', passage = '') {
    this.container = container;
    this.language = language;
    this.t = getTranslations(language);
    this.currentVersion = version || 'en/bible/kjv';
    this.bookmarks = loadBookmarks();

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
      const versions = await DataCache.fetchWithFallback<typeof this.versions>('/data/bible/versions.json');
      if (!versions || !Array.isArray(versions) || versions.length === 0) throw new Error('unavailable');
      this.versions = versions;
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
        <div class="bg-surface/50 border border-gold/20 rounded-lg p-3 flex items-center gap-4 flex-wrap">
          <select id="version-select" class="appearance-none bg-surface text-navy border border-gold/20 rounded px-2 py-1 text-base">
            ${this.versions.map(v =>
              `<option value="${v.id}" ${v.id === this.currentVersion ? 'selected' : ''}>${v.name}</option>`
            ).join('')}
          </select>
          <select id="book-select" class="appearance-none bg-surface text-navy border border-gold/20 rounded px-2 py-1 text-base">
            ${this.getBooksForVersion().map(b =>
              `<option value="${b.id}" ${b.id === this.currentBook ? 'selected' : ''}>${b.name}</option>`
            ).join('')}
          </select>
          <div class="flex items-center gap-1">
            <button id="prev-chapter" class="bg-surface/50 text-navy border border-gold/20 rounded px-2 py-1 text-base hover:bg-gold/20 disabled:opacity-40">◀</button>
            <select id="chapter-select" class="appearance-none bg-surface text-navy border border-gold/20 rounded px-2 py-1 text-base">
            </select>
            <button id="next-chapter" class="bg-surface/50 text-navy border border-gold/20 rounded px-2 py-1 text-base hover:bg-gold/20 disabled:opacity-40">▶</button>
          </div>
          <div class="relative ml-auto">
            <button id="bookmark-btn" class="bg-surface/50 text-navy border border-gold/20 rounded px-2 py-1 text-base hover:bg-gold/20" title="${this.t.bible.bookmarkAdd}">🔖</button>
            <div id="bookmark-panel" class="${this.bookmarksOpen ? 'flex flex-col' : 'hidden'} absolute right-0 top-full mt-1 z-50 min-w-64 rounded-lg bg-dropdown-bg shadow-xl p-2 gap-1 text-header-text"></div>
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

    document.getElementById('bookmark-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.bookmarksOpen = !this.bookmarksOpen;
      const panel = document.getElementById('bookmark-panel');
      if (panel) {
        if (this.bookmarksOpen) {
          panel.classList.remove('hidden');
          panel.classList.add('flex', 'flex-col');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('flex', 'flex-col');
        }
      }
      if (this.bookmarksOpen) this.renderBookmarkPanel();
    });

    if (!bookmarksOutsideClickInstalled) {
      bookmarksOutsideClickInstalled = true;
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('#bookmark-panel') || target.closest('#bookmark-btn')) return;
        const panel = document.getElementById('bookmark-panel');
        if (panel && !panel.classList.contains('hidden')) {
          panel.classList.add('hidden');
          panel.classList.remove('flex', 'flex-col');
        }
      });
    }

    this.renderBookmarkPanel();
  }

  private renderBookmarkPanel() {
    const panel = document.getElementById('bookmark-panel');
    if (!panel) return;
    const t = this.t.bible;
    const rows = [...this.bookmarks].sort((a, b) => b.created - a.created).map(b => `
      <div class="flex items-center rounded px-1 py-1 hover:bg-white/10">
        <button class="bookmark-jump flex-1 min-w-0 text-left text-base truncate cursor-pointer py-1 pr-2 rounded active:bg-white/15" data-id="${b.id}" title="${escapeHtml(b.name)}">${escapeHtml(b.name)}</button>
        <div class="shrink-0 flex items-center gap-1 border-l border-gold/25 pl-2 ml-1">
          <button class="bookmark-rename w-8 h-8 flex items-center justify-center text-base rounded-md bg-white/5 border border-white/15 active:bg-white/15 cursor-pointer" data-id="${b.id}">✏</button>
          <button class="bookmark-delete w-8 h-8 flex items-center justify-center text-base rounded-md bg-white/5 border border-white/15 active:bg-white/15 cursor-pointer" data-id="${b.id}">✕</button>
        </div>
      </div>
    `).join('');

    panel.innerHTML = `
      <button id="bookmark-add" class="w-full text-left bg-white/10 border border-gold/40 rounded px-2 py-1.5 text-base font-bold hover:bg-white/20 cursor-pointer">＋ ${t.bookmarkAdd}</button>
      ${rows ? `<div class="border-t border-gold/20 my-1"></div>${rows}` : `<p class="text-sm italic opacity-70 px-2 py-1">${t.bookmarkEmpty}</p>`}
    `;

    document.getElementById('bookmark-add')?.addEventListener('click', () => {
      this.addBookmarkFromCurrentPosition();
    });
    panel.querySelectorAll('.bookmark-jump').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt((el as HTMLElement).getAttribute('data-id')!, 10);
        const bm = this.bookmarks.find(x => x.id === id);
        if (bm) this.jumpToBookmark(bm);
      });
    });
    panel.querySelectorAll('.bookmark-rename').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt((el as HTMLElement).getAttribute('data-id')!, 10);
        this.renameBookmark(id);
      });
    });
    panel.querySelectorAll('.bookmark-delete').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt((el as HTMLElement).getAttribute('data-id')!, 10);
        this.deleteBookmark(id);
      });
    });
  }

  private versionShort(versionId: string): string {
    const v = this.versions.find(x => x.id === versionId);
    const name = v?.name ?? '';
    if (!name) return versionId.split('/').pop() || versionId;
    const m = name.match(/\(([^)]+)\)\s*$/);
    return m ? m[1] : name;
  }

  private captureCurrentVerse(): number | undefined {
    const textEl = document.getElementById('bible-text');
    if (!textEl) return undefined;
    const containerTop = textEl.getBoundingClientRect().top;
    let current: number | null = null;
    textEl.querySelectorAll<HTMLElement>('[id^="v"]').forEach(el => {
      const m = el.id.match(/^v(\d+)-(\d+)$/);
      if (!m) return;
      if (el.getBoundingClientRect().top <= containerTop + 8) {
        current = parseInt(m[2], 10);
      }
    });
    return current ?? undefined;
  }

  private addBookmarkFromCurrentPosition() {
    const chapter = parseInt(this.currentPassage, 10) || 1;
    const verse = this.captureCurrentVerse();
    const book = this.getBooksForVersion().find(b => b.id === this.currentBook);
    const bookLabel = book?.name || this.currentBook;
    const ref = verse ? `${bookLabel} ${chapter}:${verse}` : `${bookLabel} ${chapter}`;
    const name = `${ref} (${this.versionShort(this.currentVersion)})`;
    const bm: BibleBookmark = {
      id: Date.now(),
      name,
      versionId: this.currentVersion,
      bookId: this.currentBook,
      chapter,
      verse,
      created: Date.now(),
    };
    this.bookmarks.push(bm);
    saveBookmarks(this.bookmarks);
    this.renderBookmarkPanel();
  }

  private renameBookmark(id: number) {
    const bm = this.bookmarks.find(x => x.id === id);
    if (!bm) return;
    const name = window.prompt(this.t.bible.bookmarkRename, bm.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (trimmed) bm.name = trimmed;
    saveBookmarks(this.bookmarks);
    this.renderBookmarkPanel();
  }

  private deleteBookmark(id: number) {
    this.bookmarks = this.bookmarks.filter(x => x.id !== id);
    saveBookmarks(this.bookmarks);
    this.renderBookmarkPanel();
  }

  private jumpToBookmark(bm: BibleBookmark) {
    if (this.versions.some(v => v.id === bm.versionId)) {
      this.currentVersion = bm.versionId;
      const vs = document.getElementById('version-select') as HTMLSelectElement | null;
      if (vs) vs.value = bm.versionId;
    }
    this.currentBook = bm.bookId;
    this.updateBookSelect();
    this.currentPassage = String(bm.chapter);
    this.updateChapterSelect();
    this.pendingScroll = bm.verse && bm.verse > 0 ? { chapter: bm.chapter, verse: bm.verse } : null;
    this.loadReading();
    this.closeBookmarkPanel();
  }

  private closeBookmarkPanel() {
    this.bookmarksOpen = false;
    const panel = document.getElementById('bookmark-panel');
    if (panel) {
      panel.classList.add('hidden');
      panel.classList.remove('flex', 'flex-col');
    }
  }

  private getBooksForVersion(): { id: string; name: string; chapters: number }[] {
    const version = this.versions.find(v => v.id === this.currentVersion);
    return version?.books ?? [];
  }

  private updateBookSelect() {
    const select = document.getElementById('book-select') as HTMLSelectElement;
    if (!select) return;
    const books = this.getBooksForVersion();
    if (!this.currentBook || !books.some(b => b.id === this.currentBook)) {
      this.currentBook = books[0]?.id || 'Gen';
    }
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
    const chapters = (book && Number.isInteger(book.chapters) && book.chapters > 0) ? book.chapters : 50;
    const parsedCh = parseInt(this.currentPassage, 10);
    const selectedCh = isNaN(parsedCh) || parsedCh < 1 ? 1 : parsedCh;
    select.innerHTML = Array.from({ length: chapters }, (_, i) =>
      `<option value="${i + 1}" ${i + 1 === selectedCh ? 'selected' : ''}>${i + 1}</option>`
    ).join('');
    // Sync passage to selected chapter
    this.currentPassage = select.value || '1';
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
        text = (await DataCache.fetchWithFallback<string>(`/data/${this.currentVersion}/${this.currentBook}.text`, 'text')) ?? undefined;
        if (!text) throw new Error('Not found');
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

      if (this.pendingScroll) {
        const target = this.pendingScroll;
        this.pendingScroll = null;
        requestAnimationFrame(() => {
          const el = document.getElementById(`v${target.chapter}-${target.verse}`);
          if (el) el.scrollIntoView({ block: 'start' });
        });
      }
    } catch {
      textEl.innerHTML = `
        <div class="text-center py-12">
          <p class="text-navy-light mb-4">${this.t.bible.notAvailableOffline}</p>
          <p class="text-base text-navy-light">
            ${this.t.bible.ensureDataConverted}
          </p>
        </div>
      `;
    }

    saveBibleState(this.currentVersion, this.currentBook, this.currentPassage);
    localStorage.setItem('ponomar-last-bible-version', this.currentVersion);
  }
}