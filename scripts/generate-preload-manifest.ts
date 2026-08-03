/**
 * Generates preload-manifest.json listing all existing data files
 * organized by language and type. Run when data files are added or removed.
 *
 * Usage: npx tsx scripts/generate-preload-manifest.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../static/data');
const LANGUAGES = ['en', 'ru', 'cu'];
const dom = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface Manifest {
  [lang: string]: {
    calendar: string[];
    bible: string[];
  };
}

function exists(p: string): boolean {
  return fs.existsSync(path.join(DATA_DIR, p));
}

function calendarFiles(lang: string): string[] {
  const files: string[] = [];

  // Lives: month files
  for (let m = 1; m <= 12; m++) {
    const p = `/${lang}/lives/${String(m).padStart(2, '0')}.json`;
    if (exists(p)) files.push(`/data${p}`);
  }
  // Lives: misc files
  for (let d = 0; d <= 9; d++) {
    const p = `/${lang}/lives/misc/${d}.json`;
    if (exists(p)) files.push(`/data${p}`);
  }

  // Shared lives index
  if (exists('/shared/lives-index.json')) files.push('/data/shared/lives-index.json');

  // Calendar shared
  for (const f of ['/shared/fasting.json', '/shared/calendar/triodion.json', '/shared/calendar/pentecostarion.json']) {
    if (exists(f)) files.push(`/data${f}`);
  }

  // Menaion bundle
  const mb = `/${lang}/menaion-bundle.json`;
  if (exists(mb)) files.push(`/data${mb}`);

  // Service templates
  const tplDir = path.join(DATA_DIR, 'shared/services/templates');
  if (fs.existsSync(tplDir)) {
    for (const t of fs.readdirSync(tplDir)) {
      if (t.endsWith('.json')) {
        files.push(`/data/shared/services/templates/${t}`);
      }
    }
  }

  // Feast data
  const svcDir = path.join(DATA_DIR, 'shared/services');
  if (fs.existsSync(svcDir)) {
    for (const d of fs.readdirSync(svcDir)) {
      const fullPath = path.join(svcDir, d, 'full.json');
      if (fs.statSync(path.join(svcDir, d)).isDirectory() && fs.existsSync(fullPath) && d !== 'templates' && d !== 'canons' && d !== 'paraclete') {
        files.push(`/data/shared/services/${d}/full.json`);
      }
    }
  }

  // Paraclete day files
  for (let tone = 1; tone <= 8; tone++) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      const p = `/shared/services/paraclete/tone${tone}/${day}.json`;
      if (exists(p)) files.push(`/data${p}`);
    }
  }

  // Service canons
  for (let tone = 0; tone <= 7; tone++) {
    const p = `/shared/services/canons/tone${tone}/sunday.json`;
    if (exists(p)) files.push(`/data${p}`);
  }
  for (let tone = 1; tone <= 8; tone++) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      const p = `/shared/services/canons/paraclete/tone${tone}/${day}.json`;
      if (exists(p)) files.push(`/data${p}`);
    }
  }
  for (let p = 1; p <= 4; p++) {
    const fp = `/shared/services/canons/great-canon/part${p}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Menaion daily index
  if (exists('/shared/menaion-daily/index.json')) files.push('/data/shared/menaion-daily/index.json');

  // Menaion daily sections
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= dom[m - 1]; d++) {
      const dateKey = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (let n = 1; n <= 4; n++) {
        const fp = `/shared/menaion-daily/${dateKey}/${n}.json`;
        if (exists(fp)) files.push(`/data${fp}`);
      }
    }
  }

  // Triodion
  for (let i = 1; i <= 37; i++) {
    const fp = `/shared/triodion/${String(i).padStart(2, '0')}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Pentecostarion
  for (let i = 1; i <= 315; i++) {
    const fp = `/shared/pentecostarion/${String(i).padStart(2, '0')}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Menaion common + add
  for (let i = 1; i <= 42; i++) {
    const fp = `/shared/menaion-common/${String(i).padStart(2, '0')}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }
  for (let i = 1; i <= 51; i++) {
    const fp = `/shared/menaion-add/${String(i).padStart(2, '0')}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Prayer collections
  const prayerDirs: [string, string[]][] = [];
  for (const coll of ['akathists', 'horologion', 'prayer-rule', 'sbornik', 'irmologion']) {
    const collDir = path.join(DATA_DIR, 'shared', coll);
    if (fs.existsSync(collDir)) {
      const items = fs.readdirSync(collDir).filter(d => fs.statSync(path.join(collDir, d)).isDirectory());
      prayerDirs.push([coll, items]);
    }
  }
  for (const [coll, items] of prayerDirs) {
    for (const item of items) {
      const fp = `/shared/${coll}/${item}/full.json`;
      if (exists(fp)) files.push(`/data${fp}`);
    }
  }

  // Horologion additions
  const horAddItems = ['exapostilaria', 'katavasia', 'lamps', 'songs-daily', 'songs-feasts', 'songs-lent',
    'theotokia-8tones', 'theotokia-dismissal', 'theotokia-sunday', 'trinity-8tones',
    'trop-common', 'trop-daily', 'trop-lent', 'trop-pentecost', 'trop-sunday'];
  for (const item of horAddItems) {
    const fp = `/shared/horologionadd/${item}/full.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }
  for (const m of ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']) {
    const fp = `/shared/horologionadd/trop-feasts-${m}/full.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Parimii
  const parimiiDir = path.join(DATA_DIR, 'shared', 'parimii');
  if (fs.existsSync(parimiiDir)) {
    for (const d of fs.readdirSync(parimiiDir)) {
      const fp = `/shared/parimii/${d}/full.json`;
      if (exists(fp)) files.push(`/data${fp}`);
    }
  }

  // Commemorations
  for (const cid of ['134', '35', '373', '543', 'F0', 'F6']) {
    const fp = `/shared/commemorations/${cid}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Language-specific commands
  for (const cmd of ['Times.json', 'LanguagePacks.json', 'Podobni.json', 'RuleBasedNumbers.json']) {
    const fp = `/${lang}/commands/${cmd}`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  // Language-specific octoecheos
  for (let tone = 0; tone <= 7; tone++) {
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
      const fp = `/${lang}/services/octoecheos/tone${tone}/${day}.json`;
      if (exists(fp)) files.push(`/data${fp}`);
    }
  }

  // Language-specific service commands
  for (let tone = 1; tone <= 8; tone++) {
    const fp = `/${lang}/services/commands/Tone${tone}.json`;
    if (exists(fp)) files.push(`/data${fp}`);
  }
  for (const cmd of ['AfterEach.json', 'Bow.json', 'Prostration.json', 'S1.json', 'S2.json']) {
    const fp = `/${lang}/services/commands/${cmd}`;
    if (exists(fp)) files.push(`/data${fp}`);
  }

  return files;
}

const manifest: Manifest = {} as Manifest;

for (const lang of LANGUAGES) {
  manifest[lang] = {
    calendar: calendarFiles(lang),
    bible: ['/data/bible/versions.json'],
  };
  console.log(`${lang}: ${manifest[lang].calendar.length} calendar files`);
}

const outPath = path.join(DATA_DIR, 'shared', 'preload-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to ${outPath}`);