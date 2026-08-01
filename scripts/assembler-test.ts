/**
 * Assembler integration test: exercise key service templates through
 * assembleService with the same varNode injection the app uses.
 * Run with: npx tsx scripts/assembler-test.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { assembleService, type ServiceContext, type EvalContext } from '../src/core/service-assembler';
import { computeDay } from '../src/core/day-computer';
import { JDate } from '../src/core/jdate';

const __dirname = new URL('.', import.meta.url).pathname;
const SHARED = join(__dirname, '..', 'static', 'data', 'shared');
const CU_SERVICES = join(__dirname, '..', 'static', 'data', 'cu', 'services');
const TEMPLATES = join(SHARED, 'services', 'templates');
const CANONS = join(SHARED, 'services', 'canons');

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

/** Filesystem-backed ServiceContext for testing. */
function makeTestContext(varNodes: Map<string, ServiceNode[]>): ServiceContext {
  const langs = ['cu', 'en', 'shared'];
  const loadJson = (p: string) => JSON.parse(readFileSync(p, 'utf-8'));

  function resolveFile(path: string, type: 'json'): string | null {
    let base = path;
    if (base.startsWith('Services/')) base = base.slice('Services/'.length);
    base = base.replace('.xml', '');

    for (const lang of langs) {
      let p: string | null = null;
      if (base.startsWith('Var/')) {
        continue;
      }
      if (base.startsWith('Text/')) {
        p = join(lang === 'shared' ? SHARED : (lang === 'cu' ? CU_SERVICES : join(__dirname, '..', 'static', 'data', lang, 'services')), 'texts', base.slice('Text/'.length) + '.json');
      } else if (base.startsWith('CommonPrayers/')) {
        p = join(lang === 'shared' ? SHARED : (lang === 'cu' ? CU_SERVICES : join(__dirname, '..', 'static', 'data', lang, 'services')), 'prayers', base.slice('CommonPrayers/'.length) + '.json');
      } else if (base.startsWith('Command/')) {
        p = join(lang === 'shared' ? SHARED : (lang === 'cu' ? CU_SERVICES : join(__dirname, '..', 'static', 'data', lang, 'services')), 'commands', base.slice('Command/'.length) + '.json');
      } else if (base.startsWith('Header/')) {
        p = join(lang === 'shared' ? SHARED : (lang === 'cu' ? CU_SERVICES : join(__dirname, '..', 'static', 'data', lang, 'services')), 'headers', base.slice('Header/'.length) + '.json');
      } else if (base.startsWith('Octoecheos/')) {
        p = join(lang === 'shared' ? SHARED : (lang === 'cu' ? CU_SERVICES : join(__dirname, '..', 'static', 'data', lang, 'services')), 'octoecheos', base.slice('Octoecheos/'.length) + '.json');
      } else {
        p = join(TEMPLATES, base + '.json');
      }
      if (p && existsSync(p)) return p;
    }
    return null;
  }

  // Minimal evalCtx with variables Matins template checks
  const evalCtx: EvalContext = {
    dow: 3, doy: 200, nday: -100, ndayP: 0, ndayF: 0,
    Year: 2026, dRank: 3, PFlag: 0, PFlag1: 1, PFlag2: 1, PFlag3: 0,
    PS: 1, Tone: 3, Easter: 0, Pentecost: 0, LentStart: 0, eothinon: 0, LS: 1, GS: 1,
  };

  return {
    evalCtx,
    lang: 'cu',
    async fetchText(path: string) {
      const file = resolveFile(path, 'json');
      if (!file) return null;
      const nodes = loadJson(file);
      if (!Array.isArray(nodes)) return null;
      const isHeader = path.endsWith('.header');
      const filtered = nodes.filter((n: any) => isHeader ? n.type === 'HEADER' : n.type === 'TEXT');
      return filtered.map((n: any) => String(n.value ?? '')).filter(Boolean).join(isHeader ? ' ' : '<br>');
    },
    async fetchServiceNodes(path: string) {
      const m = path.match(/Services\/(?:Var\/)?(\w+)\.xml$/);
      if (m && varNodes.has(m[1])) return varNodes.get(m[1]) || null;
      const file = resolveFile(path, 'json');
      if (!file) return null;
      const nodes = loadJson(file);
      if (!Array.isArray(nodes)) return null;
      return nodes as any[];
    },
    async fetchPrayerNodes(path: string) {
      const file = resolveFile(path, 'json');
      if (!file) return null;
      const nodes = loadJson(file);
      if (!Array.isArray(nodes)) return null;
      return nodes as any[];
    },
    async fetchBibleText() { return ''; },
    async fetchLives() { return null; },
    async fetchCommandText() { return ''; },
    async resolveTimes(t: number) { return `${t}×`; },
  };
}

