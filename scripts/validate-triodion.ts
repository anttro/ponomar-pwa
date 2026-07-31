/**
 * Validate the Lenten Triodion (shared/triodion) converted from libcs.
 * Run with: npx tsx scripts/validate-triodion.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'triodion');

interface ServiceNode { type: string; value: string }

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

let count = 0;
for (const fn of readdirSync(ROOT).sort()) {
  if (!fn.endsWith('.json')) continue;
  const path = join(ROOT, fn);
  const nodes = JSON.parse(readFileSync(path, 'utf-8')) as ServiceNode[];
  if (!Array.isArray(nodes) || nodes.length < 5) { err(`${fn}: too few nodes`); continue; }
  const text = nodes.map(n => n.value ?? '').join(' ');
  const hirm = ['™', '№', 'G', '6', '1', 'h', 'E', 'z'].filter(m => text.includes(m));
  if (hirm.length) err(`${fn}: Hirm residue: ${hirm.join(',')}`);
  count++;
}
console.log(`triodion: ${count}/37 sections valid`);

// Verify template + text metadata exist
const TPL = join(__dirname, '..', 'static', 'data', 'shared', 'services', 'templates', 'Triodion.json');
if (!existsSync(TPL)) err('missing template: Triodion.json');

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
