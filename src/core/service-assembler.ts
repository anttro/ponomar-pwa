/**
 * Service Assembler — recursive template processor for liturgical services.
 * Processes service XML templates (pre-converted to JSON) and renders HTML.
 *
 * Service.java is part of the Ponomar program.
 * Copyright 2008, 2009, 2011 Yuri Shardt.
 * See LICENSE for redistribution terms.
 */

import { evalBool } from './evaluator';
import type { EvalContext, ServiceNode } from './types';

export interface CommonTranslations {
  priest: string;
  reader: string;
  deacon: string;
  choir: string;
}

export interface ServiceContext {
  evalCtx: EvalContext;
  lang: string;
  fetchText: (path: string) => Promise<string | null>;
  fetchServiceNodes: (path: string) => Promise<ServiceNode[] | null>;
  fetchPrayerNodes: (path: string) => Promise<ServiceNode[] | null>;
  fetchBibleText: (book: string, passage: string, showVerseNumbers?: boolean, verseNewLine?: boolean) => Promise<string>;
  fetchLives: (id: string) => Promise<Record<string, Record<string, Record<string, unknown>>> | null>;
  fetchCommandText: (name: string) => Promise<string>;
  resolveTimes: (times: number) => Promise<string>;
  t?: { common: CommonTranslations };
}

function localizeWho(who: string, ctx: ServiceContext): string {
  const t = ctx.t?.common;
  if (!t) return who;
  const map: Record<string, string | undefined> = {
    P: t.priest,
    Priest: t.priest,
    R: t.reader,
    Reader: t.reader,
    SR: t.reader,
    D: t.deacon,
    Deacon: t.deacon,
    C: t.choir,
    Choir: t.choir,
  };
  return map[who] ?? who;
}