/** Load nodes from a JSON file. */
function loadNodes(file: string): any[] | null {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

/** Run a test case: assemble template with varNodes, check output. */
async function runTest(name: string, template: string, varNodes: Map<string, ServiceNode[]>, check: (html: string) => boolean, checkMsg: string): Promise<void> {
  try {
    const templateNodes = loadNodes(join(TEMPLATES, `${template}.json`));
    if (!templateNodes) { err(`${name}: template ${template}.json not found`); return; }
    const ctx = makeTestContext(varNodes);
    const { html } = await assembleService(templateNodes as any, ctx);
    if (!html.trim()) { err(`${name}: empty HTML output`); return; }
    if (!check(html)) { err(`${name}: ${checkMsg}`); return; }
    console.log(`  ✓ ${name}`);
  } catch (e) {
    err(`${name}: exception: ${(e as Error).message}`);
  }
}

async function main() {
  console.log('Running assembler integration tests...\n');

  // 1. Matins weekday → Paraclete canon
  {
    const tone = 3;
    const dow = 3; // Wednesday
    const dayKey = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dow];
    const canonFile = join(CANONS, 'paraclete', `tone${tone}`, `${dayKey}.json`);
    const nodes = loadNodes(canonFile);
    if (nodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PCanonU', nodes as any[]);
      await runTest(
        'Matins weekday (Tone 3 Wed) → Paraclete',
        'Matins',
        varNodes,
        html => html.includes('Пѣснь') || html.includes('Пѣ́снь'),
        'output missing ode markers'
      );
    } else {
      warn('Skipping Matins weekday: canon file not found');
    }
  }

  // 2. Matins Sunday → Octoechos Sunday canon
  {
    const tone = 5;
    const toneNum = tone === 8 ? 0 : tone;
    const canonFile = join(CANONS, `tone${toneNum}`, 'sunday.json');
    const canonData = loadNodes(canonFile);
    if (canonData) {
      // Build nodes same way loadCanonData does
      const ODE_SLAV = ['', 'а', 'в', 'г', 'д', 'є', 'ѕ', 'з', 'и', 'ѳ'];
      const nodes: any[] = [];
      for (const ode of (canonData as any).odes) {
        const slavNum = ODE_SLAV[ode.ode] ?? String(ode.ode);
        nodes.push({ type: 'HEADER', value: `Пѣснь ${slavNum}҃.` });
        for (const canon of ode.canons) {
          if (canon.irmos) {
            nodes.push({ type: 'HEADER', value: `Ірмосъ, гла́съ ${canonData.tone}:` });
            nodes.push({ type: 'TEXT', value: canon.irmos });
          }
          for (const trop of canon.troparia) nodes.push({ type: 'TEXT', value: trop });
          if (canon.theotokion) {
            nodes.push({ type: 'HEADER', value: 'Бг҃ородиченъ:' });
            nodes.push({ type: 'TEXT', value: canon.theotokion });
          }
        }
      }
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PCanonU', nodes);
      await runTest(
        'Matins Sunday (Tone 5) → Octoechos',
        'Matins',
        varNodes,
        html => html.includes('Пѣснь') && html.includes('Ірмосъ'),
        'output missing ode/irmos markers'
      );
    } else {
      warn('Skipping Matins Sunday: canon file not found');
    }
  }

  // 3. Triodion template with PTriodion (first section)
  {
    const triNodes = loadNodes(join(SHARED, 'triodion', '01.json'));
    if (triNodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PTriodion', triNodes as any[]);
      await runTest(
        'Triodion section 01',
        'Triodion',
        varNodes,
        html => html.trim().length > 100,
        'output too short'
      );
    } else {
      err('Triodion 01.json not found');
    }
  }

  // 4. MenaionDay with PMenaionDay (sample date 09-08 = Nativity of Theotokos)
  {
    const menNodes = loadNodes(join(SHARED, 'menaion-daily', '09-08', '1.json'));
    if (menNodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PMenaionDay', menNodes as any[]);
      await runTest(
        'MenaionDay (09-08 Nativity Theotokos)',
        'MenaionDay',
        varNodes,
        html => html.trim().length > 100,
        'output too short'
      );
    } else {
      err('menaion-daily/09-08/1.json not found');
    }
  }

  // 5. Pascha (data-backed service) with PPascha
  {
    const paschaNodes = loadNodes(join(SHARED, 'services', 'pascha', 'full.json'));
    if (paschaNodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PPascha', paschaNodes as any[]);
      await runTest(
        'Pascha (data-backed)',
        'Pascha',
        varNodes,
        html => html.includes('Хрїсто́съ воскре́се') || html.includes('Воскресе́нїе'),
        'output missing Pascha text'
      );
    } else {
      err('services/pascha/full.json not found');
    }
  }

  // 6. Paralytic (I-prefix var) with IParalytic
  {
    const paralyticNodes = loadNodes(join(SHARED, 'services', 'paralytic', 'full.json'));
    if (paralyticNodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('IParalytic', paralyticNodes as any[]);
      await runTest(
        'Paralytic (I-prefix var)',
        'Paralytic',
        varNodes,
        html => html.trim().length > 100 && !html.includes('Service template not found'),
        'output too short or template missing'
      );
    } else {
      err('services/paralytic/full.json not found');
    }
  }

  // 7. Sergius (bare P-prefix var) with PSergius
  {
    const sergiusNodes = loadNodes(join(SHARED, 'services', 'sergius', 'full.json'));
    if (sergiusNodes) {
      const varNodes = new Map<string, ServiceNode[]>();
      varNodes.set('PSergius', sergiusNodes as any[]);
      await runTest(
        'Sergius (bare P-prefix var)',
        'Sergius',
        varNodes,
        html => html.trim().length > 100 && !html.includes('Service template not found'),
        'output too short or template missing'
      );
    } else {
      err('services/sergius/full.json not found');
    }
  }

  console.log(`\nAssembler tests: ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

main();