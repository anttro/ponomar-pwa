/**
 * Convert bible.xml to JSON metadata for all translations.
 * Bible text .text files are copied as-is.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

const SKIP_BOOKS = new Set(['Composite']);

interface BibleBookMeta {
  id: string;
  name: string;
  short: string;
  chapters: number;
  intro?: string;
}

interface BibleVersionMeta {
  id: string;
  name: string;
  language: string;
  books: BibleBookMeta[];
}

export async function convertBibleMeta(SRC: string, OUT: string) {
  console.log('Converting Bible metadata...');

  const bibleXml = join(SRC, 'languages', 'xml', 'bible.xml');
  if (!existsSync(bibleXml)) {
    console.log('  bible.xml not found, skipping');
    return;
  }

  const data = parser.parse(readFileSync(bibleXml, 'utf-8'));
  const versions: BibleVersionMeta[] = [];

  // Root element is <BMLFILE>, <BIBLE> elements are children
  const bml = data['BMLFILE'] || data;
  const bibleNodes = bml['BIBLE'];
  if (!bibleNodes) {
    console.log('  No BIBLE elements found');
    return;
  }

  const bibleArr = Array.isArray(bibleNodes) ? bibleNodes : [bibleNodes];

  for (const bible of bibleArr) {
    // fast-xml-parser with attributeNamePrefix '@_' puts attributes as flat keys
    const id = bible['@_Id'] || bible['@_ID'] || '';
    const name = bible['@_Name'] || '';

    // Handle special case: Russian Bibles are under cu/ru/ in XML but should be ru/
    const isRussianBible = id.startsWith('cu/ru/bible/');
    const effectiveId = isRussianBible ? id.replace('cu/ru/', 'ru/') : id;
    const effectiveLang = isRussianBible ? 'ru' : effectiveId.split('/')[0];

    const version: BibleVersionMeta = {
      id: effectiveId,
      name,
      language: effectiveLang,
      books: [],
    };

    // Parse INFO attributes for display formatting
    if (bible['INFO']) {
      const infoObj = bible['INFO'] as Record<string, unknown>;
      const formatting: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(infoObj)) {
        if (k.startsWith('@_')) {
          formatting[k.slice(2)] = v;
        }
      }
      if (Object.keys(formatting).length > 0) {
        (version as Record<string, unknown>).formatting = formatting;
      }
    }

    // Parse books
    if (bible['BOOK']) {
      const bookArr = Array.isArray(bible['BOOK']) ? bible['BOOK'] : [bible['BOOK']];
      for (const book of bookArr) {
        const bookId = book['@_Id'] || book['@_ID'] || '';
        if (SKIP_BOOKS.has(bookId)) continue;
        const bookName = book['@_Name'] || '';
        const bookShort = book['@_Short'] || book['@_Abbr'] || '';
        const bookChapters = parseInt(book['@_Chapters'] || '0', 10);
        const bookIntro = book['@_Intro'] || undefined;
        const bookMeta: BibleBookMeta = {
          id: bookId,
          name: bookName,
          short: bookShort,
          chapters: bookChapters,
        };
        if (bookIntro) bookMeta.intro = bookIntro;
        version.books.push(bookMeta);
      }
    }

    versions.push(version);
  }

  // Write versions metadata
  const outDir = join(OUT, 'bible');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'versions.json'), JSON.stringify(versions, null, 2));
  console.log(`  ${versions.length} Bible versions`);

// Copy .text files for each version
  for (const ver of versions) {
    // Use the version's id directly (already normalized)
    const idParts = ver.id.split('/');
    const lang = idParts[0];
    const subPath = idParts.slice(1).join('/'); // "bible/kjv"
    const textSrc = join(SRC, 'languages', lang, subPath);

    if (!existsSync(textSrc)) continue;

    const textFiles = readdirSync(textSrc).filter(f => f.endsWith('.text') && !SKIP_BOOKS.has(f.replace('.text', '')));
    if (textFiles.length === 0) continue;

    // Fix: Russian Bibles are under cu/ru/ in source but should go to ru/ in output
    let outLang: string;
    let outSubPath: string;
    if (ver.id.startsWith('cu/ru/')) {
      outLang = 'ru';
      outSubPath = idParts.slice(2).join('/'); // Skip "cu/ru" → "bible/synod"
    } else {
      outLang = lang;
      outSubPath = subPath;
    }
    const textDst = join(OUT, outLang, outSubPath);
    mkdirSync(textDst, { recursive: true });

    for (const f of textFiles) {
      cpSync(join(textSrc, f), join(textDst, f));
    }
    console.log(`  ${ver.id}: ${textFiles.length} .text files copied to ${outLang}/`);
  }
}