// Localized reading intro names (getreading case)
// Values from Java bible.xml Intro field
const READING_NAMES: Record<string, Record<string, string>> = {
  en: {
    Isa: 'A reading from the Prophecy of Isaiah',
    Mica: 'A reading from the Prophecy of Micah',
    Zech: 'A reading from the Prophecy of Zechariah',
    Jerem: 'A reading from the Prophecy of Jeremiah',
    Baruch: 'A reading from the Prophecy of Jeremiah',
    Mal: 'A reading from the Prophecy of Malachi',
    Zeph: 'A reading from the Prophecy of Zephaniah',
    Mt: 'A reading from the Holy Gospel according to Matthew',
    Mk: 'A reading from the Holy Gospel according to Mark',
    Lk: 'A reading from the Holy Gospel according to Luke',
    Jn: 'A reading from the Holy Gospel according to John',
    Acts: 'A reading from the Acts of the Apostles',
    Rom: 'A reading from the Epistle of Paul to the Romans',
    Gal: 'A reading from the Epistle of Paul to the Galatians',
    Tit: 'A reading from the Epistle to Titus',
    Heb: 'A reading from the Epistle to the Hebrews',
  },
  cu: {
    Isa: 'Прⷪ҇ро́чества и҆са́їина чте́нїе',
    Mica: 'Прⷪ҇ро́чества мїхе́ина чте́нїе',
    Zech: 'Прⷪ҇ро́чества заха́рїина чте́нїе',
    Jerem: 'Прⷪ҇ро́чества і҆еремі́ина чте́нїе',
    Baruch: 'Прⷪ҇ро́чества і҆еремі́ина чте́нїе',
    Mal: 'Прⷪ҇ро́чества малахі́ина чте́нїе',
    Zeph: 'Прⷪ҇ро́чества софо́нїева чте́нїе',
    Mt: 'Ѿ матѳе́а ст҃а́гѡ є҆ѵⷢ҇лїа чте́нїе',
    Mk: 'Ѿ ма́рка ст҃а́гѡ є҆ѵⷢ҇лїа чте́нїе',
    Lk: 'Ѿ лꙋкѝ ст҃а́гѡ є҆ѵⷢ҇лїа чте́нїе',
    Jn: 'Ѿ і҆ѡа́нна ст҃а́гѡ є҆ѵⷢ҇лїа чте́нїе',
    Acts: 'Дѣѧ̑нїй ст҃ы́хъ а҆пⷭ҇лъ чте́нїе',
    Rom: 'Къ ри́млѧнѡмъ посла́нїѧ ст҃гѡ а҆пⷭ҇ла па́ѵла чте́нїе',
    Gal: 'Къ гала́тѡмъ посла́нїѧ ст҃гѡ а҆пⷭ҇ла па́ѵла чте́нїе',
    Tit: 'Къ ті́тꙋ посла́нїѧ ст҃гѡ а҆пⷭ҇ла па́ѵла чте́нїе',
    Heb: 'Ко є҆вре́ємъ посла́нїѧ ст҃гѡ а҆пⷭ҇ла па́ѵла чте́нїе',
  },
  fr: {
    Isa: 'Une lection d\'Ésaïe',
    Mica: 'Une lection de la prophétie de Michée',
    Zech: 'Une lection de la prophétie de Zacharie',
    Jerem: 'Une lection de la prophétie de Jérémie',
    Baruch: 'Une lection de la prophétie de Jérémie',
    Mal: 'Une lection de la prophétie de Malachie',
    Zeph: 'Une lection de la prophétie de Sophonie',
    Mt: 'Une lection du Saint Évangile selon Saint Matthieu',
    Mk: 'Une lection du Saint Évangile selon Saint Marc',
    Lk: 'Une lection du Saint Évangile selon Saint Luc',
    Jn: 'Une lection du Saint Évangile selon Saint Jean',
    Acts: 'Une lection des Actes des Apôtres',
    Rom: 'Une lection de l\'Épître de Paul aux Romains',
    Gal: 'Une lection de l\'Épître de Paul aux Galates',
    Tit: 'Une lection de l\'Épître de Paul au Tite',
    Heb: 'Une lection de l\'Épître de Paul aux Hébreux',
  },
  el: {
    Isa: 'Προφητείας Ἡσαΐου τὸ Ἀνάγνωσμα',
    Mica: 'Προφητείας Μιχαίου τὸ Ἀνάγνωσμα',
    Zech: 'Προφητείας Ζαχαρίου τὸ Ἀνάγνωσμα',
    Jerem: 'Προφητείας Ἱερεμίου τὸ Ἀνάγνωσμα',
    Baruch: 'Προφητείας Ἱερεμίου τὸ Ἀνάγνωσμα',
    Mal: 'Προφητείας Μαλαχίου τὸ ἀνάγνωσμα',
    Zeph: 'Προφητείας Σοφονίου τὸ Ἀνάγνωσμα',
    Mt: 'Εὐαγγέλιον ἐκ τοῦ κατὰ Ματθαῖον',
    Mk: 'Εὐαγγέλιον ἐκ τοῦ κατὰ Μᾶρκον',
    Lk: 'Εὐαγγέλιον ἐκ τοῦ κατὰ Λουκᾶν',
    Jn: 'Εὐαγγέλιον ἐκ τοῦ κατὰ Ἰωάννην',
    Acts: 'Πράξεων τῶν Ἀποστολων',
    Rom: 'Πρὸς Ῥωμαίους Ἐπιστολῆς Παύλου τὸ Ἀνάγνωσμα',
    Gal: 'Πρὸς Γαλάτας ἐπιστολῆς Παύλου τὸ Ἀνάγνωσμα',
    Tit: 'Πρὸς Τίτον ἐπιστολῆς Παύλου τὸ Ἀνάγνωσμα',
    Heb: 'Πρὸς Ἑβραίους Ἐπιστολῆς Παύλου τὸ Ἀνάγνωσμα',
  },
};

