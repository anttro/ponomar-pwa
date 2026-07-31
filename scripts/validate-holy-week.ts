/**
 * Validate Holy Week service data files: every full.json must be
 * well-formed, and referenced templates must exist.
 * Run with: npx tsx scripts/validate-holy-week.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'services');

interface ServiceNode { type: string; value: string }

const SERVICES: Record<string, number> = {
  'palm-sunday': -7,
  'great-monday': -6,
  'great-tuesday': -5,
  'great-wednesday': -4,
  'great-thursday': -3,
  'passion-gospels': -3,
  'royal-hours-friday': -2,
  'lamentations': -1,
  'burial-vespers': -2,
  'saturday-hours': -1,
  'saturday-vespers-liturgy': -1,
  'saturday-midnight': -1,
  'pascha': 0,
  'bright-monday': 1,
  'bright-tuesday': 2,
  'bright-wednesday': 3,
  'bright-thursday': 4,
  'bright-friday': 5,
  'bright-saturday': 6,
};

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

for (const [dir, nday] of Object.entries(SERVICES)) {
  const path = join(ROOT, dir, 'full.json');
  if (!existsSync(path)) { err(`${dir}: missing full.json`); continue; }

  let nodes: ServiceNode[];
  try {
    nodes = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    err(`${dir}: failed to parse: ${(e as Error).message}`);
    continue;
  }

  if (!Array.isArray(nodes) || nodes.length < 20) {
    err(`${dir}: too few nodes (${Array.isArray(nodes) ? nodes.length : 'n/a'})`);
    continue;
  }

  let headers = 0, empty = 0;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type !== 'HEADER' && n.type !== 'TEXT') { err(`${dir}[${i}]: invalid type '${n.type}'`); continue; }
    if (!n.value || typeof n.value !== 'string') { err(`${dir}[${i}]: missing value`); continue; }
    if (n.value.length < 3) empty++;
    if (n.type === 'HEADER') headers++;
  }
  if (headers === 0) err(`${dir}: no HEADER nodes`);
  if (empty > 0) warn(`${dir}: ${empty} suspiciously short values`);

  // Service-specific presence checks
  const all = nodes.map(n => n.value);
  if (dir === 'passion-gospels') {
    const gospels = all.filter(v => /є҆ѵⷢ҇лїе/i.test(v) && /завѣ́та/i.test(v));
    if (gospels.length !== 12) err(`${dir}: expected 12 gospel markers, got ${gospels.length}`);
    const dolg = all.filter(v => v.includes('долготерпѣ́нїю')).length;
    if (dolg < 11) warn(`${dir}: only ${dolg} 'Слава долготерпению' responses`);
  }
  if (dir === 'lamentations') {
    const statii = all.filter(v => v.startsWith('Статїѧ̀')).length;
    if (statii !== 3) err(`${dir}: expected 3 статии, got ${statii}`);
  }
  if (dir === 'royal-hours-friday') {
    // Hours are marked inline: "Ча́съ пе́рвый", "Посе́мъ пое́мъ тре́тїй ча́съ", etc.
    const hours = all.filter(v => /ча́съ/.test(v));
    if (hours.length < 4) warn(`${dir}: only ${hours.length} hour markers`);
  }
  if (dir === 'saturday-vespers-liturgy') {
    // 15 paroemia readings + special hymns
    if (!all.some(v => v.includes('Да молчи́тъ') || v.includes('молчи́тъ всѧ́каѧ пло́ть')))
      err(`${dir}: missing 'Да молчит всякая плоть'`);
    if (!all.some(v => v.includes('рыда́й')))
      err(`${dir}: missing 'Не рыдай Мене Мати'`);
    if (!all.some(v => /[ЕЄ]҆?ли́цы/.test(v) || v.includes('крести́стесѧ')))
      warn(`${dir}: 'Елицы во Христа крестистеся' not found`);
    if (!all.some(v => v.includes('Воскрⷭ҇нѝ')))
      err(`${dir}: missing 'Воскресни Боже'`);
  }
  if (dir === 'saturday-midnight') {
    const odes = all.filter(v => /Пѣ́снь [а-ѳ]/.test(v)).length;
    if (odes < 8) warn(`${dir}: only ${odes} canon odes`);
  }
  if (dir === 'burial-vespers') {
    // Burial Vespers should include the "Благообразный Иосиф" troparion
    if (!all.some(v => v.includes('і҆ѡ́сиф') || v.includes('И҆ѡ́сиф')))
      warn(`${dir}: troparion of St. Joseph not found`);
  }
  if (dir === 'pascha') {
    if (!all.some(v => v.includes('златоꙋ́стагѡ') || v.includes('Златоꙋ́стагѡ')))
      err(`${dir}: missing Catechetical homily of St. John Chrysostom`);
    if (!all.some(v => v.includes('а҆́ртоса') || v.includes('артоса')))
      warn(`${dir}: Artos blessing not found`);
    const antiphons = all.filter(v => v.startsWith('А҆нтїфѡ́нъ')).length;
    if (antiphons < 3) err(`${dir}: expected 3 antiphons, got ${antiphons}`);
  }

  console.log(`${dir}: ${nodes.length} nodes, ${headers} headers (${nday < 0 ? 'nday ' + nday : 'fixed'})`);
}

// Verify templates referenced by services exist
const templates = [
  'PalmSunday', 'GreatMonday', 'GreatTuesday', 'GreatWednesday', 'GreatThursday',
  'PassionGospels', 'RoyalHoursFriday', 'Lamentations',
  'BurialVespers', 'SaturdayHours', 'SaturdayVespersLiturgy', 'SaturdayMidnight',
  'Pascha', 'BrightMonday', 'BrightTuesday', 'BrightWednesday', 'BrightThursday',
  'BrightFriday', 'BrightSaturday',
];
for (const t of templates) {
  if (!existsSync(join(ROOT, 'templates', `${t}.json`))) {
    err(`missing template: ${t}.json`);
  }
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
