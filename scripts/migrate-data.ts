/**
 * One-time migration script to normalize data to new format.
 * Run with: npx tsx scripts/migrate-data.ts [--dry-run]
 *
 * Operations:
 * 1. Strip @_ prefixes from lives name keys (all languages)
 * 2. Remove SId from menaion entries (keep id = CId) (all languages)
 * 3. Rename service directories to lowercase (cu, el, fr, zh, zh/Hans, zh/Hant, ru)
 * 4. Flatten Octoecheos structure (cu, fr, zh/Hans, zh/Hant)
 * 5. TEXT->text in command files (cu, fr, zh, zh/Hans, zh/Hant)
 * 6. Move shared services into templates/ subdirectory
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync, cpSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const DATA_DIR = join(__dirname, '..', 'static', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationStats {
  livesProcessed: number;
  livesStripped: number;
  menaionProcessed: number;
  menaionStripped: number;
  dirsRenamed: number;
  octoecheosFlattened: number;
  commandsMigrated: number;
  sharedServicesMoved: number;
  menaionBundlesMigrated: number;
  nameKeysFixed: number;
  calendarMergedMigrated: number;
}

const stats: MigrationStats = {
  livesProcessed: 0,
  livesStripped: 0,
  menaionProcessed: 0,
  menaionStripped: 0,
  dirsRenamed: 0,
  octoecheosFlattened: 0,
  commandsMigrated: 0,
  sharedServicesMoved: 0,
  menaionBundlesMigrated: 0,
  nameKeysFixed: 0,
  calendarMergedMigrated: 0,
};

function log(message: string): void {
  if (!DRY_RUN) {
    console.log(message);
  } else {
    console.log(`[DRY] ${message}`);
  }
}

function writeFile(path: string, data: unknown): void {
  if (!DRY_RUN) {
    writeFileSync(path, JSON.stringify(data, null, 2));
  }
}

function renameDir(oldPath: string, newPath: string): void {
  if (!DRY_RUN) {
    if (existsSync(newPath)) {
      rmSync(newPath, { recursive: true });
    }
    renameSync(oldPath, newPath);
  }
}

/**
 * Strip @_ prefixes from an object's keys (recursive)
 */
function stripAtPrefix(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = key.startsWith('@_') ? key.slice(2) : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[newKey] = stripAtPrefix(value as Record<string, unknown>);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Migrate lives bundle - strip @_ prefixes from name keys
 */
function migrateLivesBundle(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  let changed = false;

  for (const [cid, entry] of Object.entries(data)) {
    if (typeof entry !== 'object' || entry === null) continue;
    stats.livesProcessed++;

    const life = entry as Record<string, unknown>;
    if (life.name && typeof life.name === 'object') {
      const name = life.name as Record<string, unknown>;
      const hasAtPrefix = Object.keys(name).some(k => k.startsWith('@_'));

      if (hasAtPrefix) {
        life.name = stripAtPrefix(name);
        changed = true;
        stats.livesStripped++;
      }
    }
  }

  if (changed) {
    log(`  Migrated: ${filePath}`);
    writeFile(filePath, data);
  }
}

/**
 * Migrate menaion - remove SId, keep only id = CId
 */
function migrateMenaionFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (!Array.isArray(data)) return;

  let changed = false;
  const migrated = data.map((entry: Record<string, unknown>) => {
    if (entry.SId !== undefined) {
      changed = true;
      stats.menaionStripped++;
      return { id: entry.CId || entry.id };
    }
    return entry;
  });

  if (changed) {
    log(`  Migrated: ${filePath}`);
    writeFile(filePath, migrated);
  }
  stats.menaionProcessed++;
}

/**
 * Flatten Octoecheos structure: "Tone N/Day.json" -> "toneN/day.json"
 */
