/**
 * Validate the Daily Menaion (menaion-daily, menaion-common, menaion-add)
 * converted from libcs.
 * Run with: npx tsx scripts/validate-menaion-daily.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared');

interface ServiceNode { type: string; value: string }

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

function checkSection(path: string, label: string) {
  if (!existsSync(path)) { err(`${label}: missing`); return 0; }
  const nodes = JSON.parse(readFileSync(path, 'utf-8')) as ServiceNode[];
  if (!Array.isArray(nodes) || nodes.length < 5) { err(`${label}: too few nodes`); return 0; }
  const text = nodes.map(n => n.value).join(' ');
  const hirm = ['™', '№', 'G', '6', '1', 'h', 'E', 'z'].filter(m => text.includes(m));
  if (hirm.length) err(`${label}: Hirm residue: ${hirm.join(',')}`);
  return nodes.length;
}

// --- Daily Menaion ---
const DAILY = join(ROOT, 'menaion-daily');
let dailySections = 0;
let dailyDates = 0;
for (const dateDir of readdirSync(DAILY).sort()) {
  if (dateDir === 'index.json') continue;
  const dir = join(DAILY, dateDir);
  if (!existsSync(dir) || !readdirSync(dir).some(f => f.endsWith('.json'))) continue;
  dailyDates++;
  for (const fn of readdirSync(dir).sort()) {
    if (!fn.endsWith('.json')) continue;
    checkSection(join(dir, fn), `menaion-daily/${dateDir}/${fn}`);
    dailySections++;
  }
}
console.log(`menaion-daily: ${dailySections} sections over ${dailyDates} dates`);

// Index integrity
const index = JSON.parse(readFileSync(join(DAILY, 'index.json'), 'utf-8')) as Record<string, number>;
let indexOk = 0;
for (const [dk, n] of Object.entries(index)) {
  const dir = join(DAILY, dk);
  const actual = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).length : 0;
  if (actual !== n) err(`index mismatch ${dk}: index=${n}, actual=${actual}`);
  else indexOk++;
}
console.log(`index.json: ${indexOk}/${Object.keys(index).length} dates verified`);

// --- Common Menaion ---
let common = 0;
const COMMON = join(ROOT, 'menaion-common');
for (const fn of readdirSync(COMMON).sort()) {
  if (!fn.endsWith('.json')) continue;
  checkSection(join(COMMON, fn), `menaion-common/${fn}`);
  common++;
}
console.log(`menaion-common: ${common} sections`);

// --- Additions ---
let add = 0;
const ADD = join(ROOT, 'menaion-add');
for (const fn of readdirSync(ADD).sort()) {
  if (!fn.endsWith('.json')) continue;
  checkSection(join(ADD, fn), `menaion-add/${fn}`);
  add++;
}
console.log(`menaion-add: ${add} sections`);

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
