/**
 * Validate data files against JSON schemas.
 * Run with: npx tsx scripts/validate-data.ts [path]
 * If no path given, validates all data in static/data/
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;
const DATA_DIR = join(__dirname, '..', 'static', 'data');

interface ValidationError {
  file: string;
  path: string;
  message: string;
}

class Validator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private filesChecked = 0;

  constructor(private basePath: string) {}

  validateFile(filePath: string, type: string): void {
    const relPath = relative(this.basePath, filePath);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      switch (type) {
        case 'life':
          this.validateLife(data, relPath);
          break;
        case 'lives-bundle':
          this.validateLivesBundle(data, relPath);
          break;
        case 'calendar':
          this.validateCalendar(data, relPath);
          break;
        case 'service-template':
          this.validateServiceTemplate(data, relPath);
          break;
        case 'prayer':
          this.validatePrayer(data, relPath);
          break;
        case 'command':
          this.validateCommand(data, relPath);
          break;
        case 'commemoration':
          this.validateCommemoration(data, relPath);
          break;
        case 'fasting':
          this.validateFasting(data, relPath);
          break;
      }
      this.filesChecked++;
    } catch (e) {
      this.addError(relPath, '', `Failed to parse: ${(e as Error).message}`);
    }
  }

  validateDir(dirPath: string, type: string): void {
    if (!existsSync(dirPath)) return;
    for (const entry of readdirSync(dirPath)) {
      const fullPath = join(dirPath, entry);
      if (entry.endsWith('.json')) {
        this.validateFile(fullPath, type);
      } else if (statSync(fullPath).isDirectory()) {
        this.validateDir(fullPath, type);
      }
    }
  }

  validateLife(data: unknown, path: string): void {
    if (typeof data !== 'object' || data === null) {
      this.addError(path, '', 'Life entry must be an object');
      return;
    }
    const obj = data as Record<string, unknown>;

    if (!obj.name || typeof obj.name !== 'object') {
      this.addError(path, 'name', 'Missing or invalid name');
    } else {
      const name = obj.name as Record<string, unknown>;
      if (!name.nominative || typeof name.nominative !== 'string') {
        this.addError(path, 'name.nominative', 'Missing nominative');
      }
    }

    if (obj.rank !== undefined && (typeof obj.rank !== 'number' || obj.rank < 0 || obj.rank > 8)) {
      this.addWarning(path, 'rank', 'Rank should be 0-8');
    }
  }

  validateLivesBundle(data: unknown, path: string): void {
    if (typeof data !== 'object' || data === null) {
      this.addError(path, '', 'Lives bundle must be an object');
      return;
    }
    for (const [cid, entry] of Object.entries(data as Record<string, unknown>)) {
      this.validateLife(entry, `${path}[${cid}]`);
    }
  }

  validateCalendar(data: unknown, path: string): void {
    if (typeof data !== 'object' || data === null) {
      this.addError(path, '', 'Calendar data must be an object');
      return;
    }
    for (const [key, entry] of Object.entries(data as Record<string, unknown>)) {
      if (typeof entry !== 'object' || entry === null) {
        this.addError(path, `[${key}]`, 'Entry must be an object');
        continue;
      }
      const obj = entry as Record<string, unknown>;
      if (!obj.id || typeof obj.id !== 'string') {
        this.addError(path, `[${key}].id`, 'Missing or invalid id');
      }
    }
  }

  validateServiceTemplate(data: unknown, path: string): void {
    if (!Array.isArray(data)) {
      this.addError(path, '', 'Service template must be an array');
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      if (typeof node !== 'object' || node === null) {
        this.addError(path, `[${i}]`, 'Node must be an object');
        continue;
      }
      const obj = node as Record<string, unknown>;
      if (!obj.type || typeof obj.type !== 'string') {
        this.addError(path, `[${i}].type`, 'Missing or invalid type');
      }
    }
  }

  validatePrayer(data: unknown, path: string): void {
    if (!Array.isArray(data)) {
      this.addError(path, '', 'Prayer must be an array');
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      if (typeof node !== 'object' || node === null) {
        this.addError(path, `[${i}]`, 'Node must be an object');
        continue;
      }
      const obj = node as Record<string, unknown>;
      if (!obj.type || !['TEXT', 'HEADER', 'TROPARION', 'KONTAKION'].includes(obj.type as string)) {
        this.addError(path, `[${i}].type`, 'Type must be TEXT or HEADER');
      }
    }
  }

  validateCommand(data: unknown, path: string): void {
    if (!Array.isArray(data)) {
      this.addError(path, '', 'Command must be an array');
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const node = data[i];
      if (typeof node !== 'object' || node === null) {
        this.addError(path, `[${i}]`, 'Node must be an object');
        continue;
      }
      const obj = node as Record<string, unknown>;
      if (!obj.type || !['TEXT', 'text'].includes(obj.type as string)) {
        this.addError(path, `[${i}].type`, 'Type must be TEXT or text');
      }
    }
  }

  validateCommemoration(data: unknown, path: string): void {
    if (typeof data !== 'object' || data === null) {
      this.addError(path, '', 'Commemoration must be an object');
      return;
    }
  }

  validateFasting(data: unknown, path: string): void {
    if (!Array.isArray(data)) {
      this.addError(path, '', 'Fasting rules must be an array');
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const period = data[i];
      if (typeof period !== 'object' || period === null) {
        this.addError(path, `[${i}]`, 'Period must be an object');
        continue;
      }
      const obj = period as Record<string, unknown>;
      if (typeof obj.cmd !== 'string') {
        this.addError(path, `[${i}].cmd`, 'Missing cmd');
      }
      if (!Array.isArray(obj.rules)) {
        this.addError(path, `[${i}].rules`, 'Missing rules array');
      }
    }
  }

  addError(file: string, path: string, message: string): void {
    this.errors.push({ file, path, message });
  }

  addWarning(file: string, path: string, message: string): void {
    this.warnings.push({ file, path, message });
  }

  printReport(): void {
    console.log(`\nValidated ${this.filesChecked} files.\n`);

    if (this.errors.length > 0) {
      console.log(`ERRORS (${this.errors.length}):`);
      for (const err of this.errors) {
        console.log(`  ${err.file}${err.path ? ':' + err.path : ''} - ${err.message}`);
      }
    }

    if (this.warnings.length > 0) {
      console.log(`\nWARNINGS (${this.warnings.length}):`);
      for (const warn of this.warnings) {
        console.log(`  ${warn.file}${warn.path ? ':' + warn.path : ''} - ${warn.message}`);
      }
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('All files valid!');
    }

    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

function main() {
  const targetPath = process.argv[2] || DATA_DIR;
  const validator = new Validator(DATA_DIR);

  console.log(`Validating data in: ${targetPath}\n`);

  // Validate shared data
  const sharedDir = join(DATA_DIR, 'shared');
  if (existsSync(sharedDir)) {
    console.log('Validating shared data...');
    // NOTE: shared/lives contains calendar scripture-reading entries (date-keyed),
    // not saint biographies with name.nominative, so it is NOT validated as lives-bundle.
    validator.validateDir(join(sharedDir, 'commemorations'), 'commemoration');
    validator.validateFile(join(sharedDir, 'fasting.json'), 'fasting');
  }

  // Validate language data (start with en)
  const enDir = join(DATA_DIR, 'en');
  if (existsSync(enDir)) {
    console.log('Validating English data...');
    validator.validateDir(join(enDir, 'lives'), 'lives-bundle');
    validator.validateDir(join(enDir, 'services', 'templates'), 'service-template');
    validator.validateDir(join(enDir, 'services', 'prayers'), 'prayer');
    validator.validateDir(join(enDir, 'services', 'commands'), 'command');
  }

  validator.printReport();
}

main();