function flattenOctoecheos(langDir: string): void {
  const servicesDir = join(langDir, 'services');
  // Look for PascalCase "Octoecheos" directory
  const octoDir = join(servicesDir, 'Octoecheos');
  if (!existsSync(octoDir)) return;

  for (const toneDir of readdirSync(octoDir)) {
    if (!toneDir.startsWith('Tone ')) continue;

    const toneNum = toneDir.replace('Tone ', '');
    const srcPath = join(octoDir, toneDir);
    const dstPath = join(octoDir, `tone${toneNum}`);

    if (!statSync(srcPath).isDirectory()) continue;

    mkdirSync(dstPath, { recursive: true });

    for (const file of readdirSync(srcPath)) {
      if (!file.endsWith('.json')) continue;

      const dayName = file.replace('.json', '').toLowerCase();
      const srcFile = join(srcPath, file);
      const dstFile = join(dstPath, `${dayName}.json`);

      log(`  Flattened: ${toneDir}/${file} -> tone${toneNum}/${dayName}.json`);
      if (!DRY_RUN) {
        cpSync(srcFile, dstFile);
      }
      stats.octoecheosFlattened++;
    }

    // Remove old PascalCase directory
    if (!DRY_RUN) {
      rmSync(srcPath, { recursive: true });
    }
  }
}

/**
 * Rename PascalCase service directories to lowercase
 */
function renameServiceDirs(langDir: string): void {
  const servicesDir = join(langDir, 'services');
  if (!existsSync(servicesDir)) return;

  const renames: Record<string, string> = {
    'CommonPrayers': 'prayers',
    'Text': 'texts',
    'Command': 'commands',
    'Header': 'headers',
    'Var': 'var',
    'Octoecheos': 'octoecheos',
  };

  for (const [oldName, newName] of Object.entries(renames)) {
    const oldPath = join(servicesDir, oldName);
    const newPath = join(servicesDir, newName);

    if (existsSync(oldPath)) {
      log(`  Renamed: ${oldName} -> ${newName}`);
      renameDir(oldPath, newPath);
      stats.dirsRenamed++;
    }
  }
}

/**
 * Migrate command files: TEXT -> text type
 * Checks both PascalCase (Command/) and lowercase (commands/) directories
 */
function migrateCommands(langDir: string): void {
  // Check both old (Command/) and new (commands/) directory names
  const commandsDirs = [
    join(langDir, 'services', 'Command'),
    join(langDir, 'services', 'commands'),
  ];

  for (const commandsDir of commandsDirs) {
    if (!existsSync(commandsDir)) continue;

    for (const file of readdirSync(commandsDir)) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(commandsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!Array.isArray(data)) continue;

      let changed = false;
      const migrated = data.map((node: Record<string, unknown>) => {
        if (node.type === 'TEXT') {
          changed = true;
          return { ...node, type: 'text' };
        }
        return node;
      });

      if (changed) {
        log(`  Migrated command: ${file}`);
        writeFile(filePath, migrated);
        stats.commandsMigrated++;
      }
    }
  }
}

/**
 * Move shared services files into templates/ subdirectory
 */
function moveSharedServices(): void {
  const servicesDir = join(DATA_DIR, 'shared', 'services');
  if (!existsSync(servicesDir)) return;

  const templatesDir = join(servicesDir, 'templates');
  mkdirSync(templatesDir, { recursive: true });

  // Move all JSON files from services root to templates/
  let moved = 0;
  for (const file of readdirSync(servicesDir)) {
    if (!file.endsWith('.json')) continue;

    const srcFile = join(servicesDir, file);
    const dstFile = join(templatesDir, file);

    log(`  Moved: ${file} -> templates/${file}`);
    if (!DRY_RUN) {
      cpSync(srcFile, dstFile);
      rmSync(srcFile);
    }
    moved++;
  }

  if (moved === 0) {
    log('  Shared services already in templates/, skipping');
  }
  stats.sharedServicesMoved = moved;
}

/**
 * Process all lives directories for a language
 */
function processLives(langDir: string): void {
  const livesDir = join(langDir, 'lives');
  if (!existsSync(livesDir)) return;

  for (const file of readdirSync(livesDir)) {
    if (file.endsWith('.json')) {
      migrateLivesBundle(join(livesDir, file));
    }
  }
}

