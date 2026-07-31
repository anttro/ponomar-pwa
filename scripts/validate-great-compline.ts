/**
 * Validate Great Compline data: prayer files referenced by the
 * GreatCompline template must exist and be well-formed.
 * Run with: npx tsx scripts/validate-great-compline.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data');
const TEMPLATE = join(ROOT, 'shared', 'services', 'templates', 'GreatCompline.json');
const PRAYERS = join(ROOT, 'cu', 'services', 'prayers');
const TEMPLATES = join(ROOT, 'shared', 'services', 'templates');
const BIBLE = join(ROOT, 'cu', 'bible', 'elis');

interface ServiceNode {
  type: string;
  what?: string;
  file?: string;
  verses?: string;
  cmd?: string;
}

let errors = 0;
let warnings = 0;

function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

const nodes: ServiceNode[] = JSON.parse(readFileSync(TEMPLATE, 'utf-8'));
console.log(`GreatCompline.json: ${nodes.length} nodes`);

const usedPrayers = new Set<string>();
for (const n of nodes) {
  if (n.type === 'CREATE') {
    if (!n.what) { err('CREATE without what'); continue; }
    usedPrayers.add(n.what);
    const p = join(PRAYERS, `${n.what}.json`);
    if (!existsSync(p)) {
      err(`missing prayer: ${n.what}.json`);
      continue;
    }
    const prayerNodes = JSON.parse(readFileSync(p, 'utf-8'));
    if (!Array.isArray(prayerNodes) || prayerNodes.length === 0) {
      err(`empty prayer: ${n.what}.json`);
      continue;
    }
    for (const pn of prayerNodes) {
      if (!pn.type || !pn.value) {
        err(`${n.what}.json: node missing type/value`);
        break;
      }
    }
  }
  if (n.type === 'GET') {
    if (!n.file) { err('GET without file'); continue; }
    if (n.file.startsWith('Var/')) continue;
    const p = join(TEMPLATES, `${n.file}.json`);
    if (!existsSync(p)) {
      err(`missing template: ${n.file}.json`);
    }
  }
  if (n.type === 'BIBLE') {
    const v = n.verses ?? '';
    const book = v.split('_')[0];
    const p = join(BIBLE, `${book}.text`);
    if (!existsSync(p)) {
      err(`missing bible book: ${book}`);
    }
  }
}

console.log(`\n${usedPrayers.size} unique prayers referenced`);

// Verify the Great Canon data files exist
const CANONS = join(ROOT, 'shared', 'services', 'canons', 'great-canon');
for (let i = 1; i <= 4; i++) {
  const p = join(CANONS, `part${i}.json`);
  if (!existsSync(p)) err(`missing great canon part${i}.json`);
  else {
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    if (data.odes.length !== 9) err(`part${i}.json: expected 9 odes`);
  }
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
