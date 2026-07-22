/**
 * Master conversion script — converts all XML data to JSON at build time.
 * Run with: tsx scripts/convert-all.ts
 */

import { convertCalendar } from './convert-calendar.ts';
import { convertLives } from './convert-lives.ts';
import { convertServices } from './convert-services.ts';
import { convertBibleMeta } from './convert-bible-meta.ts';
import { convertFasting } from './convert-fasting.ts';
import { convertCommands } from './convert-commands.ts';
import { convertServiceRules } from './convert-service-rules.ts';
import { mkdirSync, existsSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', '..', 'ponomar', 'Ponomar');
const OUT = join(__dirname, '..', 'static', 'data');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function main() {
  const start = Date.now();
  console.log('Converting Ponomar XML data to JSON...\n');

  ensureDir(OUT);

  // Copy font
  const fontSrc = join(SRC, 'Ponomar-Regular.woff');
  const fontDst = join(__dirname, '..', 'static', 'fonts', 'Ponomar-Regular.woff');
  ensureDir(dirname(fontDst));
  if (existsSync(fontSrc)) {
    cpSync(fontSrc, fontDst);
    console.log('Copied Ponomar font.');
  }

  // Convert all data in parallel
  await Promise.all([
    convertCalendar(SRC, OUT),
    convertLives(SRC, OUT),
    convertServices(SRC, OUT),
    convertBibleMeta(SRC, OUT),
    convertFasting(SRC, OUT),
    convertCommands(SRC, OUT),
    convertServiceRules(SRC, OUT),
  ]);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nAll conversions complete in ${elapsed}s.`);
  console.log(`Output: ${OUT}`);
}

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
