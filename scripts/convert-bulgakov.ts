/**
 * Convert Bulgakov's "Настольная книга для священно-церковнослужителей"
 * EPUB to date-keyed JSON for enrichment of ru/lives bundles.
 *
 * Only processes the Menaion section (months 01-12).
 * Keeps original pre-revolutionary orthography.
 * Resolves footnotes inline.
 * Excludes hymn texts (Troparia/Kontakia).
 *
 * Usage:
 *   npx tsx scripts/convert-bulgakov.ts <epub-path> [output.json]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const MONTH_NAMES: Record<string, string> = {
  'январь': '01', 'января': '01',
  'февраль': '02', 'февраля': '02',
  'март': '03', 'марта': '03',
  'апрель': '04', 'апреля': '04',
  'май': '05', 'мая': '05',
  'июнь': '06', 'июня': '06',
  'июль': '07', 'июля': '07',
  'август': '08', 'августа': '08',
  'сентябрь': '09', 'сентября': '09',
  'октябрь': '10', 'октября': '10',
  'ноябрь': '11', 'ноября': '11',
  'декабрь': '12', 'декабря': '12',
};

interface BulgakovEntry {
  title: string;
  html: string;
}

interface BulgakovDay {
  [dateKey: string]: BulgakovEntry[];
}

/** Strip HTML tags, collapse whitespace. */
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Clean a paragraph's HTML, resolving footnotes inline. */
function cleanParagraph(raw: string, notes: string[]): string {
  let s = raw.trim();
  // Resolve footnotes: <a href="..." title="NOTE TEXT"...><sup>[N]</sup></a>
  s = s.replace(
    /<a\s[^>]*title="([^"]*)"[^>]*>(<sup[^>]*>\[(\d+)\]<\/sup>)<\/a>/g,
    (_m: string, note: string, sup: string) => {
      notes.push(note.trim());
      return sup;
    }
  );
  // Remove remaining <a> tags (keep inner content)
  s = s.replace(/<a\s[^>]*>(.*?)<\/a>/gs, (_m: string, inner: string) => inner);
  // Strip calibre-specific classes
  s = s.replace(/<(\w+)\s[^>]*class="[^"]*calibre[^"]*"[^>]*>/g, '<$1>');
  s = s.replace(/<span\s[^>]*class="ponomar"[^>]*>(.*?)<\/span>/g, '$1');
  s = s.replace(/<br\s[^>]*class="calibre\d+"\s*\/?>/g, '<br>');
  s = s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  return `<p>${s}</p>`;
}

/** Check if a paragraph is a hymn (Troparion/Kontakion) or liturgical rubric. */
function isHymn(text: string): boolean {
  const clean = stripTags(text).replace(/^\d+\s*\.?\s*/, '').trim();
  const hymnPatterns = [
    /^Тропарь,/i, /^Кондак,/i, /^Парем\./i, /^Утр\.\s*Ев\./i,
    /^Ап\./i, /^Ев\./i, /^Совершается собор/i, /^В этот день поется/i,
    /^Совершается/i, /^Служба/i, /^См\.\s/i,
  ];
  return hymnPatterns.some(p => p.test(clean));
}

/** Check if a paragraph is a cross-reference (starts with "См." or "см."). */
function isCrossRef(text: string): boolean {
  const clean = stripTags(text).replace(/^\d+\s*\.?\s*/, '').trim();
  return /^см\.\s/i.test(clean);
}