// Localized book names for passage headers
const HEADER_NAMES: Record<string, Record<string, string>> = {
  en: {
    Psalm: 'Psalm', Isa: 'Isaiah', Jr: 'Jeremiah', Jerem: 'Jeremiah',
    Ez: 'Ezekiel', Dn: 'Daniel', Mic: 'Micah', Mica: 'Micah',
    Na: 'Nahum', Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai',
    Zech: 'Zechariah', Mal: 'Malachi', Mt: 'Matthew', Mk: 'Mark',
    Lk: 'Luke', Jn: 'John', Rom: 'Romans', Heb: 'Hebrews',
    Gal: 'Galatians', Acts: 'Acts', Baruch: 'Baruch',
  },
  cu: {
    Psalm: 'Ѱалти́рь', Isa: 'И҆са́їи', Jr: 'І҆еремі́и', Jerem: 'І҆еремі́и',
    Ez: 'І҆езекі́ль', Dn: 'Дані́илъ', Mic: 'Мїхе́й', Mica: 'Мїхе́й',
    Na: 'Наꙋ́мъ', Hab: 'Аввакꙋ́мъ', Zeph: 'Софо́нїа', Hag: 'Аггѣ́й',
    Zech: 'Заха́рїа', Mal: 'Малахі́а', Mt: 'Ѿ Матѳе́а', Mk: 'Ѿ Ма́рка',
    Lk: 'Ѿ лꙋкѝ', Jn: 'Ѿ і҆ѡа́нна', Rom: 'Къ ри́млѧнѡмъ', Heb: 'Ко є҆вре́ємъ',
    Gal: 'Къ гала́тѡмъ', Acts: 'Дѣѧ̑нїѧ ст҃ы́хъ а҆пⷭ҇лъ', Baruch: 'Варꙋ́хъ',
  },
  fr: {
    Psalm: 'Psaumes', Isa: 'Isaïe / Ésaïe', Jr: 'Jérémie', Jerem: 'Jérémie',
    Ez: 'Ézéchiel', Dn: 'Daniel', Mic: 'Michée', Mica: 'Michée',
    Na: 'Nahum', Hab: 'Habacuc', Zeph: 'Sophonie', Hag: 'Aggée',
    Zech: 'Zacharie', Mal: 'Malachie', Mt: 'Matthieu', Mk: 'Marc',
    Lk: 'Luc', Jn: 'Jean', Rom: 'Romains', Heb: 'Hébreux',
    Gal: 'Galates', Acts: 'Actes des Apôtres', Baruch: 'Baruch',
  },
  el: {
    Psalm: 'Ψαλμοί', Isa: 'Ἡσαΐας', Jr: 'Ἱερεμίας', Jerem: 'Ἱερεμίας',
    Ez: 'Ἰεζεκιήλ', Dn: 'Δανιήλ', Mic: 'Μιχαίας', Mica: 'Μιχαίας',
    Na: 'Ναούμ', Hab: 'Ἀμβακούμ', Zeph: 'Σοφονίας', Hag: 'Ἀγγαῖος',
    Zech: 'Ζαχαρίας', Mal: 'Μαλαχίας', Mt: 'Εὐαγγέλιον κατὰ Ματθαῖον', Mk: 'Εὐαγγέλιον κατὰ Μᾶρκον',
    Lk: 'Εὐαγγέλιον κατὰ Λουκᾶν', Jn: 'Εὐαγγέλιον κατὰ Ἰωάννην',
    Rom: 'Πρὸς Ῥωμαίους', Heb: 'Πρὸς Ἑβραίους',
    Gal: 'Πρὸς Γαλάτας', Acts: 'Πράξεων τῶν Ἀποστολων', Baruch: 'Βαρούχ',
  },
};

function getReadingName(bookId: string, lang: string): string {
  const lookupLang = lang === 'ru' ? 'cu' : lang;
  const map = READING_NAMES[lookupLang] ?? READING_NAMES.en;
  return map[bookId] ?? bookId;
}

function getHeaderName(bookId: string, lang: string): string {
  const lookupLang = lang === 'ru' ? 'cu' : lang;
  const map = HEADER_NAMES[lookupLang] ?? HEADER_NAMES.en;
  return map[bookId] ?? bookId;
}

interface ImplementOptions {
  header?: string;
  who: string;
  command?: string;
  commandB?: string;
  commandText?: string;
  commandBText?: string;
  timesText?: string;
  redFirst?: boolean;
  newLine?: boolean;
  headerLevel?: number;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
function bool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return undefined;
}
function num(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10);
  return undefined;
}

/**
 * Assemble a service from pre-parsed JSON template nodes.
 * Returns HTML string.
 */
