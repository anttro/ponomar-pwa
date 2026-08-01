/**
 * i18n QA: verify the translation bundles (en/ru/cu) are structurally
 * complete and consistent with the actual data on disk.
 * Run with: npx tsx scripts/validate-i18n.ts
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { getTranslations, type LanguageCode } from '../src/core/i18n';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared');

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

const LANGS: LanguageCode[] = ['en', 'ru', 'cu'];
const tr = Object.fromEntries(LANGS.map(l => [l, getTranslations(l)])) as Record<LanguageCode, ReturnType<typeof getTranslations>>;

function getByPath(base: unknown, path: string): unknown {
  let v: unknown = base;
  for (const k of path.split('.')) {
    if (v && typeof v === 'object' && k in (v as Record<string, unknown>)) {
      v = (v as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return v;
}

// 1. Structural completeness: every string key present in en must exist
//    and be non-empty in ru and cu.
function walk(base: unknown, path: string): void {
  if (typeof base !== 'object' || base === null) return;
  for (const [k, v] of Object.entries(base as Record<string, unknown>)) {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === 'string') {
      if (!v.trim()) err(`en key '${p}' is empty`);
      for (const lang of LANGS) {
        if (lang === 'en') continue;
        const other = getByPath(tr[lang], p);
        if (typeof other !== 'string' || !other.trim()) {
          err(`${lang}: missing/empty key '${p}'`);
        }
      }
      if (/[\uFFFD\uFFFE\uFFFF]/.test(v)) err(`en key '${p}' contains a replacement character`);
    } else {
      walk(v, p);
    }
  }
}
walk(tr.en, '');

// 2. Array-length consistency across languages + against data on disk
const expectedArrays: { path: string; len: number }[] = [
  { path: 'calendar.months', len: 12 },
  { path: 'calendar.monthsGenitive', len: 12 },
  { path: 'calendar.dayNames', len: 7 },
  { path: 'calendar.dayNamesFull', len: 7 },
  { path: 'paraclete.days', len: 6 },
];
for (const { path, len } of expectedArrays) {
  for (const lang of LANGS) {
    const arr = getByPath(tr[lang], path);
    if (!Array.isArray(arr)) { err(`${lang}: key '${path}' is not an array`); continue; }
    if (arr.length !== len) err(`${lang}: key '${path}' has ${arr.length} entries, expected ${len}`);
    for (const item of arr) {
      if (typeof item !== 'string' || !item.trim()) err(`${lang}: key '${path}' has an empty entry`);
    }
  }
}

// 3. Section lists must match collection directories on disk
const sectionDirs: { dir: string; key: string }[] = [
  { dir: 'triodion', key: 'triodion.sections' },
  { dir: 'irmologion', key: 'irmologion.sections' },
  { dir: 'prayer-rule', key: 'prayer.sections' },
  { dir: 'akathists', key: 'akathists.sections' },
  { dir: 'parimii', key: 'parimii.sections' },
  { dir: 'horologion', key: 'horologion.sections' },
  { dir: 'sbornik', key: 'sbornik.sections' },
];
for (const { dir, key } of sectionDirs) {
  const dirPath = join(ROOT, dir);
  if (!existsSync(dirPath)) { err(`collection dir '${dir}' missing`); continue; }
  const count = readdirSync(dirPath).filter(e => !e.startsWith('.')).length;
  for (const lang of LANGS) {
    const obj = getByPath(tr[lang], key);
    const n = typeof obj === 'object' && obj !== null ? Object.keys(obj as object).length : -1;
    if (n === -1) { err(`${lang}: key '${key}' not an object`); continue; }
    const expected = key === 'prayer.sections' ? count * 2 : count; // section + *Desc pair
    if (n !== expected) err(`${lang}: '${key}' has ${n} entries but '${dir}/' has ${count} dirs (expected ${expected})`);
    for (const v of Object.values(obj as Record<string, unknown>)) {
      if (typeof v !== 'string' || !v.trim()) err(`${lang}: '${key}' has an empty entry`);
    }
  }
}

// 4. serviceNames / serviceDescriptions must have identical key sets
for (const lang of LANGS) {
  const names = getByPath(tr[lang], 'services.serviceNames') as Record<string, unknown> | undefined;
  const descs = getByPath(tr[lang], 'services.serviceDescriptions') as Record<string, unknown> | undefined;
  if (!names || !descs) { err(`${lang}: services.serviceNames/serviceDescriptions missing`); continue; }
  const nk = new Set(Object.keys(names));
  const dk = new Set(Object.keys(descs));
  for (const k of nk) if (!dk.has(k)) err(`${lang}: serviceDescriptions missing key '${k}'`);
  for (const k of dk) if (!nk.has(k)) err(`${lang}: serviceNames missing key '${k}'`);
  for (const v of Object.values(names)) if (typeof v !== 'string' || !v.trim()) err(`${lang}: empty serviceName value`);
  for (const v of Object.values(descs)) if (typeof v !== 'string' || !v.trim()) err(`${lang}: empty serviceDescription value`);
}

// 5. Nav must cover all views routed in app.ts
const VIEWS = ['calendar', 'bible', 'prayer', 'akathists', 'parimii', 'horologion', 'sbornik', 'paraclete', 'irmologion', 'menaion', 'triodion', 'settings'];
for (const lang of LANGS) {
  const nav = getByPath(tr[lang], 'nav') as Record<string, unknown> | undefined;
  if (!nav) { err(`${lang}: nav missing`); continue; }
  for (const v of VIEWS) {
    if (typeof nav[v] !== 'string' || !(nav[v] as string).trim()) err(`${lang}: nav.${v} missing/empty`);
  }
}

// 6. rankLabels 1-8 and rankIcons subset present
for (const lang of LANGS) {
  const rl = getByPath(tr[lang], 'calendar.rankLabels') as Record<string, unknown> | undefined;
  for (let i = 1; i <= 8; i++) {
    if (!rl || typeof rl[i] !== 'string' || !(rl[i] as string).trim()) err(`${lang}: calendar.rankLabels[${i}] missing/empty`);
  }
}

console.log(`i18n check: ${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
