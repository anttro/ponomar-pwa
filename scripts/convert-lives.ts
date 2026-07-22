/**
 * Convert saint lives XML to JSON.
 * Lives are per-language: languages/{lang}/xml/lives/
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'fs';
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

function extractAttrs(obj: Record<string, unknown>): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@_')) {
      attrs[k.slice(2)] = v;
    }
  }
  return attrs;
}

function simplifySaintData(data: Record<string, unknown>): Record<string, unknown> | null {
  if (!data) return null;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === '@_attributes') continue;
    if (typeof value !== 'object' || value === null) continue;

    const attrs = (value as Record<string, unknown>)['@_attributes'] as Record<string, string> | undefined;
    const k = key.toUpperCase();

    if (k === 'GRAMMAR') {
      const grammar: Record<string, string> = {};
      for (const [gKey, gValue] of Object.entries(value as Record<string, unknown>)) {
        if (gKey === '@_attributes') continue;
        if (typeof gValue === 'string') grammar[gKey] = gValue;
        else if (typeof gValue === 'object' && gValue !== null) {
          const inner = (gValue as Record<string, unknown>)['#text'];
          if (typeof inner === 'string') grammar[gKey] = inner;
        }
      }
      result.grammar = grammar;
    } else if (k === 'NAME') {
      const nameObj: Record<string, string> = {};
      const nameItems = Array.isArray(value) ? value : [value];
      for (const nameItem of nameItems) {
        if (typeof nameItem === 'object' && nameItem !== null) {
          for (const [nKey, nValue] of Object.entries(nameItem as Record<string, unknown>)) {
            if (nKey === '@_attributes') continue;
            if (typeof nValue === 'string') nameObj[nKey] = nValue;
          }
        }
      }
      result.name = nameObj;
    } else if (k === 'LIFE') {
      const text = (value as Record<string, unknown>)['#text'];
      const lifeAttrs = extractAttrs(value as Record<string, unknown>);
      result.life = {
        id: lifeAttrs.ID as string || '',
        copyright: lifeAttrs.Copyright as string || '',
        text: typeof text === 'string' ? text : '',
      };
    } else if (k === 'RANK') {
      const rankAttrs = extractAttrs(value as Record<string, unknown>);
      result.rank = parseInt(rankAttrs.ID as string || '0', 10);
    } else if (k === 'SERVICE') {
      const services: Record<string, Record<string, Record<string, unknown>>> = {};
      const scriptures: { type?: string; reading?: string; pericope?: string; cmd?: string }[] = [];

      // Extract rank from SERVICE Type attribute (handles both single and array)
      const svcItems = Array.isArray(value) ? value : [value];
      for (const svcItem of svcItems) {
        const svcType = (svcItem as Record<string, unknown>)['@_Type'];
        if (svcType) {
          const t = parseInt(svcType as string, 10);
          if (!isNaN(t) && t > (result.rank || 0)) {
            result.rank = t;
          }
        }
      }
      
      function extractScriptures(obj: Record<string, unknown>): void {
        for (const [sk, sv] of Object.entries(obj)) {
          if (sk === 'SCRIPTURE' && sv) {
            const svArr = Array.isArray(sv) ? sv : [sv];
            for (const item of svArr) {
              if (typeof item === 'object' && item !== null) {
                const attrs = extractAttrs(item as Record<string, unknown>);
                if (Object.keys(attrs).length > 0) {
                  scriptures.push(attrs);
                }
              }
            }
          } else if (typeof sv === 'object' && sv !== null) {
            extractScriptures(sv as Record<string, unknown>);
          }
        }
      }

      // Recursively extract nested service elements into {group/{element/Type}: {attrs+text}}
      function extractServiceGroup(obj: Record<string, unknown>): Record<string, Record<string, unknown>> {
        const group: Record<string, Record<string, unknown>> = {};
        for (const [gk, gv] of Object.entries(obj)) {
          if (gk === '@_attributes' || gk === '#text') continue;
          if (typeof gv !== 'object' || gv === null) continue;
          const gArr = Array.isArray(gv) ? gv : [gv];
          for (const item of gArr) {
            if (typeof item !== 'object' || item === null) continue;
            const attrs = extractAttrs(item as Record<string, unknown>);
            const text = (item as Record<string, unknown>)['#text'];
            const type = attrs.Type as string || '0';
            const key = `${gk}/${type}`;
            group[key] = { text: typeof text === 'string' ? text : '', ...attrs };
          }
        }
        return group;
      }

      for (const [sKey, sValue] of Object.entries(value as Record<string, unknown>)) {
        if (sKey === '@_attributes') continue;
        if (typeof sValue === 'object' && sValue !== null) {
          const sObj = sValue as Record<string, unknown>;
          const sAttrs = sObj['@_attributes'] as Record<string, string> | undefined;
          const sText = sObj['#text'];

          // Check if this element has nested children (e.g., ROYALHOURS contains IDIOMEL, VERSE, etc.)
          const childKeys = Object.keys(sObj).filter(k => k !== '@_attributes' && k !== '#text');
          if (childKeys.length > 0) {
            // Has nested elements — extract recursively
            services[sKey] = extractServiceGroup(sObj);
          } else {
            // Leaf element — store directly
            services[sKey] = { text: typeof sText === 'string' ? sText : '', ...(sAttrs || {}) };
          }
          
          // Extract scriptures from this service (recursively)
          extractScriptures(sValue as Record<string, unknown>);
        }
      }
      if (Object.keys(services).length > 0) result.services = services;
      if (scriptures.length > 0) result.scripture = scriptures;
    } else if (k === 'ICON') {
      const iconAttrs = extractAttrs(value as Record<string, unknown>);
      result.icon = iconAttrs.ID as string || '';
    } else if (k === 'SCRIPTURE') {
      const scriptures: Record<string, unknown>[] = [];
      const scriptureArr = Array.isArray(value) ? value : [value];
      for (const s of scriptureArr) {
        if (typeof s === 'object' && s !== null) {
          const attrs = extractAttrs(s as Record<string, unknown>);
          if (Object.keys(attrs).length > 0) {
            scriptures.push(attrs);
          }
        }
      }
      if (scriptures.length > 0) {
        result.scripture = scriptures;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export async function convertLives(SRC: string, OUT: string) {
  console.log('Converting saint lives...');

  const LANG_CONFIGS = [
    { id: 'en', prefix: 'en' },
    { id: 'cu', prefix: 'cu' },
    { id: 'ru', prefix: 'cu/ru' },
    { id: 'el', prefix: 'el' },
    { id: 'el/mono', prefix: 'el/mono' },
    { id: 'fr', prefix: 'fr' },
    { id: 'zh/Hans', prefix: 'zh/Hans' },
    { id: 'zh/Hant', prefix: 'zh/Hant' },
    { id: 'shared', prefix: '' },
  ];

  for (const { id, prefix } of LANG_CONFIGS) {
    const livesDir = join(SRC, 'languages', prefix, 'xml', 'lives');
    if (!existsSync(livesDir)) continue;

    const outDir = join(OUT, id, 'lives');
    mkdirSync(outDir, { recursive: true });
    // Clean old individual files from previous conversions
    for (const oldFile of readdirSync(outDir).filter(f => f.endsWith('.json'))) {
      rmSync(join(outDir, oldFile), { force: true });
    }

    let count = 0;
    const files = readdirSync(livesDir).filter(f => f.endsWith('.xml'));
    const bundles: Record<string, Record<string, Record<string, unknown>>> = {};

    for (const file of files) {
      const data = parseFile(join(livesDir, file));
      if (!data) continue;

      let saintData: Record<string, unknown> | null = null;
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && key !== '@_attributes') {
          saintData = simplifySaintData(value as Record<string, unknown>);
          break;
        }
      }

      if (saintData) {
        const cid = file.replace('.xml', '');
        const mm = cid.match(/^(0[1-9]|1[0-2])\d+/)?.[1];
        const bundleName = mm ? `${mm}.json` : 'misc.json';
        if (!bundles[bundleName]) bundles[bundleName] = {};
        bundles[bundleName][cid] = saintData;
        count++;
      }
    }

    // Write bundles
    for (const [bundleName, bundle] of Object.entries(bundles)) {
      writeFileSync(join(outDir, bundleName), JSON.stringify(bundle));
    }

    console.log(`  ${id}: ${count} saint lives in ${Object.keys(bundles).length} bundles`);
  }

  // Build shared lives index (CId → scripture for fast lookup)
  const sharedOut = join(OUT, 'shared', 'lives');
  const index: Record<string, unknown[]> = {};
  if (existsSync(sharedOut)) {
    const files = readdirSync(sharedOut).filter(f => f.endsWith('.json'));
    for (const f of files) {
      if (f === 'lives-index.json') continue;
      try {
        const bundle = JSON.parse(readFileSync(join(sharedOut, f), 'utf-8'));
        for (const [cid, data] of Object.entries(bundle as Record<string, Record<string, unknown>>)) {
          if (data.scripture) {
            index[cid] = data.scripture;
          }
        }
      } catch {}
    }
  }
  writeFileSync(join(sharedOut, '..', 'lives-index.json'), JSON.stringify(index));
  console.log(`  lives-index: ${Object.keys(index).length} entries`);
}
