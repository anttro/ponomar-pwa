import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const CANONS_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'services', 'canons', 'great-canon');

interface GreatCanonOde {
  ode: number;
  irmos: string;
  troparia: string[];
  trinityTroparion: string;
  theotokion: string;
  kontakion?: string;
  saintTroparia?: string[];
}

interface GreatCanonPart {
  part: number;
  title: string;
  odes: GreatCanonOde[];
}

interface ServiceNode {
  type: 'HEADER' | 'TEXT';
  value: string;
}

const ODE_SLAV = ['', 'а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃', 'ѳ҃'];

function simulateLoadGreatCanon(data: GreatCanonPart): ServiceNode[] {
  const nodes: ServiceNode[] = [];
  nodes.push({ type: 'HEADER', value: 'Вели́кїй канѡ́нъ, гла́съ ѕ҃.' });
  nodes.push({ type: 'HEADER', value: 'Творе́нїе ст҃а́гѡ ѻ҆тца̀ на́шегѡ а҆ндре́а кри́тскагѡ.' });

  for (const ode of data.odes) {
    const slavNum = ODE_SLAV[ode.ode] ?? String(ode.ode);
    nodes.push({ type: 'HEADER', value: `Пѣ́снь ${slavNum}.` });

    if (ode.irmos) {
      nodes.push({ type: 'HEADER', value: 'І҆рмо́съ:' });
      nodes.push({ type: 'TEXT', value: ode.irmos });
    }

    const refrain = 'Поми́лꙋй мѧ̀, бж҃е, поми́лꙋй мѧ̀.';
    for (const trop of ode.troparia) {
      nodes.push({ type: 'TEXT', value: `${trop}\nПрипѣ́въ: ${refrain}` });
    }

    if (ode.trinityTroparion) {
      nodes.push({ type: 'HEADER', value: 'Сла́ва, трⷪ҇ченъ:' });
      nodes.push({ type: 'TEXT', value: ode.trinityTroparion });
    }

    if (ode.theotokion) {
      nodes.push({ type: 'HEADER', value: 'И҆ ны́нѣ, бг҃оро́диченъ:' });
      nodes.push({ type: 'TEXT', value: ode.theotokion });
    }

    if (ode.saintTroparia && ode.saintTroparia.length > 0) {
      for (const saintTrop of ode.saintTroparia) {
        nodes.push({ type: 'TEXT', value: saintTrop });
      }
    }

    if (ode.kontakion) {
      nodes.push({ type: 'HEADER', value: 'Конда́къ, гла́съ ѕ҃:' });
      nodes.push({ type: 'TEXT', value: ode.kontakion });
    }
  }

  return nodes;
}

let errors = 0;
let warnings = 0;

function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

for (const entry of readdirSync(CANONS_DIR).sort()) {
  const fullPath = join(CANONS_DIR, entry);
  if (!entry.endsWith('.json')) continue;

  console.log(`\n=== ${entry} ===`);

  let data: GreatCanonPart;
  try {
    data = JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    err(`${entry}: failed to parse: ${(e as Error).message}`);
    continue;
  }

  if (!data.part || typeof data.part !== 'number' || data.part < 1 || data.part > 4)
    err(`${entry}: invalid part ${data.part}`);
  if (!Array.isArray(data.odes))
    err(`${entry}: odes must be an array`);
  if (data.odes.length !== 9)
    err(`${entry}: expected 9 odes, got ${data.odes.length}`);

  for (let oi = 0; oi < data.odes.length; oi++) {
    const ode = data.odes[oi];
    const pfx = `${entry}/odes[${oi}]/ode${ode.ode}`;

    if (!ode.ode || typeof ode.ode !== 'number' || ode.ode < 1 || ode.ode > 9)
      err(`${pfx}: invalid ode number`);
    if (oi > 0 && data.odes[oi - 1].ode >= ode.ode)
      err(`${pfx}: ode not in ascending order`);
    if (typeof ode.irmos !== 'string' || ode.irmos.length < 10)
      err(`${pfx}: irmos missing or too short (${ode.irmos.length} chars)`);
    if (!Array.isArray(ode.troparia) || ode.troparia.length === 0)
      err(`${pfx}: troparia missing or empty`);
    if (typeof ode.trinityTroparion !== 'string' || ode.trinityTroparion.length < 10)
      err(`${pfx}: trinityTroparion missing or too short`);
    if (typeof ode.theotokion !== 'string' || ode.theotokion.length < 10)
      err(`${pfx}: theotokion missing or too short`);

    // Ode 6 should have kontakion
    if (ode.ode === 6 && (!ode.kontakion || ode.kontakion.length < 10))
      warn(`${pfx}: Ode 6 missing kontakion`);
  }

  const nodes = simulateLoadGreatCanon(data);
  if (nodes.length === 0) {
    err(`${entry}: zero ServiceNodes produced`);
    continue;
  }

  console.log(`  ${data.odes.length} odes, ${nodes.length} ServiceNodes`);
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