export async function assembleService(
  nodes: ServiceNode[],
  ctx: ServiceContext,
  depth: number = 0
): Promise<{ html: string; whoLast: string }> {
  if (depth > 10) return { html: '<!-- Max recursion depth reached -->', whoLast: '\x00' };

  let html = '';
  let whoLast = '\x00';

  // Buffer for grouping same-who lines into a single flex container
  let groupWho: string | null = null;
  let groupTexts: string[] = [];

  function flushGroup() {
    if (!groupWho || groupTexts.length === 0) return;
    const linesHtml = groupTexts.map((t, i) => {
      const redPart = extractFirstLetter(t);
      const line = redPart
        ? `<b><span class="text-red">${redPart}</span></b>${t.substring(redPart.length)}`
        : t;
      return (i > 0 ? '<br>' : '') + line;
    }).join('');
    html += `<div class="flex items-baseline gap-1"><b class="text-red shrink-0">${groupWho}:</b><span>${linesHtml}</span></div>\n`;
    whoLast = groupWho;
    groupWho = null;
    groupTexts = [];
  }

  for (const raw of nodes) {
    const n = raw as Record<string, unknown>;
    const type = n.type as string;

    // Evaluate Cmd attribute if present
    const cmd = str(n.cmd);
    if (cmd) {
      if (!evalBool(cmd, ctx.evalCtx)) continue;
    }

    switch (type) {
      case 'TITLE': {
        flushGroup();
        const value = str(n.value);
        const source = str(n.source);
        const comment = str(n.comment);
        if (value) {
          const titleText = await ctx.fetchText(`Services/Text/${value}.xml`);
          if (titleText) html += `<h1 class="mt-4">${titleText}</h1>\n`;
        }
        if (source) {
          const sourceText = await ctx.fetchText(`Services/Text/${source}.xml`);
          if (sourceText) html += `<p class="text-red italic text-sm">${sourceText}</p>`;
        }
        if (comment) {
          const commentText = await ctx.fetchText(`Services/Text/${comment}.xml`);
          if (commentText) html += `<p class="italic text-sm">${commentText}</p>`;
        }
        break;
      }

      case 'SUBTITLE': {
        flushGroup();
        const value = str(n.value);
        const comment = str(n.comment);
        if (value) {
          const subText = await ctx.fetchText(`Services/Text/${value}.xml`);
          if (subText) html += `<h2 class="mt-4">${subText}</h2>\n`;
        }
        if (comment) {
          const commentText = await ctx.fetchText(`Services/Text/${comment}.xml`);
          if (commentText) html += `<p class="italic text-sm">${commentText}</p>`;
        }
        break;
      }

      case 'GET': {
        flushGroup();
        const file = str(n.file);
        if (!file) break;
        const subNodes = await ctx.fetchServiceNodes(`Services/${file}.xml`);
        if (subNodes) {
          const subResult = await assembleService(subNodes, ctx, depth + 1);
          if (n.null && !subResult.html.trim()) {
            // Null check: skip if empty
          } else {
            html += subResult.html;
            whoLast = subResult.whoLast;
          }
        }
        break;
      }

      case 'CREATE': {
        const what = str(n.what) ?? '';
        const whoRaw = str(n.who);
        const who = whoRaw !== undefined ? localizeWho(whoRaw, ctx) : '';
        let text = '';
        let header = '';
        const commandName = str(n.command);
        const commandBName = str(n.commandB);
        const timesVal = num(n.times);
        const [commandText, commandBText, timesText] = await Promise.all([
          commandName ? ctx.fetchCommandText(commandName) : Promise.resolve(''),
          commandBName ? ctx.fetchCommandText(commandBName) : Promise.resolve(''),
          timesVal ? ctx.resolveTimes(timesVal) : Promise.resolve(''),
        ]);
        if (what) {
          // Try fetching structured prayer nodes (preserves per-line who)
          const prayerNodes = await ctx.fetchPrayerNodes(`Services/CommonPrayers/${what}.xml`);
          if (prayerNodes && prayerNodes.length > 0) {
            header = await ctx.fetchText(`Services/CommonPrayers/${what}.xml.header`) ?? '';
            // Check if any TEXT nodes have their own who field
            const hasWhoNodes = prayerNodes.some(n => n.type === 'TEXT' && str((n as Record<string, unknown>).who) !== undefined);
            if (hasWhoNodes) {
              // Render header before individual who-nodes
              const headerHtml = n.header && header
                ? `<h2 class="text-center text-red font-bold mt-4">${header}</h2>`
                : '';
              if (headerHtml) html += headerHtml + '\n';
              for (const pn of prayerNodes) {
                if (pn.type !== 'TEXT') continue;
                const pnWhoRaw = str((pn as Record<string, unknown>).who);
                const pnWho = pnWhoRaw !== undefined ? localizeWho(pnWhoRaw, ctx) : '';
                const pnText = str((pn as Record<string, unknown>).what) ?? str((pn as Record<string, unknown>).value) ?? '';
                const pnOpts = {
                  who: pnWho,
                  commandText: commandText || undefined,
                  commandBText: commandBText || undefined,
                  timesText: timesText || undefined,
                  redFirst: bool((pn as Record<string, unknown>).redFirst) ?? bool(n.redFirst),
                  newLine: bool((pn as Record<string, unknown>).newLine) ?? bool(n.newLine),
                  headerLevel: 0,
                };
                const pnFmt = formatServiceContent(pnText, pnOpts);
                if (pnWho) {
                  if (pnWho !== groupWho) flushGroup();
                  groupWho = pnWho;
                  groupTexts.push(pnFmt);
                } else {
                  flushGroup();
                  const br = pnOpts.newLine ? '<br>' : '';
                  html += `${br}<p>${pnFmt}</p>`;
                }
              }
              if (whoRaw !== undefined) whoLast = who;
              break;
            }
            // No who nodes — fall back to flattening like fetchText
            text = prayerNodes
              .filter(n => n.type === 'TEXT')
              .map(n => String(str((n as Record<string, unknown>).value) ?? '').replace(/\n/g, ' '))
              .filter(Boolean)
              .join('<br>') || '';
            // header is preserved for rendering after group flush below
          } else {
            // No structured nodes — use fetchText
            text = await ctx.fetchText(`Services/CommonPrayers/${what}.xml`) ?? '';
            if (!text.trim()) {
              text = what;
            }
            header = await ctx.fetchText(`Services/CommonPrayers/${what}.xml.header`) ?? '';
          }
        }
        const opts = {
          who,
          commandText: commandText || undefined,
          commandBText: commandBText || undefined,
          timesText: timesText || undefined,
          redFirst: bool(n.redFirst),
          newLine: bool(n.newLine),
          headerLevel: n.header ? 1 : 0,
        };
        const fmt = formatServiceContent(text, opts);
        const headerHtml = opts.headerLevel && header
          ? `<h2 class="text-center text-red font-bold mt-4">${header}</h2>`
          : '';
        if (who) {
          if (who !== groupWho || headerHtml) flushGroup();
          if (headerHtml) html += headerHtml + '\n';
          groupWho = who;
          groupTexts.push(fmt);
        } else {
          flushGroup();
          const br = opts.newLine ? '<br>' : '';
          html += `${headerHtml}${br}<p>${fmt}</p>`;
        }
        if (whoRaw !== undefined) whoLast = who;
        break;
      }

      case 'TEXT': {
        const whoRaw = str(n.who);
        const who = whoRaw !== undefined ? localizeWho(whoRaw, ctx) : '';
        // Support both 'what' (programmatic nodes) and 'value' (converted JSON)
        const textContent = str(n.what) ?? str(n.value) ?? '';
        const opts = {
          who,
          redFirst: bool(n.redFirst),
          newLine: bool(n.newLine),
          headerLevel: n.header ? 1 : 0,
        };
        const fmt = formatServiceContent(textContent, opts);
        if (who) {
          if (who !== groupWho) flushGroup();
          groupWho = who;
          groupTexts.push(fmt);
        } else {
          flushGroup();
          html += `<p>${fmt}</p>`;
        }
        if (whoRaw !== undefined) whoLast = who;
        break;
      }

      case 'HEADER': {
        flushGroup();
        const value = str(n.value);
        if (value) {
          html += `<h3 class="mt-4 mb-1 font-bold text-center text-red">${value}</h3>\n`;
        }
        break;
      }

      case 'GETID': {
        const whoRaw = str(n.who);
        const who = whoRaw !== undefined ? localizeWho(whoRaw, ctx) : '';
        let text = '';
        let header = '';
        const id = str(n.id);
        const what = str(n.what);
        const nodeType = str(n.type) ?? 'M';
        if (id && what) {
          const lifeId = nodeType === 'T' ? `98${id}` : id;
          const lives = await ctx.fetchLives(lifeId);
          if (lives) {
            const lastSlash = what.lastIndexOf('/');
            const nodePath = what.substring(0, lastSlash);
            const typeKey = what.substring(lastSlash + 1);
            const group = lives[nodePath];
            if (group) {
              const entry = group[typeKey];
              if (entry) {
                text = String(entry.text ?? '');
                header = String(entry.Header ?? '');
              }
            }
          }
        }
        const commandName = str(n.command);
        const commandBName = str(n.commandB);
        const timesVal = num(n.times);
        const [commandText, commandBText, timesText] = await Promise.all([
          commandName ? ctx.fetchCommandText(commandName) : Promise.resolve(''),
          commandBName ? ctx.fetchCommandText(commandBName) : Promise.resolve(''),
          timesVal ? ctx.resolveTimes(timesVal) : Promise.resolve(''),
        ]);
        const opts = {
          who,
          commandText: commandText || undefined,
          commandBText: commandBText || undefined,
          timesText: timesText || undefined,
          redFirst: bool(n.redFirst),
          newLine: bool(n.newLine),
          headerLevel: n.header ? 1 : 0,
        };
        const fmt = formatServiceContent(text, opts);
        const headerHtml = opts.headerLevel && header
          ? `<h2 class="text-center text-red font-bold mt-4">${header}</h2>`
          : '';
        if (who) {
          if (who !== groupWho || headerHtml) flushGroup();
          groupWho = who;
          if (headerHtml) html += headerHtml + '\n';
          groupTexts.push(fmt);
        } else {
          flushGroup();
          const br = opts.newLine ? '<br>' : '';
          html += `${headerHtml}${br}<p>${fmt}</p>`;
        }
        if (whoRaw !== undefined) whoLast = who;
        break;
      }

      case 'BIBLE': {
        const whoRaw = str(n.who);
        const who = whoRaw !== undefined ? localizeWho(whoRaw, ctx) : '';
        const verseNewLine = !who;

        // getreading: display a reading intro header (e.g. "Prophet Isaiah")
        const getreading = str(n.getreading);
        if (getreading && !str(n.verses)) {
          flushGroup();
          const bookName = getReadingName(getreading, ctx.lang);
          const readingHeader = `<p class="italic">${bookName}</p>`;
          html += readingHeader;
          if (whoRaw !== undefined) whoLast = who;
          break;
        }
        const verses = str(n.verses) ?? '';
        const lastUnderscore = verses.lastIndexOf('_');
        const book = lastUnderscore > 0 ? verses.substring(0, lastUnderscore) : verses;
        const passage = lastUnderscore > 0 ? verses.substring(lastUnderscore + 1) : '';

        // Generate header from book+passage when header=true and no twostars
        let header = '';
        if (n.header && !str(n.twostars)) {
          const bookName = getHeaderName(book, ctx.lang);
          header = passage ? `${bookName} ${passage}` : bookName;
        }

        let text = await ctx.fetchBibleText(book, passage, false, verseNewLine);

        // Handle twostars: extract **-delimited instructions as header
        const twostars = str(n.twostars);
        if (twostars === '1' || twostars === '2') {
          const starIdx = text.indexOf('**');
          if (starIdx !== -1) {
            const lastStar = text.lastIndexOf('**');
            if (starIdx !== lastStar) {
              const instruction = text.substring(starIdx + 2, lastStar);
              if (twostars === '1') {
                header = instruction;
              } else if (twostars === '2') {
                // Extract quoted text between ** markers
                const quoteStart = instruction.indexOf('"');
                if (quoteStart !== -1) {
                  const quoteEnd = instruction.indexOf('"', quoteStart + 1);
                  if (quoteEnd !== -1) {
                    header = instruction.substring(quoteStart + 1, quoteEnd).replace(/\.\.\./g, '');
                  }
                }
              }
              // Strip ** markers from text
              text = text.substring(0, starIdx) + text.substring(lastStar + 2);
            }
          }
        }
        // Strip all remaining ** markers
        text = text.replace(/\*\*/g, '');

        const commandName = str(n.command);
        const commandBName = str(n.commandB);
        const timesVal = num(n.times);
        const [commandText, commandBText, timesText] = await Promise.all([
          commandName ? ctx.fetchCommandText(commandName) : Promise.resolve(''),
          commandBName ? ctx.fetchCommandText(commandBName) : Promise.resolve(''),
          timesVal ? ctx.resolveTimes(timesVal) : Promise.resolve(''),
        ]);
        const opts = {
          who,
          commandText: commandText || undefined,
          commandBText: commandBText || undefined,
          timesText: timesText || undefined,
          redFirst: verseNewLine ? false : bool(n.redFirst),
          newLine: bool(n.newLine),
          headerLevel: n.header ? 1 : 0,
        };
        const fmt = formatServiceContent(text, opts);
        const headerHtml = opts.headerLevel && header
          ? `<h2 class="text-center text-red font-bold mt-4">${header}</h2>`
          : '';
        if (who) {
          if (who !== groupWho || headerHtml) flushGroup();
          groupWho = who;
          if (headerHtml) html += headerHtml + '\n';
          groupTexts.push(fmt);
        } else {
          flushGroup();
          if (verseNewLine) {
            const verses = fmt.split('<br>').filter(Boolean);
            const linesHtml = verses.map(v => {
              const redPart = extractFirstLetter(v);
              return redPart ? `<b><span class="text-red">${redPart}</span></b>${v.substring(redPart.length)}` : v;
            }).join('<br>');
            if (headerHtml) html += headerHtml + '\n';
            html += `<p>${linesHtml}</p>`;
          } else {
            const br = opts.newLine ? '<br>' : '';
            html += `${headerHtml}${br}<p>${fmt}</p>`;
          }
        }
        if (whoRaw !== undefined) whoLast = who;
        break;
      }

      case 'TIMES': {
        flushGroup();
        break;
      }

      default: {
        flushGroup();
        // Skip wrapper nodes that aren't real service elements
        if (type === 'SERVICES' || type === 'TONE') break;
        const children = n.children;
        if (Array.isArray(children) && children.length > 0) {
          const subHtml = await assembleService(children, ctx, depth + 1);
          html += subHtml;
        }
        break;
      }
    }
  }

  flushGroup();
  return { html, whoLast };
}

