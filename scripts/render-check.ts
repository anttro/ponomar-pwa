/**
 * Render-check QA: headlessly render every flat-data service and
 * collection section through assembleService, verifying:
 *  - HTML output is non-empty
 *  - HEADER nodes actually render in the output (HEADER fix check)
 *  - No exceptions are thrown
 * Run with: npx tsx scripts/render-check.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { assembleService, type ServiceContext } from '../src/core/service-assembler';
import type { EvalContext, ServiceNode } from '../src/core/types';

const __dirname = new URL('.', import.meta.url).pathname;
const SERVICES = join(__dirname, '..', 'static', 'data', 'shared', 'services');

interface ServiceNodeT { type: string; value?: string }

let errors = 0;
let warnings = 0;
let checked = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

async function render(nodes: ServiceNode[], label: string): Promise<void> {
  const evalCtx: EvalContext = {};
  const ctx: ServiceContext = {
    evalCtx,
    lang: 'cu',
    fetchBibleText: async () => '',
    fetchLives: async () => null,
    fetchCommandText: async () => '',
    resolveTimes: async () => '',
    fetchText: async () => null,
    fetchPrayerNodes: async () => null,
    fetchServiceNodes: async () => null,
  };
  try {
    const { html } = await assembleService(nodes, ctx);
    if (!html.trim()) {
      err(`${label}: empty HTML output`);
      return;
    }
    // Verify HEADER nodes render
    const headers = nodes.filter(n => n.type === 'HEADER' && n.value);
    for (const h of headers.slice(0, 10)) {
      const v = (h as ServiceNodeT).value ?? '';
      const snippet = v.substring(0, 30);
      if (!html.includes(snippet) && v.length > 3) {
        err(`${label}: HEADER not rendered: '${snippet}'`);
        break;
      }
    }
    checked++;
  } catch (e) {
    err(`${label}: exception: ${(e as Error).message}`);
  }
}

async function main() {
  // 1. All flat-data services (subdirs containing full.json)
  const serviceDirs = readdirSync(SERVICES).filter(d => existsSync(join(SERVICES, d, 'full.json')));
  for (const dir of serviceDirs.sort()) {
    const nodes = JSON.parse(readFileSync(join(SERVICES, dir, 'full.json'), 'utf-8')) as ServiceNode[];
    await render(nodes, `service/${dir}`);
  }

  // 2. Collection sections
  const collections = ['prayer-rule', 'akathists', 'parimii', 'horologion', 'sbornik', 'irmologion', 'horologionadd'];

  // Triodion flat layout (NN.json)
  {
    const triDir = join(__dirname, '..', 'static', 'data', 'shared', 'triodion');
    if (existsSync(triDir)) {
      for (const fn of readdirSync(triDir).sort()) {
        if (!fn.endsWith('.json')) continue;
        const nodes = JSON.parse(readFileSync(join(triDir, fn), 'utf-8')) as ServiceNode[];
        await render(nodes, `triodion/${fn}`);
      }
    }
  }
  const extra = [
    ['paraclete', 'services/paraclete'],
  ];
  for (const [col, dir] of extra) {
    const colDir = join(__dirname, '..', 'static', 'data', 'shared', dir);
    if (!existsSync(colDir)) continue;
    for (const tone of readdirSync(colDir).sort()) {
      const toneDir = join(colDir, tone);
      if (!existsSync(toneDir)) continue;
      for (const day of readdirSync(toneDir).sort()) {
        const p = join(toneDir, day);
        if (!p.endsWith('.json')) continue;
        const nodes = JSON.parse(readFileSync(p, 'utf-8')) as ServiceNode[];
        await render(nodes, `${col}/${tone}/${day}`);
      }
    }
  }
  for (const col of collections) {
    const colDir = join(__dirname, '..', 'static', 'data', 'shared', col);
    if (!existsSync(colDir)) continue;
    for (const section of readdirSync(colDir).sort()) {
      const p = join(colDir, section, 'full.json');
      if (!existsSync(p)) continue;
      const nodes = JSON.parse(readFileSync(p, 'utf-8')) as ServiceNode[];
      await render(nodes, `${col}/${section}`);
    }
  }

  console.log(`\nRendered ${checked} services/sections successfully, ${errors} errors, ${warnings} warnings`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
