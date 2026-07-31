/**
 * Validate Pentecostarion service data files: every full.json must be
 * well-formed, and referenced templates must exist.
 * Run with: npx tsx scripts/validate-pentecostarion.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'services');

interface ServiceNode { type: string; value: string }

const SERVICES: Record<string, { nday: number; markers: string[]; template: string }> = {
  'antipascha':        { nday: 7,  markers: ['а҆нтїпа́схи'], template: 'Antipascha' },
  'myrrhbearers':      { nday: 14, markers: ['мѷроно́сиц'], template: 'Myrrhbearers' },
  'paralytic':         { nday: 21, markers: ['разсла́бленнагѡ'], template: 'Paralytic' },
  'prepolovenie':      { nday: 25, markers: ['Преполове́нїе'], template: 'Prepolovenie' },
  'samaritan':         { nday: 28, markers: ['самарѧны́ни'], template: 'Samaritan' },
  'blindman':          { nday: 35, markers: ['слѣпо́мъ'], template: 'BlindMan' },
  'apodosis':          { nday: 38, markers: ['Ѿда́нїе'], template: 'Apodosis' },
  'ascension':         { nday: 39, markers: ['Вознесе́нїе'], template: 'Ascension' },
  'holyfathers':       { nday: 42, markers: ['нїке́и'], template: 'HolyFathers' },
  'pentecostsaturday': { nday: 48, markers: ['пѧтдесѧ́тницы'], template: 'PentecostSaturday' },
  'pentecost':         { nday: 49, markers: ['пентико́стїи'], template: 'Pentecost' },
  'holyspirit':        { nday: 50, markers: ['ст҃а́гѡ дх҃а'], template: 'HolySpirit' },
  'allsaints':         { nday: 56, markers: ['всѣ́хъ ст҃ы́хъ'], template: 'AllSaints' },
  'russiansaints':     { nday: 56, markers: ['рѡссі́йстей'], template: 'RussianSaints' },
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

  if (!Array.isArray(nodes) || nodes.length < 20) {
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

  // Every Sunday service should have Matins (на утрени)
  if ([7, 14, 21, 28, 35, 42, 49, 56].includes(spec.nday)) {
    if (!all.some(v => v.includes('на ᲂу҆́трени') || v.includes('На ᲂу҆́трени')))
      warn(`${dir}: no Matins marker`);
  }

  console.log(`${dir}: ${nodes.length} nodes, ${headers} headers (nday ${spec.nday})`);
}

// Verify templates referenced by services exist
const templates = Object.values(SERVICES).map(s => s.template);
for (const t of templates) {
  if (!existsSync(join(ROOT, 'templates', `${t}.json`))) {
    err(`missing template: ${t}.json`);
  }
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
