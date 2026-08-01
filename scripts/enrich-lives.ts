/**
 * Enrich ru/lives bundles with Chetyi-Minei texts.
 *
 * Pipeline:
 *   1. Load scripts/output/minei.json (source lives by MM-DD, from convert-minei.ts).
 *   2. Load static/data/cu/menaion-bundle.json (authoritative date -> CId mapping).
 *   3. Load ru/lives bundles (names per CId; target for enrichment).
 *   4. For each date, fuzzy-match source life titles to candidate CIds' names.
 *   5. Fill life.text (only entries that currently lack it) + write report.
 *
 * Usage:
 *   npx tsx scripts/enrich-lives.ts            # dry run -> report only
 *   npx tsx scripts/enrich-lives.ts --write    # apply changes
 *   npx tsx scripts/enrich-lives.ts --month 01 # limit to one month (report)
 *   npx tsx scripts/enrich-lives.ts --write --month 01
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

const ROOT = join(new URL('.', import.meta.url).pathname, '..');
const MINEI_PATH = join(ROOT, 'scripts', 'output', 'minei.json');
const MENAION_BUNDLE_PATH = join(ROOT, 'static', 'data', 'cu', 'menaion-bundle.json');
const LIVES_DIR = join(ROOT, 'static', 'data', 'ru', 'lives');
const REPORT_PATH = join(ROOT, 'scripts', 'output', 'lives-match-report.json');

const COPYRIGHT = 'Четьи-Минеи свт. Димитрия Ростовского';

interface SourceLife {
  title: string;
  html: string;
}

interface Candidate {
  cid: string;
  name: string;
  file: string;
  hasLife: boolean;
  score: number;
}

interface ReportEntry {
  date: string;
  sourceTitle: string;
  matchedCid: string | null;
  matchedName: string | null;
  score: number;
  status: 'auto' | 'review' | 'unmatched' | 'already-filled' | 'no-name';
}

const ROLE_WORDS = new Set([
  'святого', 'святой', 'святая', 'святых', 'святому', 'святою', 'святыя',
  'свт', 'святитель', 'святителя', 'святителю',
  'преподобного', 'преподобный', 'преподобной', 'преподобных', 'прп', 'прпп',
  'мученика', 'мученик', 'мучеников', 'мученицы', 'мучениц', 'мученице',
  'мч', 'мчч', 'мц', 'мцц', 'сщмч', 'сщмчч', 'прпмч', 'прпмц', 'прмч',
  'блаженного', 'блаженный', 'блаженной', 'блаж',
  'праведного', 'праведный', 'праведной', 'прав',
  'пророка', 'пророк', 'пророков',
  'апостола', 'апостол', 'апостолов', 'апостолы', 'ап',
  'священномученика', 'священномучеников',
  'отца', 'отец', 'отцов', 'нашего', 'наших', 'наш', 'его', 'ея', 'ей', 'их',
  'житие', 'жития', 'страдание', 'страданиев', 'страдания', 'память', 'слово',
  'богоносного', 'вселенского', 'собора', 'собор',
  'иже', 'во', 'в', 'на', 'по', 'за', 'от', 'о', 'об', 'к', 'и', 'с',
  'вмч', 'вмц', 'великомученика', 'великомученик',
  'еп', 'епископа', 'епископ', 'архиеп', 'архиепископа', 'архиепископ',
  'митр', 'митрополита', 'патриарха', 'патриарх', 'игумена', 'игумении',
  'пресвитера', 'пресвитер', 'диакона', 'диакон', 'князя', 'князь', 'кн',
  'царя', 'царь', 'императора', 'император', 'девы', 'дева', 'девица',
  'сестры', 'сестер', 'брата', 'братий', 'чад', 'чада', 'сына', 'сын',
  'воинов', 'отрока', 'отрок', 'младенцев', 'авраам', 'аврамия',
  'ок', 'иже', 'св', 'блгв', 'блж', 'прмц', 'прав', 'прор',
]);

/**
 * Manual overrides for cases the fuzzy matcher cannot resolve
 * (near-ties, token-subset collisions, name homonyms on the same date).
 * Key: `${date}|${distinctive lowercase substring of the source title}`.
 */
