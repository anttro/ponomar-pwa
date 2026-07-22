/**
 * Convert calendar XML data (triodion, pentecostarion, menaion, commemorations) to JSON.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

function parseFile(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  const xml = readFileSync(path, 'utf-8');
  try {
    return parser.parse(xml);
  } catch {
    return null;
  }
}

function extractDayData(data: Record<string, unknown> | null): unknown[] {
  if (!data) return [];
  const result: unknown[] = [];

  // Handle <DAY><SAINT .../></DAY> structure (menaion per-language files)
  if (data['DAY']) {
    const day = data['DAY'];
    if (typeof day === 'object' && day !== null) {
      const saints = day['SAINT'];
      if (saints) {
        const saintArr = Array.isArray(saints) ? saints : [saints];
        for (const saint of saintArr) {
          if (typeof saint === 'object' && saint !== null) {
            // fast-xml-parser puts attributes at top level with @_ prefix
            const sId = saint['@_SId'] || saint['@_SID'] || '';
            const cId = saint['@_CId'] || saint['@_CID'] || '';
            if (cId) {
              result.push({ SId: sId, CId: cId });
            }
          }
        }
      }
    }
  }

  // Handle <LANGUAGE>...</LANGUAGE> structure (triodion/pentecostarion shared files)
  if (data['LANGUAGE']) {
    const lang = data['LANGUAGE'];
    if (typeof lang === 'object' && lang !== null) {
      for (const [key, value] of Object.entries(lang as Record<string, unknown>)) {
        if (key === '@_attributes') continue;
        if (typeof value === 'object' && value !== null) {
          const attrs = (value as Record<string, unknown>)['@_attributes'] as Record<string, string> | undefined;
          if (attrs && Object.keys(attrs).length > 0) {
            result.push(attrs);
          }
        }
      }
    }
  }

  return result;
}

function convertCommemorationFile(data: Record<string, unknown>): Record<string, unknown> | null {
  if (!data) return null;
  const comm = data['COMMEMORATION'];
  if (!comm || typeof comm !== 'object') return null;
  const result: Record<string, unknown> = {};

  function extractAttrs(obj: Record<string, unknown>): Record<string, unknown> {
    const attrs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('@_')) {
        attrs[k.slice(2)] = v; // strip @_ prefix
      }
    }
    return attrs;
  }

  function processElement(obj: Record<string, unknown>): Record<string, unknown> {
    const attrs = extractAttrs(obj);
    const text = obj['#text'];
    const out = { ...attrs };
    if (typeof text === 'string' && text.trim()) {
      out.text = text.trim();
    }
    return out;
  }

  for (const [key, value] of Object.entries(comm as Record<string, unknown>)) {
    if (key.startsWith('@_')) continue; // skip root attributes
    if (typeof value !== 'object' || value === null) continue;

    if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'object' && item !== null ? processElement(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object') {
      result[key] = processElement(value as Record<string, unknown>);
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export async function convertCalendar(SRC: string, OUT: string) {
  console.log('Converting calendar data...');

  // --- Triodion (shared, language-agnostic) ---
  const triodionDir = join(SRC, 'languages', 'xml', 'triodion');
  if (existsSync(triodionDir)) {
    const outDir = join(OUT, 'shared', 'triodion');
    mkdirSync(outDir, { recursive: true });
    const files = readdirSync(triodionDir).filter(f => f.endsWith('.xml')).sort();
    for (const file of files) {
      const data = parseFile(join(triodionDir, file));
      const dayData = extractDayData(data);
      writeFileSync(join(outDir, file.replace('.xml', '.json')), JSON.stringify(dayData));
    }
    console.log(`  triodion: ${files.length} files`);
  }

  // --- Pentecostarion (shared, language-agnostic) ---
  const pentecostarionDir = join(SRC, 'languages', 'xml', 'pentecostarion');
  if (existsSync(pentecostarionDir)) {
    const outDir = join(OUT, 'shared', 'pentecostarion');
    mkdirSync(outDir, { recursive: true });
    const files = readdirSync(pentecostarionDir).filter(f => f.endsWith('.xml')).sort();
    for (const file of files) {
      const data = parseFile(join(pentecostarionDir, file));
      const dayData = extractDayData(data);
      writeFileSync(join(outDir, file.replace('.xml', '.json')), JSON.stringify(dayData));
    }
    console.log(`  pentecostarion: ${files.length} files`);
  }

  // --- Commemorations (shared, indexed by CId) ---
  const commBase = join(SRC, 'languages', 'xml', 'Commemorations');
  if (existsSync(commBase)) {
    const outDir = join(OUT, 'shared', 'commemorations');
    mkdirSync(outDir, { recursive: true });
    let count = 0;
    const subdirs = readdirSync(commBase);
    for (const sub of subdirs) {
      const subDir = join(commBase, sub);
      if (!existsSync(subDir)) continue;
      const files = readdirSync(subDir).filter(f => f.endsWith('.xml'));
      for (const file of files) {
        const data = parseFile(join(subDir, file));
        const commData = convertCommemorationFile(data);
        if (commData) {
          const cid = file.replace('.xml', '');
          writeFileSync(join(outDir, `${cid}.json`), JSON.stringify(commData));
          count++;
        }
      }
    }
    console.log(`  commemorations: ${count} files`);
  }

  // --- Menaion (per-language monthly day files) ---
  const MENAION_SOURCES = [
    { id: 'en', prefix: 'en' },
    { id: 'cu', prefix: 'cu' },
    { id: 'el', prefix: 'el' },
    { id: 'fr', prefix: 'fr' },
    { id: 'zh', prefix: 'zh' },
  ];

  for (const { id, prefix } of MENAION_SOURCES) {
    const xmlDir = join(SRC, 'languages', prefix, 'xml');
    if (!existsSync(xmlDir)) continue;

    const outDir = join(OUT, id, 'menaion');
    mkdirSync(outDir, { recursive: true });

    let count = 0;
    const months = readdirSync(xmlDir).filter(f => /^\d{2}$/.test(f));
    for (const month of months) {
      const monthDir = join(xmlDir, month);
      if (!existsSync(monthDir)) continue;
      const days = readdirSync(monthDir).filter(f => f.endsWith('.xml'));
      for (const day of days) {
        const data = parseFile(join(monthDir, day));
        const dayData = extractDayData(data);
        if (dayData) {
          const mm = month;
          const dd = day.replace('.xml', '');
          writeFileSync(join(outDir, `${mm}-${dd}.json`), JSON.stringify(dayData));
          count++;
        }
      }
    }
    console.log(`  ${id}: ${count} menaion day files`);

    // Build menaion bundle (all days in one file for fast loading)
    if (count > 0) {
      const bundle: Record<string, unknown> = {};
      const files = readdirSync(outDir).filter(f => f.endsWith('.json'));
      for (const f of files) {
        try {
          bundle[f.replace('.json', '')] = JSON.parse(readFileSync(join(outDir, f), 'utf-8'));
        } catch {}
      }
      writeFileSync(join(outDir, '..', 'menaion-bundle.json'), JSON.stringify(bundle));
    }
  }
}