/** Extract the day number from the start of a paragraph. */
function extractDayNum(text: string): number | null {
  const m = text.match(/<strong[^>]*>(\d+)<\/strong>\.?\s*/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Extract the title from a paragraph (first significant text after day number and ponomar span). */
function extractTitle(text: string): string {
  let s = text;
  // Remove any leading anchor tags
  s = s.replace(/^<a\s[^>]*><\/a>\s*/i, '');
  // Remove day number prefix
  s = s.replace(/^<strong[^>]*>\d+<\/strong>\.?\s*/i, '');

  // Handle ponomar span: may contain a month znamenanie (single letter) or saint name
  const ponomarMatch = s.match(/^<[^>]*>([^<]+)<\/[^>]+>\s*/);
  if (ponomarMatch) {
    let ponomarContent = ponomarMatch[1].trim();
    // If ponomar is just a single letter (with optional period), it's a znamenanie — skip entire span
    if (/^\p{L}\.?\s*$/u.test(ponomarContent)) {
      s = s.replace(/^<[^>]*>[^<]+<\/[^>]+>\s*/, '');
    } else {
      // Ponomar may contain znamenanie + title (e.g. "Л. 🕀 Срѣтенїе...")
      // Check if it starts with a single letter + period
      const znamenanieMatch = ponomarContent.match(/^(\p{L}\.)\s*(.*)$/su);
      if (znamenanieMatch) {
        // Replace the span with just the title part (remove znamenanie)
        s = s.replace(/^<[^>]*>[^<]+<\/[^>]+>\s*/, znamenanieMatch[2] + ' ');
      }
    }
  }

  // Strip all HTML tags
  s = stripTags(s);
  // Remove leading non-letter symbols (like †, 🕀, 🕂, 🕃)
  s = s.replace(/^[\s\p{P}\p{S}]+/u, '');
  // Take first 100 chars, breaking at a period where possible
  const MAX_TITLE = 100;
  if (s.length <= MAX_TITLE) return s;
  // Try to break at a period within the first 100 chars
  const periodIdx = s.lastIndexOf('.', MAX_TITLE);
  if (periodIdx > 10) return s.substring(0, periodIdx + 1);
  return s.substring(0, MAX_TITLE) + '...';
}

/** Check if text contains a month name (for heading detection). */
function findMonthName(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [name, _code] of Object.entries(MONTH_NAMES)) {
    if (lower.includes(name)) return name;
  }
  return null;
}

export async function convertBulgakov(epubPath: string, outputPath: string): Promise<BulgakovDay> {
  const tmpDir = join(dirname(outputPath), 'tmp_bulgakov');
  if (existsSync(tmpDir)) {
    execSync(`rm -rf "${tmpDir}"`);
  }
  mkdirSync(tmpDir, { recursive: true });

  console.log(`Extracting EPUB: ${epubPath}`);
  execSync(`unzip -o "${epubPath}" -d "${tmpDir}" > /dev/null 2>&1`);

  const out: BulgakovDay = {};
  let currentMonth: string | null = null;
  let currentDay: number | null = null;
  let inMenaion = false;

  // Parse all files in order
  for (let i = 0; ; i++) {
    const fileNum = String(i).padStart(3, '0');
    const filePath = join(tmpDir, `index_split_${fileNum}.xhtml`);
    if (!existsSync(filePath)) break;

    if (i % 10 === 0) console.log(`  Processing file ${fileNum}...`);

    const html = readFileSync(filePath, 'utf-8');

    // Check for h2 headings containing month names
    // h2 looks like: <h2 ...><a...></a><a...></a>Январь <br.../></h2>
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let h2Match: RegExpExecArray | null;
    while ((h2Match = h2Regex.exec(html)) !== null) {
      const h2Content = stripTags(h2Match[1]);
      const monthName = findMonthName(h2Content);
      if (monthName) {
        currentMonth = MONTH_NAMES[monthName];
        currentDay = null;
        inMenaion = true;
        console.log(`  → Month ${currentMonth}: ${monthName} (file ${fileNum})`);
      }
    }

    // Check for section headers (Месяцеслов / Триодион)
    if (/<h1[^>]*>[\s\S]*?Месяцеслов[\s\S]*?<\/h1>/i.test(html)) {
      inMenaion = true;
      console.log(`  → Entered Месяцеслов section (file ${fileNum})`);
    }
    if (/<h1[^>]*>[\s\S]*?Триодион[\s\S]*?<\/h1>/i.test(html)) {
      inMenaion = false;
      console.log(`  → Left Месяцеслов, entered Триодион (file ${fileNum})`);
    }

    if (!inMenaion || !currentMonth) continue;

    // Extract all paragraph divs
    const paraRegex = /<div class="paragraph">([\s\S]*?)<\/div>/g;
    let paraMatch: RegExpExecArray | null;

    // We process paragraphs in order. Each paragraph may be:
    // - A new day entry (strong with day number)
    // - Continuation of current day
    // - A hymn (skipped)

    while ((paraMatch = paraRegex.exec(html)) !== null) {
      const raw = paraMatch[1];

      // Check for day number
      const dayNum = extractDayNum(raw);

      if (dayNum !== null) {
        currentDay = dayNum;

        // Skip hymns and cross-refs
        if (isHymn(raw) || isCrossRef(raw)) {
          continue;
        }

        // New entry for this day
        const title = extractTitle(raw);
        const notes: string[] = [];
        const cleanHtml = cleanParagraph(raw, notes);

        const dateKey = `${currentMonth}-${String(dayNum).padStart(2, '0')}`;
        if (!out[dateKey]) out[dateKey] = [];

        const entry: BulgakovEntry = { title, html: cleanHtml };
        if (notes.length > 0) {
          entry.html += `<p>Примечания:</p>${notes.map((n, i) => `<p>[${i + 1}] ${n}</p>`).join('')}`;
        }
        out[dateKey].push(entry);
      } else if (currentDay !== null) {
        // Skip hymn continuations
        if (isHymn(raw) || isCrossRef(raw)) continue;

        // Continuation paragraph for current day - append to last entry
        const dateKey = `${currentMonth}-${String(currentDay).padStart(2, '0')}`;
        const lives = out[dateKey];
        if (lives && lives.length > 0) {
          const last = lives[lives.length - 1];
          const notes: string[] = [];
          const cleanHtml = cleanParagraph(raw, notes);
          last.html += cleanHtml;
          if (notes.length > 0) {
            const noteBlock = `<p>Примечания:</p>${notes.map((n, i) => `<p>[${i + 1}] ${n}</p>`).join('')}`;
            last.html += noteBlock;
          }
        }
      }
    }
  }

  // Cleanup temp directory
  execSync(`rm -rf "${tmpDir}"`);

  // Write output
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(out, null, 0));

  let totalEntries = 0;
  for (const lives of Object.values(out)) totalEntries += lives.length;
  console.log(`Converted ${Object.keys(out).length} days, ${totalEntries} entries → ${outputPath}`);

  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const epubPath = process.argv[2];
  if (!epubPath) {
    console.error('Usage: npx tsx scripts/convert-bulgakov.ts <epub-path> [output.json]');
    process.exit(1);
  }
  const outputPath = process.argv[3] || join(process.cwd(), 'scripts', 'output', 'bulgakov.json');
  convertBulgakov(epubPath, outputPath).catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
  });
}