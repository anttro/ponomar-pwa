/**
 * Convert Fasting.xml to JSON.
 * Fasting.xml is shared at languages/xml/Commands/Fasting.xml
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

export async function convertFasting(SRC: string, OUT: string) {
  console.log('Converting Fasting.xml...');

  const filePath = join(SRC, 'languages', 'xml', 'Commands', 'Fasting.xml');
  if (!existsSync(filePath)) {
    console.log('  Fasting.xml not found, skipping');
    return;
  }

  const data = parser.parse(readFileSync(filePath, 'utf-8'));
  const periods: { cmd: string; rules: { case: string; cmd: string }[] }[] = [];

  if (data['FASTING']) {
    const fasting = data['FASTING'];
    const periodArr = Array.isArray(fasting['PERIOD']) ? fasting['PERIOD'] : [fasting['PERIOD']];

    for (const period of periodArr) {
      if (!period) continue;
      const periodCmd = period['@_Cmd'] || '';
      const rules: { case: string; cmd: string }[] = [];

      if (period['RULE']) {
        const ruleArr = Array.isArray(period['RULE']) ? period['RULE'] : [period['RULE']];
        for (const rule of ruleArr) {
          if (!rule) continue;
          rules.push({
            case: rule['@_Case'] || '1111111',
            cmd: rule['@_Cmd'] || '',
          });
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
  writeFileSync(join(outDir, 'fasting.json'), JSON.stringify(periods, null, 2));
  console.log(`  ${periods.length} fasting periods`);
}
