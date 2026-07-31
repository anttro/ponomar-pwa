/**
 * Validate the libcs-derived content (Параклитика weekday canons,
 * Irmologion) converted from the libcs "Ucs" encoding.
 * Run with: npx tsx scripts/validate-libcs.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared');

interface ServiceNode { type: string; value: string }

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

// --- Paraclete weekday canons: 8 tones x 6 days ---
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
let canonCount = 0;
for (let tone = 1; tone <= 8; tone++) {
  for (const day of DAYS) {
    const p = join(ROOT, 'services', 'canons', 'paraclete', `tone${tone}`, `${day}.json`);
    if (!existsSync(p)) { err(`paraclete tone${tone} ${day}: missing`); continue; }
    const nodes = JSON.parse(readFileSync(p, 'utf-8')) as ServiceNode[];
    if (!Array.isArray(nodes) || nodes.length < 50) { err(`paraclete tone${tone} ${day}: too few nodes`); continue; }
    // Must contain ode markers
    const odes = nodes.filter(n => n.type === 'HEADER' && /^Пѣ́снь [а-ѳ]/.test(n.value)).length;
    if (odes < 5) warn(`paraclete tone${tone} ${day}: only ${odes} ode markers`);
    // No Hirm residue
    const text = nodes.map(n => n.value).join(' ');
    const hirm = ['™', '№', 'G', '6', '1', 'h', 'E', 'z'].filter(m => text.includes(m));
    if (hirm.length) err(`paraclete tone${tone} ${day}: Hirm residue: ${hirm.join(',')}`);
    canonCount++;
  }
}
console.log(`paraclete canons: ${canonCount}/48 valid`);

// --- Irmologion: 24 sections ---
const IRMO_IDS = [
  'irmos-1', 'irmos-2', 'irmos-3', 'irmos-4', 'irmos-5', 'irmos-6', 'irmos-7', 'irmos-8',
  'irmos-prefeast-nativity', 'irmos-prefeast-theophany', 'liturgy-chants', 'gospodi-vozzvah',
  'theotokia-sunday', 'theotokia-daily', 'stepenna', 'trinity-songs', 'sunday-feast-verses',
  'lent-canon-rules', 'sunday-troparia', 'sunday-prokimena', 'saturday-troparia',
  'paschal-canon', 'chosen-psalms', 'feast-refrains-ode9',
];
let irmoCount = 0;
for (const id of IRMO_IDS) {
  const p = join(ROOT, 'irmologion', id, 'full.json');
  if (!existsSync(p)) { err(`irmologion/${id}: missing`); continue; }
  const nodes = JSON.parse(readFileSync(p, 'utf-8')) as ServiceNode[];
  if (!Array.isArray(nodes) || nodes.length < 5) { err(`irmologion/${id}: too few nodes`); continue; }
  irmoCount++;
}
console.log(`irmologion: ${irmoCount}/${IRMO_IDS.length} sections valid`);

// --- Paraclete day files (collection): 48 ---
let dayCount = 0;
for (let tone = 1; tone <= 8; tone++) {
  for (const day of DAYS) {
    const p = join(ROOT, 'services', 'paraclete', `tone${tone}`, `${day}.json`);
    if (!existsSync(p)) { err(`paraclete-day tone${tone} ${day}: missing`); continue; }
    const nodes = JSON.parse(readFileSync(p, 'utf-8')) as ServiceNode[];
    if (!Array.isArray(nodes) || nodes.length < 100) { err(`paraclete-day tone${tone} ${day}: too few nodes`); continue; }
    dayCount++;
  }
}
console.log(`paraclete day files: ${dayCount}/48 valid`);

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