/**
 * Process all menaion files for a language
 */
function processMenaion(langDir: string): void {
  const menaionDir = join(langDir, 'menaion');
  if (!existsSync(menaionDir)) return;

  for (const file of readdirSync(menaionDir)) {
    if (file.endsWith('.json')) {
      migrateMenaionFile(join(menaionDir, file));
    }
  }
}

/**
 * Migrate menaion bundle file: {dateKey: [{SId, CId}, ...]} -> {dateKey: [{id}, ...]}
 */
function migrateMenaionBundle(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  let changed = false;

  for (const [dateKey, entries] of Object.entries(data)) {
    if (!Array.isArray(entries)) continue;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i] as Record<string, unknown>;
      if (entry.SId !== undefined) {
        changed = true;
        entries[i] = { id: entry.CId || entry.id };
        stats.menaionBundlesMigrated++;
      }
    }
  }

  if (changed) {
    log(`  Migrated: ${filePath}`);
    writeFile(filePath, data);
  }
}

/**
 * Fix name key casing: Nominative -> nominative, Short -> short, ShortF -> shortF
 */
function fixNameKeyCase(langDir: string): void {
  const livesDir = join(langDir, 'lives');
  if (!existsSync(livesDir)) return;

  for (const file of readdirSync(livesDir)) {
    if (!file.endsWith('.json')) continue;

    const filePath = join(livesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    let changed = false;

    for (const entry of Object.values(data)) {
      if (typeof entry !== 'object' || entry === null) continue;
      const life = entry as Record<string, unknown>;
      if (life.name && typeof life.name === 'object') {
        const name = life.name as Record<string, unknown>;
        const fixed: Record<string, unknown> = {};
        let entryChanged = false;
        for (const [key, value] of Object.entries(name)) {
          const newKey = key.length > 0 ? key.charAt(0).toLowerCase() + key.slice(1) : key;
          fixed[newKey] = value;
          if (newKey !== key) entryChanged = true;
        }
        if (entryChanged) {
          life.name = fixed;
          changed = true;
          stats.nameKeysFixed++;
        }
      }
    }

    if (changed) {
      log(`  Fixed name keys: ${filePath}`);
      writeFile(filePath, data);
    }
  }
}

/**
 * Migrate merged calendar files (triodion.json, pentecostarion.json) - SId/CId -> id
 */
function migrateCalendarMerged(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  let changed = false;

  for (const [key, entry] of Object.entries(data)) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (e.SId !== undefined) {
      changed = true;
      data[key] = { id: e.CId || e.id };
      stats.calendarMergedMigrated++;
    }
  }

  if (changed) {
    log(`  Migrated: ${filePath}`);
    writeFile(filePath, data);
  }
}

interface LangConfig {
  name: string;
  path: string;
}

