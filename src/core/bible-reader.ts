/**
 * Bible Reader — parses .text files and manages Bible navigation.
 * Port of key Bible.java functionality.
 *
 * Bible.java is part of the Ponomar program.
 * Copyright 2007, 2008 Aleksandr Andreev.
 * GPL v3 — see LICENSE.
 */

// Bible types used for version metadata

export interface BiblePassage {
  bookId: string;
  chapter: number;
  verses: { num: number; text: string }[];
}

export interface ParsedReading {
  chapters: number[];
  verses: number[];
}

/**
 * Parse a passage string like "2:11-3:2, 5, 13-14" into structured data.
 */
export function parsePassage(passage: string): ParsedReading {
  const chapters: number[] = [];
  const verses: number[] = [];

  if (!passage.includes(':')) {
    // Just a chapter, e.g. "1"
    const ch = parseInt(passage, 10);
    chapters.push(ch);
    verses.push(1);
    return { chapters, verses };
  }

  // Composite passage: "2:11-3:2, 5, 13-14"
  const parts = passage.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.includes('-')) {
      // Single verse or chapter:verse
      if (trimmed.includes(':')) {
        const [ch, v] = trimmed.split(':');
        chapters.push(parseInt(ch, 10));
        verses.push(parseInt(v, 10));
      } else {
        const v = parseInt(trimmed, 10);
        chapters.push(0); // current chapter
        verses.push(v);
      }
    } else {
      // Range: "2:11-3:2" or "13-14"
      const [start, end] = trimmed.split('-');
      if (start.includes(':')) {
        const [ch, v] = start.split(':');
        chapters.push(parseInt(ch, 10));
        verses.push(parseInt(v, 10));
      } else {
        chapters.push(0);
        verses.push(parseInt(start, 10));
      }
      if (end.includes(':')) {
        const [ch, v] = end.split(':');
        chapters.push(parseInt(ch, 10));
        verses.push(parseInt(v, 10));
      } else {
        chapters.push(0);
        verses.push(parseInt(end, 10));
      }
    }
  }

  return { chapters, verses };
}

/**
 * Parse a .text file's content into structured verses.
 * Format: "#N" = chapter marker, "N|" = verse marker followed by text.
 */
export function parseTextFile(content: string): Map<number, Map<number, string>> {
  const chapters = new Map<number, Map<number, string>>();
  let currentChapter = 0;
  let currentVerses = new Map<number, string>();

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#')) {
      // Chapter marker
      if (currentChapter > 0) {
        chapters.set(currentChapter, currentVerses);
      }
      currentChapter = parseInt(trimmed.substring(1), 10);
      currentVerses = new Map();
    } else if (trimmed.includes('|')) {
      // Verse marker
      const pipeIdx = trimmed.indexOf('|');
      const verseNum = parseInt(trimmed.substring(0, pipeIdx), 10);
      const verseText = trimmed.substring(pipeIdx + 1).trim();
      currentVerses.set(verseNum, verseText);
    }
  }

  // Don't forget the last chapter
  if (currentChapter > 0) {
    chapters.set(currentChapter, currentVerses);
  }

  return chapters;
}

/**
 * Extract a passage from parsed chapter data.
 */
export function extractPassage(
  chapters: Map<number, Map<number, string>>,
  reading: ParsedReading
): { chapter: number; verse: number; text: string }[] {
  const result: { chapter: number; verse: number; text: string }[] = [];

  for (let i = 0; i < reading.chapters.length; i += 2) {
    const startCh = reading.chapters[i];
    const startV = reading.verses[i];
    const endCh = reading.chapters[i + 1] ?? startCh;
    const endV = reading.verses[i + 1] ?? -1;

    for (const [chNum, verses] of chapters) {
      if (chNum < startCh) continue;
      if (chNum > endCh) break;

      for (const [vNum, text] of verses) {
        if (chNum === startCh && vNum < startV) continue;
        if (chNum === endCh && endV > 0 && vNum > endV) continue;
        result.push({ chapter: chNum, verse: vNum, text });
      }
    }
  }

  return result;
}

/**
 * Format a passage for display.
 */
export function formatPassageHTML(
  passages: { chapter: number; verse: number; text: string }[],
  options?: { showVerseNumbers?: boolean; verseNewLine?: boolean }
): string {
  const showVerseNum = options?.showVerseNumbers ?? true;
  const verseNewLine = options?.verseNewLine ?? false;

  let html = '';
  let lastChapter = 0;

  for (const p of passages) {
    if (p.chapter !== lastChapter) {
      if (lastChapter > 0 && !verseNewLine) html += '</p>';
      if (!verseNewLine) html += '<p>';
      lastChapter = p.chapter;
    }

    let text = p.text;
    text = text.replace(/\*\*(.*?)\*\*/g, '<span class="text-red italic text-sm">$1</span>');
    text = text.replace(/\*\*/g, '');

    if (verseNewLine && p.verse > 0) {
      const num = showVerseNum ? `<sup class="text-red text-xs">${p.verse}</sup> ` : '';
      html += `<span id="v${p.chapter}-${p.verse}" class="block mt-1">${num}${text.charAt(0).toUpperCase() + text.slice(1)}</span>`;
    } else {
      const vid = p.verse > 0 ? ` id="v${p.chapter}-${p.verse}"` : '';
      if (showVerseNum && p.verse > 0) {
        html += `${vid ? `<span${vid}>` : ''}<sup class="text-red text-xs">${p.verse}</sup> ${text} ${vid ? '</span>' : ''}`;
      } else {
        html += text + ' ';
      }
    }
  }

  if (!verseNewLine && lastChapter > 0) html += '</p>';

  return html;
}

/**
 * Create a hyperlink for a Bible reading reference.
 */
export function createReadingLink(
  bookId: string,
  passage: string,
  abbrevFormat: string,
  abbreviations: Record<string, string>
): string {
  const abbrev = abbreviations[bookId] ?? bookId;
  const display = abbrevFormat
    .replace('^NAME', abbrev)
    .replace('^CNN', passage);

  return `<a href="bible://${bookId}/${passage}" class="text-blue-underline">${display}</a>`;
}