const MANUAL_FIXES: Record<string, string> = {
  '01-02|серафима саровского': '010202',
  '01-04|семидесяти апостолов': '146',
  '01-06|слово святого иоанна златоустого на богоявление': '163',
  '01-07|десной руке': '1007',
  '01-08|иулиана и василиссы': '174',
  '01-08|илии пустынника': '175',
  '01-09|петра, епископа севастийского': '010905',
  '01-12|петра авесаламита': '202',
  '01-14|преподобного стефана': '219',
  '01-26|иосифа солунского': '31701',
  '01-30|преподобного зинона': '341',
  '01-30|ипполита, кенсорина': '339',
  '04-04|зосимы': '754',
  '05-29|память святой мученицы феодосии': '271401',
  '05-29|преподобномученицы феодосии': '1169',
  '05-27|ферапонта, белозерского': '2275',
  '08-27|пимена (палестинского)': '4533',
  '09-04|священномученика вавилы': '1446',
  '09-22|ионы пресвитера': '1581',
  '09-24|никандра псковского': '1595',
  '10-08|преподобной матери нашей пелагии': '2641',
  '10-08|пелагии девы': '10080000',
  '11-22|михаила воина': '2585',
};

/** True if a token is a year, year-range, or Roman numeral (e.g. 309, 1238, V, IX). */
function isYearish(tok: string): boolean {
  if (/^\d+$/.test(tok)) return true;
  if (/^[ivxlc]+$/.test(tok)) return true;
  return false;
}

function normalizeToken(tok: string): string {
  return tok.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}]/gu, '');
}

function tokenize(s: string): string[] {
  return s
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[()[\].,;:—–-]/g, ' ')
    .split(/\s+/)
    .map(normalizeToken)
    .filter(t => t.length > 1 && !ROLE_WORDS.has(t) && !isYearish(t));
}

