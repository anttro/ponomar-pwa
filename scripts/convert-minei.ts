/**
 * Convert the Chetyi-Minei EPUB (St. Dimitri of Rostov, "Жития Святых (все месяцы)")
 * into a date-keyed JSON for enrichment of ru/lives bundles.
 *
 * Usage:
 *   npx tsx scripts/convert-minei.ts <extracted-epub-dir> [output.json]
 *
 * Input layout (extracted EPUB):
 *   index_split_000.xhtml ... index_split_9999.xhtml   (day files + continuations)
 *   toc.ncx, content.opf
 *
 * Output:
 *   { "01-01": [{ title, html, notes }], ... }
 *   where html = concatenated <p> paragraphs (em/sup preserved), and notes
 *   collected from footnote <a title="..."> markers appended as a Примечания block.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const MONTH_GENITIVE_TO_NUM: Record<string, string> = {
  января: '01', февраля: '02', марта: '03', апреля: '04', мая: '05', июня: '06',
  июля: '07', августа: '08', сентября: '09', октября: '10', ноября: '11', декабря: '12',
};

interface MineiLife {
  title: string;
  html: string;
  notes: string[];
}

interface MineiDay {
  [dateKey: string]: MineiLife[];
}

/**
 * Corrections for EPUB heading errors. Key: h2 element id. Value: corrected date.
 * calibre_toc_10023 (index_split_041) is "Память 27 сентября" but its content is
 * the Translation of Relics of St. John Chrysostom, commemorated Jan 27.
 */
const HEADING_DATE_OVERRIDES: Record<string, string> = {
  calibre_toc_10023: '01-27',
};

/** Strip tags, collapse whitespace (for headings). */
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Convert a paragraph's raw HTML to clean <p>...</p> HTML, collecting footnotes. */
function cleanParagraph(raw: string): { html: string; notes: string[] } {
  let s = raw.trim();
  // Footnote anchors: <a href="..." title="NOTE"><sup>[N]</sup></a> → collect note, keep <sup>[N]</sup>
  const notes: string[] = [];
  s = s.replace(/<a\s[^>]*title="([^"]*)"[^>]*>(<sup[^>]*>\[(\d+)\]<\/sup>)<\/a>/g, (_m, note: string, sup: string) => {
    notes.push(note.trim());
    return sup;
  });
  // Any remaining <a> wrappers: keep inner content, drop href
  s = s.replace(/<a\s[^>]*>(.*?)<\/a>/gs, (_m, inner: string) => inner);
  // Drop classes from <em> (keep italics semantic)
  s = s.replace(/<em\s[^>]*>/g, '<em>');
  // Normalize non-breaking space and whitespace
  s = s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  return { html: `<p>${s}</p>`, notes };
}

/** Extract (type, body, id) for h2/h3 headings and paragraph bodies in document order. */
interface Token {
  kind: 'h2' | 'h3' | 'p';
  body: string;
  id?: string;
  notes?: string[];
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<h([23])\s[^>]*>([\s\S]*?)<\/h\1>|<p class="paragraph1">([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1] === '2' || m[1] === '3') {
      const idMatch = m[0].match(/id="([^"]+)"/);
      tokens.push({ kind: `h${m[1]}` as 'h2' | 'h3', body: m[2], id: idMatch?.[1] });
    } else if (m[3] !== undefined) {
      const cleaned = cleanParagraph(m[3]);
      tokens.push({ kind: 'p', body: cleaned.html, notes: cleaned.notes });
    }
  }
  return tokens;
}

export async function convertMinei(inputDir: string, outputPath: string): Promise<MineiDay> {
  const files = readdirSync(inputDir)
    .filter(f => /^index_split_\d+\.xhtml$/.test(f))
    .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10));

  const out: MineiDay = {};
  let currentDate: string | null = null;

  for (const file of files) {
    const html = readFileSync(join(inputDir, file), 'utf-8');
    const tokens = tokenize(html);

    for (const tok of tokens) {
      if (tok.kind === 'h2') {
        const title = stripTags(tok.body);
        const overrideDate: string | null = tok.id ? HEADING_DATE_OVERRIDES[tok.id] ?? null : null;
        const m = title.match(/^Память (\d{1,2}) (\p{L}+)/u);
        if (overrideDate) {
          currentDate = overrideDate;
          if (!out[currentDate]) out[currentDate] = [];
        } else if (m && MONTH_GENITIVE_TO_NUM[m[2]]) {
          const dd = m[1].padStart(2, '0');
          const mm = MONTH_GENITIVE_TO_NUM[m[2]];
          currentDate = `${mm}-${dd}`;
          if (!out[currentDate]) out[currentDate] = [];
        } else {
          // Intro / appendix / movable-feast section — lives under it are not date-bound
          currentDate = null;
        }
        continue;
      }

      if (currentDate === null) continue;

      if (tok.kind === 'h3') {
        const title = stripTags(tok.body).replace(/\s*\[\d+\]\s*$/, '').trim();
        out[currentDate].push({ title, html: '', notes: [] });
        continue;
      }

      // tok.kind === 'p'
      const lives = out[currentDate];
      if (lives.length === 0) continue;
      const last = lives[lives.length - 1];
      last.html += tok.body;
      if (tok.notes && tok.notes.length > 0) last.notes.push(...tok.notes);
    }
  }

  // Append Примечания block to lives that have notes
  for (const lives of Object.values(out)) {
    for (const life of lives) {
      if (life.notes.length > 0) {
        const notesHtml = life.notes.map((n, i) => `<p>[${i + 1}] ${n}</p>`).join('');
        life.html += `<p>Примечания:</p>${notesHtml}`;
      }
      delete (life as { notes?: string[] }).notes;
    }
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(out, null, 0));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const [, , inputArg, outputArg] = process.argv;
    if (!inputArg) {
      console.error('Usage: npx tsx scripts/convert-minei.ts <extracted-epub-dir> [output.json]');
      process.exit(1);
    }
    const inputDir = inputArg;
    if (!existsSync(inputDir)) {
      console.error(`Input dir not found: ${inputDir}`);
      process.exit(1);
    }
    const outputPath = outputArg || join(process.cwd(), 'scripts', 'output', 'minei.json');
    const minei = await convertMinei(inputDir, outputPath);
    let lives = 0;
    for (const ls of Object.values(minei)) lives += ls.length;
    console.log(`Converted ${Object.keys(minei).length} days, ${lives} lives -> ${outputPath}`);
  })();
}