/**
 * Format service text content: redFirst, command rubrics, commandB, times.
 * Returns formatted HTML string (no wrapping in <p>).
 */
function formatServiceContent(text: string, opts: ImplementOptions): string {
  let result = text;

  if (opts.redFirst && result.length > 0) {
    const redPart = extractFirstLetter(result);
    if (redPart) {
      result = `<b><span class="text-red">${redPart}</span></b>${result.substring(redPart.length)}`;
    }
  }

  if (opts.commandText) {
    if (opts.timesText) {
      result += ` <span class="rubric">(${opts.timesText} ${opts.commandText})</span>`;
    } else {
      result += ` <span class="rubric">(${opts.commandText})</span>`;
    }
  } else if (opts.timesText) {
    result += ` <span class="rubric">(${opts.timesText})</span>`;
  }

  if (opts.commandBText) {
    result = `<span class="rubric">${opts.commandBText}</span> ${result}`;
  }

  return result;
}

function extractFirstLetter(text: string): string {
  const combiningMarks = /[\u0300-\u036f\u037a\u0384-\u0385\u0483-\u0489\u1fbd-\u1ffe\u2de0-\u2dff\ua66f-\ua67d]/;
  let result = text[0] || '';
  let i = 1;
  while (i < text.length && combiningMarks.test(text[i])) {
    result += text[i];
    i++;
  }
  return result;
}
