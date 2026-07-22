/**
 * Convert command XML files to JSON.
 * Handles both per-language (en/xml/Commands/, cu/xml/Commands/)
 * and shared (xml/Commands/).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

function convertCmdDir(srcDir: string, outDir: string): number {
  if (!existsSync(srcDir)) return 0;
  mkdirSync(outDir, { recursive: true });
  const files = readdirSync(srcDir).filter(f => f.endsWith('.xml'));
  for (const file of files) {
    const data = parser.parse(readFileSync(join(srcDir, file), 'utf-8'));
    const outName = file.replace('.xml', '.json');
    writeFileSync(join(outDir, outName), JSON.stringify(data, null, 2));
  }
  return files.length;
}

export async function convertCommands(SRC: string, OUT: string) {
  console.log('Converting command files...');

  // Shared commands (Fasting.xml, ServiceRules.xml, DivineLiturgy.xml, ScriptureTransfers.xml)
  const sharedCmdDir = join(SRC, 'languages', 'xml', 'Commands');
  const sharedOut = join(OUT, 'shared', 'commands');
  const sharedCount = convertCmdDir(sharedCmdDir, sharedOut);
  console.log(`  shared: ${sharedCount} command files`);

  // Per-language commands (Times.xml, Podobni.xml, LanguagePacks.xml, etc.)
  const CMD_SOURCES = [
    { id: 'en', prefix: 'en' },
    { id: 'cu', prefix: 'cu' },
    { id: 'ru', prefix: 'cu/ru' },
    { id: 'el', prefix: 'el' },
    { id: 'el/mono', prefix: 'el/mono' },
    { id: 'fr', prefix: 'fr' },
    { id: 'zh/Hans', prefix: 'zh/Hans' },
    { id: 'zh/Hant', prefix: 'zh/Hant' },
    { id: 'zh', prefix: 'zh' },
  ];

  for (const { id, prefix } of CMD_SOURCES) {
    const cmdDir = join(SRC, 'languages', prefix, 'xml', 'Commands');
    const outDir = join(OUT, id, 'commands');
    const count = convertCmdDir(cmdDir, outDir);
    if (count > 0) console.log(`  ${id}: ${count} command files`);
  }
}
