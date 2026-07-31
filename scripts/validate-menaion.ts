/**
 * Validate Festal Menaion (Great Feast) service data files.
 * Run with: npx tsx scripts/validate-menaion.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'services');

interface ServiceNode { type: string; value: string }

const SERVICES: Record<string, { month: number; day: number; markers: string[]; template: string }> = {
  'nativity-theotokos':    { month: 9,  day: 8,  markers: ['Ржⷭ҇тво̀ прест҃ы́ѧ'], template: 'NativityTheotokos' },
  'exaltation':            { month: 9,  day: 14, markers: ['воздви́женїе честна́гѡ'], template: 'Exaltation' },
  'vvedenie':              { month: 11, day: 21, markers: ['Вхо́дъ во хра́мъ'], template: 'Vvedenie' },
  'nativity-hours':        { month: 12, day: 24, markers: ['на́вечерїи ржⷭ҇тва̀'], template: 'NativityHours' },
  'nativity':              { month: 12, day: 25, markers: ['ржⷭ҇тво̀ гдⷭ҇а'], template: 'Nativity' },
  'theophany-hours':       { month: 1,  day: 5,  markers: ['на́вечерїи просвѣще́нїѧ'], template: 'TheophanyHours' },
  'theophany':             { month: 1,  day: 6,  markers: ['бг҃оѧвле́нїе гдⷭ҇а'], template: 'Theophany' },
  'sretenie':              { month: 2,  day: 2,  markers: ['Срѣ́тенїе гдⷭ҇а'], template: 'Sretenie' },
  'annunciation':          { month: 3,  day: 25, markers: ['Бл҃говѣ́щенїе'], template: 'Annunciation' },
  'forerunner-birth':      { month: 6,  day: 24, markers: ['Рождество̀ честна́гѡ'], template: 'ForerunnerBirth' },
  'peter-paul':            { month: 6,  day: 29, markers: ['первоверхо́вныхъ'], template: 'PeterPaul' },
  'transfiguration':       { month: 8,  day: 6,  markers: ['преѡбраже́нїе гдⷭ҇а'], template: 'Transfiguration' },
  'dormition':             { month: 8,  day: 15, markers: ['Оу҆спе́нїе прест҃ы́ѧ'], template: 'Dormition' },
  'forerunner-beheading':  { month: 8,  day: 29, markers: ['Оу҆сѣкнове́нїе честны́ѧ'], template: 'ForerunnerBeheading' },
  'sergius':               { month: 9,  day: 25, markers: ['се́ргїа'], template: 'Sergius' },
  'johntheologian-sep':    { month: 9,  day: 26, markers: ['бг҃осло́ва'], template: 'JohnTheologianSep' },
  'pokrov':                { month: 10, day: 1,  markers: ['Покро́въ'], template: 'Pokrov' },
  'ambrose':               { month: 10, day: 10, markers: ['а҆мвро́сїа'], template: 'Ambrose' },
  'seventh-council-fathers': { month: 10, day: 11, markers: ['седмо́мъ'], template: 'SeventhCouncilFathers' },
  'kazan':                 { month: 10, day: 22, markers: ['каза́нскїѧ'], template: 'Kazan' },
  'demetrius':             { month: 10, day: 26, markers: ['дими́трїа'], template: 'Demetrius' },
  'michael-synaxis':       { month: 11, day: 8,  markers: ['мїхаи́ла'], template: 'MichaelSynaxis' },
  'nicholas':              { month: 12, day: 6,  markers: ['нїкола́а'], template: 'Nicholas' },
  'circumcision':          { month: 1,  day: 1,  markers: ['ѡ҆брѣ́занїе'], template: 'Circumcision' },
  'finding-head-1st':      { month: 2,  day: 24, markers: ['ѡ҆брѣ́тенїе'], template: 'FindingHead1st' },
  'forty-martyrs':         { month: 3,  day: 9,  markers: ['м҃ мч҃никъ'], template: 'FortyMartyrs' },
  'johntheologian-may':    { month: 5,  day: 8,  markers: ['бг҃осло́ва'], template: 'JohnTheologianMay' },
  'nicholas-translation':  { month: 5,  day: 9,  markers: ['нїкола́а'], template: 'NicholasTranslation' },
  'finding-head-3rd':      { month: 5,  day: 25, markers: ['Тре́тїе ѡ҆брѣ́тенїе'], template: 'FindingHead3rd' },
  'vladimir':              { month: 7,  day: 15, markers: ['влади́мїра'], template: 'Vladimir' },
  'six-councils-fathers':  { month: 7,  day: 16, markers: ['шестѝ собо́рѡвъ'], template: 'SixCouncilsFathers' },
  'elijah':                { month: 7,  day: 20, markers: ['и҆лїѝ'], template: 'Elijah' },
  'panteleimon':           { month: 7,  day: 27, markers: ['пантелеи́мона'], template: 'Panteleimon' },
  'procession-cross':      { month: 8,  day: 1,  markers: ['Происхожде́нїе'], template: 'ProcessionCross' },
  'forefathers-sunday':    { month: 12, day: 11, markers: ['пра́ѻтєцъ'], template: 'ForefathersSunday' },
  'holy-fathers-nativity': { month: 12, day: 18, markers: ['предъ ржⷭ҇тво́мъ'], template: 'HolyFathersNativity' },
  'sunday-after-nativity': { month: 12, day: 26, markers: ['по ржⷭ҇твѣ̀'], template: 'SundayAfterNativity' },
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

  if (!Array.isArray(nodes) || nodes.length < 50) {
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

  // Matins presence for full feast services (not Royal Hours)
  if (!['nativity-hours', 'theophany-hours'].includes(dir)) {
    if (!all.some(v => v.includes('На ᲂу҆́трени') || v.includes('на ᲂу҆́трени')))
      warn(`${dir}: no Matins marker`);
  }

  console.log(`${dir}: ${nodes.length} nodes, ${headers} headers (${spec.month}/${spec.day})`);
}

for (const spec of Object.values(SERVICES)) {
  if (!existsSync(join(ROOT, 'templates', `${spec.template}.json`))) {
    err(`missing template: ${spec.template}.json`);
  }
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
