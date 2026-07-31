/**
 * Validate canon data files and simulate the ServiceNode output
 * that loadCanonData() produces.
 * Run with: npx tsx scripts/validate-canons.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const CANONS_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'services', 'canons');

interface CanonSubCanon {
  irmos: string;
  troparia: string[];
  theotokion: string;
}

interface CanonOde {
  ode: number;
  canons: CanonSubCanon[];
}

interface CanonData {
  tone: number;
  odes: CanonOde[];
}

interface ServiceNode {
  type: 'HEADER' | 'TEXT';
  value: string;
}

const ODE_SLAV = ['', 'а', 'в', 'г', 'д', 'є', 'ѕ', 'з', 'и', 'ѳ'];

function simulateLoadCanonData(data: CanonData): ServiceNode[] {
  const nodes: ServiceNode[] = [];
  for (const ode of data.odes) {
    const slavNum = ODE_SLAV[ode.ode] ?? String(ode.ode);
    nodes.push({ type: 'HEADER', value: `Пѣснь ${slavNum}҃.` });

    for (const canon of ode.canons) {
      if (canon.irmos) {
        nodes.push({ type: 'HEADER', value: `Ірмосъ, гла́съ ${data.tone}:` });
        nodes.push({ type: 'TEXT', value: canon.irmos });
      }
      for (const trop of canon.troparia) {
        nodes.push({ type: 'TEXT', value: trop });
      }
      if (canon.theotokion) {
        nodes.push({ type: 'HEADER', value: 'Бг҃ородиченъ:' });
        nodes.push({ type: 'TEXT', value: canon.theotokion });
      }
    }
  }
  return nodes;
}

let errors = 0;
let warnings = 0;

function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

for (const entry of readdirSync(CANONS_DIR).sort()) {
  // Skip non-Sunday-canon subdirectories (great-canon parts, paraclete weekday canons)
  if (entry === 'great-canon' || entry === 'paraclete') continue;
  const fullPath = join(CANONS_DIR, entry, 'sunday.json');
  if (!existsSync(fullPath)) {
    warn(`Missing ${fullPath}`);
    continue;
  }

  console.log(`\n=== ${entry} ===`);

  let data: CanonData;
  try {
    data = JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    err(`${fullPath}: failed to parse: ${(e as Error).message}`);
    continue;
  }

  // Validate raw data structure
  if (!data.tone || typeof data.tone !== 'number' || data.tone < 1 || data.tone > 8)
    err(`${entry}: invalid tone ${data.tone}`);
  if (!Array.isArray(data.odes))
    err(`${entry}: odes must be an array`);

  // Validate each ode
  for (let oi = 0; oi < data.odes.length; oi++) {
    const ode = data.odes[oi];
    const pfx = `${entry}/odes[${oi}]/ode${ode.ode}`;

    if (!ode.ode || typeof ode.ode !== 'number' || ode.ode < 1 || ode.ode > 9)
      err(`${pfx}: invalid ode number`);
    if (oi > 0 && data.odes[oi - 1].ode >= ode.ode)
      err(`${pfx}: ode not in ascending order (after ${data.odes[oi - 1].ode})`);
    if (!Array.isArray(ode.canons))
      err(`${pfx}: canons must be an array`);
    if (ode.canons.length !== 3)
      warn(`${pfx}: ${ode.canons.length} canons (expected 3)`);

    for (let ci = 0; ci < ode.canons.length; ci++) {
      const c = ode.canons[ci];
      const cp = `${pfx}/canon${ci}`;

      if (typeof c.irmos !== 'string') err(`${cp}: irmos must be string`);
      if (!Array.isArray(c.troparia)) err(`${cp}: troparia must be array`);
      if (typeof c.theotokion !== 'string') err(`${cp}: theotokion must be string`);
      if (c.troparia.length === 0) warn(`${cp}: zero troparia`);
      for (let ti = 0; ti < c.troparia.length; ti++) {
        if (typeof c.troparia[ti] !== 'string' || c.troparia[ti].length < 5)
          err(`${cp}/troparia[${ti}]: too short (${c.troparia[ti]?.length ?? 0} chars)`);
      }

      // theotokion may be empty — source text often lacks explicit Бгородиченъ:
      // Cross-Resurrection canon (ci=1) and Theotokos canon (ci=2) frequently
      // have no separate theotokion marker in the Oktoih source.
    }
  }

  // Simulate loadCanonData() and validate ServiceNode output
  const nodes = simulateLoadCanonData(data);
  if (nodes.length === 0) {
    err(`${entry}: zero ServiceNodes produced`);
    continue;
  }

  let prevType = '';
  let odeCount = 0;
  let canonCount = 0;
  let expectingIrmosText = false;
  let expectingTheotokionText = false;
  let inCanon = false;

  for (let ni = 0; ni < nodes.length; ni++) {
    const n = nodes[ni];
    const np = `${entry}/node[${ni}]`;

    if (n.type !== 'HEADER' && n.type !== 'TEXT')
      err(`${np}: invalid type '${n.type}'`);
    if (!n.value || typeof n.value !== 'string')
      err(`${np}: missing or invalid value`);

    // Check ode header
    if (n.type === 'HEADER' && /^Пѣснь [а-ѳ]҃\.$/.test(n.value)) {
      odeCount++;
      canonCount = 0;
      inCanon = false;
      continue;
    }

    // Check irmos header
    if (n.type === 'HEADER' && n.value.startsWith('Ірмосъ')) {
      canonCount++;
      if (canonCount > 3) warn(`${np}: more than 3 canons in ode`);
      expectingIrmosText = true;
      inCanon = true;
      continue;
    }

    // Check theotokion header
    if (n.type === 'HEADER' && n.value.startsWith('Бг҃ородиченъ')) {
      expectingTheotokionText = true;
      continue;
    }

    // Consume irmos text
    if (expectingIrmosText) {
      if (n.type !== 'TEXT') err(`${np}: expected TEXT after irmos HEADER`);
      expectingIrmosText = false;
      continue;
    }

    // Consume theotokion text
    if (expectingTheotokionText) {
      if (n.type !== 'TEXT') err(`${np}: expected TEXT after Бг҃ородиченъ HEADER`);
      expectingTheotokionText = false;
      continue;
    }

    prevType = n.type;
  }

  if (odeCount === 0) err(`${entry}: no ode headers found`);
  if (expectingIrmosText) err(`${entry}: missing irmos TEXT after last Ірмосъ HEADER`);
  if (expectingTheotokionText) err(`${entry}: missing Бг҃ородиченъ TEXT after last HEADER`);

  console.log(`  ${data.odes.length} odes, ${nodes.length} ServiceNodes`);
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
