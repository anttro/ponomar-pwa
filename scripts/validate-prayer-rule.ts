/**
 * Validate Prayer Rule (Молитвослов) section data files.
 * Run with: npx tsx scripts/validate-prayer-rule.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const ROOT = join(__dirname, '..', 'static', 'data', 'shared', 'prayer-rule');

interface ServiceNode { type: string; value: string }

const SECTIONS: Record<string, string[]> = {
  'morning': ['Мл҃тва мытарѧ̀', 'Сѷмво́лъ', 'мака́рїа'],
  'diptychs': ['Помѧ́нникъ'],
  'evening': ['на со́нъ грѧдꙋ́щымъ', 'мл҃твꙋ'],
  'three-canons': ['Канѡ́нъ покаѧ́нный', 'моле́бный', 'храни́тел'],
  'communion': ['причаще́нїю', 'Ѱало́мъ'],
  'thanksgiving': ['Бл҃года́рствєнныѧ'],
  'rule-impurity': ['ѡ҆скверне́нїѧ'],
  'litia-departed': ['ѡ҆ ᲂу҆со́пшихъ'],
  'twelve-psalms': ['двана́десѧть ѱалмѡ́въ'],
  'beginning-ending': ['предначина́тельнаѧ', 'Ѡ҆кончанїе'],
};

let errors = 0;
let warnings = 0;
function err(msg: string) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  WARN: ${msg}`); warnings++; }

for (const [dir, markers] of Object.entries(SECTIONS)) {
  const path = join(ROOT, dir, 'full.json');
  if (!existsSync(path)) { err(`${dir}: missing full.json`); continue; }

  let nodes: ServiceNode[];
  try {
    nodes = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    err(`${dir}: failed to parse: ${(e as Error).message}`);
    continue;
  }

  if (!Array.isArray(nodes) || nodes.length < 10) {
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
  for (const m of markers) {
    if (!all.some(v => v.includes(m))) warn(`${dir}: marker '${m}' not found`);
  }

  console.log(`${dir}: ${nodes.length} nodes, ${headers} headers`);
}



// --- Akathists collection ---
const AKATHISTS: Record<string, string[]> = {
  'trinity-canon': ['трⷪ҇цѣ'],
  'jesus-compunction': ['ᲂу҆мили́тельный'],
  'akathist-jesus': ['А҆ка́ѳїстъ'],
  'jesus-penitential': ['покаѧ́нный'],
  'pascha-canon': ['па́схи'],
  'nativity-canon': ['ржⷭ҇твꙋ̀'],
  'cross-canon': ['крⷭ҇тꙋ̀'],
  'theotokos-moleben': ['моле́бный'],
  'theotokos-thanksgiving': ['бл҃года́ренъ'],
  'akathist-theotokos': ['А҆ка́ѳїстъ'],
  'theotokos-nativity': ['ржⷭ҇твꙋ̀'],
  'pokrov-canon': ['покро́ва'],
  'utoli-pechali': ['печа̑ли'],
  'skoroposlushnitsa': ['скоропослꙋ́шница'],
  'troeruchitsa': ['троерꙋ́чица'],
  'angels-canon': ['а҆рха́гг҃лѡмъ'],
  'michael-canon': ['мїхаи́ла'],
  'gabriel-canon': ['гаврїи́ла'],
  'guardian-angel': ['храни́телю'],
  'forerunner-canon': ['прⷣте́чи'],
  'nicholas-canon-akathist': ['нїкола́ю'],
  'akathist-nicholas': ['А҆ка́ѳїстъ'],
  'spiridon': ['спѷрїдѡ́на'],
  'cyprian-justina': ['кѷпрїа́на'],
  'panteleimon': ['пантелеи́мона'],
  'tryphon': ['трѵ́фѡна'],
  'sergius': ['се́ргїа'],
  'alexander-svirsky': ['а҆леѯа́ндра'],
  'seraphim': ['серафі́мꙋ'],
  'john-kronstadt': ['кроншта́дтскомꙋ'],
  'mary-egypt': ['марі́и'],
  'murom-wonderworkers': ['мꙋ́ромскихъ'],
  'saint-anne': ['а҆́нны'],
};

const AKATHISTS_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'akathists');
for (const [dir, markers] of Object.entries(AKATHISTS)) {
  const path = join(AKATHISTS_DIR, dir, 'full.json');
  if (!existsSync(path)) { err(`akathists/${dir}: missing full.json`); continue; }
  let nodes: ServiceNode[];
  try {
    nodes = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    err(`akathists/${dir}: failed to parse: ${(e as Error).message}`);
    continue;
  }
  if (!Array.isArray(nodes) || nodes.length < 20) {
    err(`akathists/${dir}: too few nodes`);
    continue;
  }
  let headers = 0;
  for (const n of nodes) {
    if (n.type !== 'HEADER' && n.type !== 'TEXT') { err(`akathists/${dir}: invalid type '${n.type}'`); break; }
    if (!n.value || typeof n.value !== 'string') { err(`akathists/${dir}: missing value`); break; }
    if (n.type === 'HEADER') headers++;
  }
  if (headers === 0) err(`akathists/${dir}: no HEADER nodes`);
  const all = nodes.map(n => n.value);
  for (const m of markers) {
    if (!all.some(v => v.includes(m))) warn(`akathists/${dir}: marker '${m}' not found`);
  }
  console.log(`akathists/${dir}: ${nodes.length} nodes, ${headers} headers`);
}

// --- Parimii collection ---
const PARIMII: Record<string, string[]> = {
  'sept': ['СЕПТЕ́МВРІЙ'], 'oct': ['Ѻ҆КТѠ́ВРІЙ'], 'nov': ['НОЕ́МВРІЙ'],
  'dec': ['ДЕКЕ́МВРІЙ'], 'jan': ['І҆АННꙊА́РІЙ'], 'feb': ['ФЕѴРꙊА́РІЙ'],
  'mar': ['МА́РТЪ'], 'apr': ['А҆ПРІЛЛІЙ'], 'may': ['МА́ІЙ'],
  'jun': ['І҆Ꙋ́НІЙ'], 'jul': ['І҆Ꙋ́ЛІЙ'], 'aug': ['А҆́ѴГꙊСТЪ'],
  'cheese-week': ['СЫ́РНАѦ'],
  'lent-week-1': ['ПЕ́РВАѦ СЕДМИ́ЦА'],
  'lent-week-2': ['ВТОРА́Ѧ СЕДМИ́ЦА'],
  'lent-week-3': ['ТРЕ́ТІѦ СЕДМИ́ЦА'],
  'lent-week-4': ['ЧЕТВЕ́РТАѦ СЕДМИ́ЦА'],
  'lent-week-5': ['ПѦ́ТАѦ СЕДМИ́ЦА'],
  'palm-week': ['ВА̀ІЙ'],
  'holy-week': ['ВЕЛИ́КАѦ СЕДМИ́ЦА'],
  'pentecostarion': ['ПЕНТИКО́СТІИ'],
  'common-saints': ['Ѻ҆́БЩЫѦ'],
};

const PARIMII_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'parimii');
for (const [dir, markers] of Object.entries(PARIMII)) {
  const path = join(PARIMII_DIR, dir, 'full.json');
  if (!existsSync(path)) { err(`parimii/${dir}: missing full.json`); continue; }
  let nodes: ServiceNode[];
  try {
    nodes = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    err(`parimii/${dir}: failed to parse: ${(e as Error).message}`);
    continue;
  }
  if (!Array.isArray(nodes) || nodes.length < 10) {
    err(`parimii/${dir}: too few nodes`);
    continue;
  }
  let headers = 0;
  for (const n of nodes) {
    if (n.type !== 'HEADER' && n.type !== 'TEXT') { err(`parimii/${dir}: invalid type '${n.type}'`); break; }
    if (!n.value || typeof n.value !== 'string') { err(`parimii/${dir}: missing value`); break; }
    if (n.type === 'HEADER') headers++;
  }
  if (headers === 0) err(`parimii/${dir}: no HEADER nodes`);
  const all = nodes.map(n => n.value);
  for (const m of markers) {
    if (!all.some(v => v.includes(m))) warn(`parimii/${dir}: marker '${m}' not found`);
  }
  console.log(`parimii/${dir}: ${nodes.length} nodes, ${headers} headers`);
}

// --- Horologion collection ---
const HOROLOGION: Record<string, string[]> = {
  'midnight-daily': ['полꙋ́нощницы'], 'midnight-saturday': ['сꙋббѡ́тнаѧ'], 'midnight-sunday': ['воскрⷭ҇наѧ'],
  'typica': ['и҆з̾ѡбрази́тельныхъ'],
  'interhour-1': ['Междоча́сїе'], 'interhour-3': ['Междоча́сїе'], 'interhour-6': ['Междоча́сїе'], 'interhour-9': ['Междоча́сїе'],
  'panagia': ['панагі́и'], 'meal-blessing': ['трапе́зы'], 'small-compline': ['ма́лагѡ повече́рїѧ'],
};

// --- Sbornik collection ---
const SBORNIK: Record<string, string[]> = {
  'sunday-trop-kont': ['воскрⷭ҇ны'], 'weekday-trop-kont': ['седми́цꙋ'], 'feast-trop-kont': ['пра́здникѡвъ'],
  'lent-trop-kont': ['четыредесѧ́тницꙋ'], 'pentecost-trop-kont': ['пѧтдесѧ́тницꙋ'], 'common-trop-kont': ['ѻ҆́бщїи'],
  'theotokion-sunday': ['Бг҃оро́дичны'], 'theotokion-8tones': ['Бг҃оро́дичны'], 'theotokion-dismissal': ['ѿпꙋсти́тельныѧ'],
  'katavasia': ['Катава́сїа'], 'trinity-troparia': ['Трⷪ҇чны'], 'lamps-weekday': ['Свѣти́льны'],
  'exapostilaria-week': ['Є҆ѯапостїла́рїи'],
  'biblical-songs-feasts': ['пра́здники'], 'biblical-songs-daily': ['по всѧ̑ дни̑'], 'biblical-songs-lent': ['четыредесѧ́тницꙋ'],
};

const HOROLOGION_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'horologion');
for (const [dir, markers] of Object.entries(HOROLOGION)) {
  const path = join(HOROLOGION_DIR, dir, 'full.json');
  if (!existsSync(path)) { err(`horologion/${dir}: missing full.json`); continue; }
  let nodes: ServiceNode[];
  try { nodes = JSON.parse(readFileSync(path, 'utf-8')); } catch { err(`horologion/${dir}: failed to parse`); continue; }
  if (!Array.isArray(nodes) || nodes.length < 5) { err(`horologion/${dir}: too few nodes`); continue; }
  const all = nodes.map(n => n.value);
  for (const m of markers) { if (!all.some(v => v.includes(m))) warn(`horologion/${dir}: marker '${m}' not found`); }
  console.log(`horologion/${dir}: ${nodes.length} nodes`);
}

const SBORNIK_DIR = join(__dirname, '..', 'static', 'data', 'shared', 'sbornik');
for (const [dir, markers] of Object.entries(SBORNIK)) {
  const path = join(SBORNIK_DIR, dir, 'full.json');
  if (!existsSync(path)) { err(`sbornik/${dir}: missing full.json`); continue; }
  let nodes: ServiceNode[];
  try { nodes = JSON.parse(readFileSync(path, 'utf-8')); } catch { err(`sbornik/${dir}: failed to parse`); continue; }
  if (!Array.isArray(nodes) || nodes.length < 5) { err(`sbornik/${dir}: too few nodes`); continue; }
  const all = nodes.map(n => n.value);
  for (const m of markers) { if (!all.some(v => v.includes(m))) warn(`sbornik/${dir}: marker '${m}' not found`); }
  console.log(`sbornik/${dir}: ${nodes.length} nodes`);
}

console.log(`\n${errors + warnings} issues (${errors} errors, ${warnings} warnings)`);
process.exit(errors > 0 ? 1 : 0);