function main(): void {
  console.log(`\n${DRY_RUN ? 'DRY RUN - No changes will be made' : 'MIGRATING DATA'}\n`);
  console.log(`Data directory: ${DATA_DIR}\n`);

  // All language directories to process (including sub-languages)
  const langs: LangConfig[] = [
    { name: 'en', path: join(DATA_DIR, 'en') },
    { name: 'cu', path: join(DATA_DIR, 'cu') },
    { name: 'el', path: join(DATA_DIR, 'el') },
    { name: 'fr', path: join(DATA_DIR, 'fr') },
    { name: 'zh', path: join(DATA_DIR, 'zh') },
    { name: 'ru', path: join(DATA_DIR, 'ru') },
    { name: 'zh/Hans', path: join(DATA_DIR, 'zh', 'Hans') },
    { name: 'zh/Hant', path: join(DATA_DIR, 'zh', 'Hant') },
    { name: 'el/mono', path: join(DATA_DIR, 'el', 'mono') },
  ];

  // Step 1: Strip @_ from lives (all languages)
  console.log('1. Stripping @_ from lives name keys...');
  for (const lang of langs) {
    if (existsSync(lang.path)) {
      processLives(lang.path);
    }
  }

  // Step 2: Remove SId from menaion (all languages with menaion)
  console.log('\n2. Removing SId from menaion entries...');
  for (const lang of langs) {
    if (existsSync(lang.path)) {
      processMenaion(lang.path);
    }
  }

  // Step 3: Flatten Octoecheos (cu, fr, zh/Hans, zh/Hant)
  console.log('\n3. Flattening Octoecheos directories...');
  const octoLangs = ['cu', 'fr', 'zh/Hans', 'zh/Hant'];
  for (const lang of octoLangs) {
    const langDir = join(DATA_DIR, lang);
    if (existsSync(langDir)) {
      flattenOctoecheos(langDir);
    }
  }

  // Step 4: Rename service directories to lowercase
  console.log('\n4. Renaming service directories to lowercase...');
  const renameLangs = ['cu', 'el', 'fr', 'zh', 'zh/Hans', 'zh/Hant', 'ru'];
  for (const lang of renameLangs) {
    const langDir = join(DATA_DIR, lang);
    if (existsSync(langDir)) {
      renameServiceDirs(langDir);
    }
  }

  // Step 5: Migrate commands TEXT -> text
  console.log('\n5. Migrating commands TEXT -> text...');
  const cmdLangs = ['cu', 'fr', 'zh', 'zh/Hans', 'zh/Hant'];
  for (const lang of cmdLangs) {
    const langDir = join(DATA_DIR, lang);
    if (existsSync(langDir)) {
      migrateCommands(langDir);
    }
  }

  // Step 6: Move shared services into templates/
  console.log('\n6. Moving shared services into templates/...');
  moveSharedServices();

  // Step 7: Migrate menaion bundle files (both menaion-bundle.json and {lang}-menaion-bundle.json)
  console.log('\n7. Migrating menaion bundle files...');
  const bundleLangs = ['en', 'cu', 'el', 'fr', 'zh'];
  for (const lang of bundleLangs) {
    const langDir = join(DATA_DIR, lang);
    if (!existsSync(langDir)) continue;
    for (const name of ['menaion-bundle.json', `${lang}-menaion-bundle.json`]) {
      const fp = join(langDir, name);
      if (existsSync(fp)) migrateMenaionBundle(fp);
    }
  }

  // Step 8: Fix name key casing in lives files (Nominative -> nominative)
  console.log('\n8. Fixing name key casing in lives files...');
  for (const lang of langs) {
    if (existsSync(lang.path)) {
      fixNameKeyCase(lang.path);
    }
  }

  // Step 9: Migrate merged calendar files (triodion.json, pentecostarion.json)
  console.log('\n9. Migrating merged calendar files...');
  const calendarDir = join(DATA_DIR, 'shared', 'calendar');
  for (const name of ['triodion.json', 'pentecostarion.json']) {
    migrateCalendarMerged(join(calendarDir, name));
  }

  // Summary
  console.log('\n\nMIGRATION SUMMARY');
  console.log('=================');
  console.log(`Lives processed: ${stats.livesProcessed}`);
  console.log(`Lives with @_ stripped: ${stats.livesStripped}`);
  console.log(`Menaion entries processed: ${stats.menaionProcessed}`);
  console.log(`Menaion entries stripped: ${stats.menaionStripped}`);
  console.log(`Octoecheos files flattened: ${stats.octoecheosFlattened}`);
  console.log(`Service dirs renamed: ${stats.dirsRenamed}`);
  console.log(`Commands migrated: ${stats.commandsMigrated}`);
  console.log(`Shared services moved: ${stats.sharedServicesMoved}`);
  console.log(`Menaion bundles migrated: ${stats.menaionBundlesMigrated}`);
  console.log(`Name keys fixed: ${stats.nameKeysFixed}`);
  console.log(`Calendar merged migrated: ${stats.calendarMergedMigrated}`);
}

main();
