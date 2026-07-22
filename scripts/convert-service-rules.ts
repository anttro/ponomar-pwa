/**
 * Convert ServiceRules.xml to JSON.
 * ServiceRules.xml is shared at languages/xml/Commands/ServiceRules.xml
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

export async function convertServiceRules(SRC: string, OUT: string) {
  console.log('Converting ServiceRules.xml...');

  const filePath = join(SRC, 'languages', 'xml', 'Commands', 'ServiceRules.xml');
  if (!existsSync(filePath)) {
    console.log('  ServiceRules.xml not found, skipping');
    return;
  }

  const data = parser.parse(readFileSync(filePath, 'utf-8'));
  const periods: { cmd: string; rules: Record<string, string>[] }[] = [];

  const root = data['DATA'] || data['SERVICES'];
  if (root) {
    const periodArr = Array.isArray(root['PERIOD']) ? root['PERIOD'] : [root['PERIOD']];

    for (const period of periodArr) {
      if (!period) continue;
      const periodCmd = root['@_Cmd'] || period['@_Cmd'] || '';
      const rules: Record<string, string>[] = [];

      for (const [key, value] of Object.entries(period)) {
        if (key.startsWith('@_')) continue;
        if (typeof value === 'object' && value !== null) {
          const ruleArr = Array.isArray(value) ? value : [value];
          for (const rule of ruleArr) {
            if (typeof rule === 'object' && rule !== null) {
              // Collect all @_-prefixed attributes (flat format)
              const attrs: Record<string, string> = {};
              for (const [rKey, rValue] of Object.entries(rule as Record<string, unknown>)) {
                if (rKey.startsWith('@_') && typeof rValue === 'string') {
                  attrs[rKey.slice(2)] = rValue;
                }
              }
              if (Object.keys(attrs).length > 0) {
                rules.push({ type: key, ...attrs });
              }
            }
          }
        }
      }

      periods.push({
        cmd: periodCmd,
        rules,
      });
    }
  }

  const outDir = join(OUT, 'shared');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'service-rules.json'), JSON.stringify(periods, null, 2));
  console.log(`  ${periods.length} service rule periods`);
}
