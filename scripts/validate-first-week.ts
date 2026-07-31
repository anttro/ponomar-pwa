/**
 * Validate First Week of Lent service data files.
 * Run with: npx tsx scripts/validate-first-week.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'services');

interface ServiceNode { type: string; value: string }

const SERVICES: Record<string, { nday: number; markers: string[]; template: string }> = {
  'first-week-monday':    { nday: -48, markers: ['На ᲂу҆́трени', 'повече́рїи'], template: 'FirstWeekMonday' },
  'first-week-tuesday':   { nday: -47, markers: ['На ᲂу҆́трени', 'повече́рїи'], template: 'FirstWeekTuesday' },
  'first-week-wednesday': { nday: -46, markers: ['На ᲂу҆́трени', 'повече́рїи'], template: 'FirstWeekWednesday' },
  'first-week-thursday':  { nday: -45, markers: ['На ᲂу҆́трени', 'повече́рїи'], template: 'FirstWeekThursday' },
  'first-week-friday':    { nday: -44, markers: ['преждеѡсщ҃е́нных', 'ко́лѷва', 'Да и҆спра́витсѧ'], template: 'FirstWeekFriday' },
  'first-week-saturday':  { nday: -43, markers: ['Канѡ́нъ ст҃а́гѡ ѳео́дѡра', 'На лїтꙋргі́и'], template: 'FirstWeekSaturday' },
};

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

for (const [dir, spec] of Object.entries(SERVICES)) {
  const path = join(ROOT, dir, 'full.json');
  if (!existsSync(path)) { err(`${dir}: missing full.json`); continue; }

  let nodes: ServiceNode[];
  try {
    nodes = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    err(`${dir}: failed to parse: ${(e as Error).message}`);
    continue;
  }

  if (!Array.isArray(nodes) || nodes.length < 100) {
    err(`${dir}: too few nodes (${Array.isArray(nodes) ? nodes.length : 'n/a'})`);
    continue;
  }

  let headers = 0;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type !== 'HEADER' && n.type !== 'TEXT') { err(`${dir}[${i}]: invalid type '${n.type}'`); continue; }
    if (!n.value || typeof n.value !== 'string') { err(`${dir}[${i}]: missing value`); continue; }
    if (n.type === 'HEADER') headers++;
  }
  if (headers === 0) err(`${dir}: no HEADER nodes`);

  const all = nodes.map(n => n.value);
  for (const m of spec.markers) {
    if (!all.some(v => v.includes(m))) warn(`${dir}: marker '${m}' not found`);
  }

  // Hours 1/3/6/9 + Typica presence
  const hours = all.filter(v => /Ча́съ/.test(v)).length;
  if (hours < 3) warn(`${dir}: only ${hours} hour markers`);

  console.log(`${dir}: ${nodes.length} nodes, ${headers} headers (nday ${spec.nday})`);
}

for (const spec of Object.values(SERVICES)) {
  if (!existsSync(join(ROOT, 'templates', `${spec.template}.json`))) {
    err(`missing template: ${spec.template}.json`);
  }
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