/** Normalize a title for MANUAL_FIXES substring lookup. */
function normKey(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

/** Look up a manual override: date + distinctive normalized substring. */
function findManualFix(date: string, title: string): string | null {
  const t = normKey(title);
  for (const [key, cid] of Object.entries(MANUAL_FIXES)) {
    const [d, sub] = key.split('|');
    if (d === date && t.includes(sub)) return cid;
  }
  return null;
}

/** Dice coefficient over significant tokens. */
function scoreMatch(source: string, name: string): number {
  const a = tokenize(source);
  const b = tokenize(name);
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  let inter = 0;
  for (const t of b) if (setA.has(t)) inter++;
  return (2 * inter) / (a.length + b.length);
}

function bundleFileForCid(cid: string): string {
  return /^(0[1-9]|1[0-2])\d+/.test(cid) ? `${cid.substring(0, 2)}.json` : 'misc.json';
}

interface Args {
  write: boolean;
  month: string | null;
}

function parseArgs(argv: string[]): Args {
  return {
    write: argv.includes('--write'),
    month: argv.includes('--month') ? argv[argv.indexOf('--month') + 1] ?? null : null,
  };
}

export async function enrichLives(args: Args): Promise<void> {
  if (!existsSync(MINEI_PATH)) {
    console.error('Missing scripts/output/minei.json — run convert-minei.ts first.');
    process.exit(1);
  }
  const minei = JSON.parse(readFileSync(MINEI_PATH, 'utf-8')) as Record<string, SourceLife[]>;
  const bundle = JSON.parse(readFileSync(MENAION_BUNDLE_PATH, 'utf-8')) as Record<string, { id: string }[]>;

  // Load all ru/lives bundles into one map: cid -> {name, life, file}
  const livesByCid: Record<string, { name: Record<string, string>; life?: { text?: string }; file: string }> = {};
  for (const f of readdirSync(LIVES_DIR).filter(f => f.endsWith('.json'))) {
    const bundleData = JSON.parse(readFileSync(join(LIVES_DIR, f), 'utf-8')) as Record<string, { name?: Record<string, string>; life?: { text?: string } }>;
    for (const [cid, entry] of Object.entries(bundleData)) {
      livesByCid[cid] = { name: entry.name || {}, life: entry.life, file: f };
    }
  }

  const report: ReportEntry[] = [];
  const pendingWrites: Record<string, Record<string, unknown>> = {};
  let autoApplied = 0;
  let needReview = 0;
  let unmatched = 0;

  for (const [date, lives] of Object.entries(minei)) {
    if (args.month && !date.startsWith(args.month)) continue;

    // Candidate CIds for this date from the menaion bundle
    const bundleIds = (bundle[date] || []).map(e => String(e.id));
    const candidates: Candidate[] = bundleIds
      .map(cid => {
        const entry = livesByCid[cid];
        if (!entry) return null;
        const name = entry.name.nominative || entry.name.short || '';
        return {
          cid,
          name,
          file: entry.file,
          hasLife: !!entry.life?.text,
          score: 0,
        } as Candidate;
      })
      .filter((c): c is Candidate => c !== null);

    for (const life of lives) {
      let best: Candidate | null = null;

      const manualCid = findManualFix(date, life.title);
      if (manualCid) {
        const entry = livesByCid[manualCid];
        if (entry) {
          best = {
            cid: manualCid,
            name: entry.name.nominative || entry.name.short || '',
            file: entry.file,
            hasLife: !!entry.life?.text,
            score: 1,
          };
        }
      } else {
        for (const cand of candidates) {
          const score = scoreMatch(life.title, cand.name);
          if (score > (best?.score ?? 0)) {
            best = { ...cand, score };
          }
        }
      }

      if (!best || best.score === 0) {
        report.push({ date, sourceTitle: life.title, matchedCid: null, matchedName: null, score: 0, status: 'unmatched' });
        unmatched++;
        continue;
      }

      const status = best.hasLife
        ? 'already-filled'
        : best.score >= 0.6
          ? 'auto'
          : best.score >= 0.35
            ? 'review'
            : 'unmatched';

      report.push({
        date,
        sourceTitle: life.title,
        matchedCid: best.score >= 0.35 ? best.cid : null,
        matchedName: best.score >= 0.35 ? best.name : null,
        score: best.score,
        status,
      });

      if (status === 'auto') {
        autoApplied++;
        const targetFile = best.file;
        const key = targetFile.replace('.json', '');
        if (!pendingWrites[key]) pendingWrites[key] = JSON.parse(readFileSync(join(LIVES_DIR, targetFile), 'utf-8'));
        const entry = pendingWrites[key][best.cid] as Record<string, unknown>;
        const existingLife = entry.life as { id?: string; text?: string } | undefined;
        if (existingLife?.text) {
          entry.life = { id: existingLife.id!, copyright: COPYRIGHT, text: `${existingLife.text}<p><b>${life.title}</b></p>${life.html}` };
        } else {
          entry.life = { id: `minei-${date.replace('-', '')}-${best.cid}`, copyright: COPYRIGHT, text: life.html };
        }
      } else if (status === 'review') {
        needReview++;
      } else if (status === 'unmatched') {
        unmatched++;
      }
    }
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 0));
  console.log(`Auto-applied: ${autoApplied}, needs review: ${needReview}, unmatched: ${unmatched}`);
  console.log(`Report: ${REPORT_PATH}`);

  if (args.write) {
    for (const [key, data] of Object.entries(pendingWrites)) {
      writeFileSync(join(LIVES_DIR, `${key}.json`), JSON.stringify(data));
    }
    console.log(`Wrote ${Object.keys(pendingWrites).length} updated bundle(s).`);
  } else {
    const months = new Set(report.filter(r => r.status === 'auto').map(r => r.date.slice(0, 2)));
    console.log(`Dry run — no files changed. Auto-applied covers months: ${[...months].sort().join(', ')}`);
    console.log('Re-run with --write to apply.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    await enrichLives(args);
  })();
}
