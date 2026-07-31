/**
 * Search across all liturgical texts.
 * Run with: npx tsx scripts/tools/search-texts.ts <query> [--lang en] [--type prayers]
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', '..', 'static', 'data');

interface SearchResult {
  file: string;
  matches: { line: number; text: string }[];
}

function searchFile(filePath: string, query: string, relPath: string): SearchResult | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const matches: { line: number; text: string }[] = [];
    const lines = content.split('\n');
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        matches.push({ line: i + 1, text: lines[i].substring(0, 100) });
      }
    }

    return matches.length > 0 ? { file: relPath, matches } : null;
  } catch {
    return null;
  }
}

function searchDir(dirPath: string, query: string, basePath: string, results: SearchResult[]): void {
  if (!existsSync(dirPath)) return;

  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    if (entry.startsWith('.')) continue;

    if (statSync(fullPath).isDirectory()) {
      searchDir(fullPath, query, basePath, results);
    } else if (entry.endsWith('.json')) {
      const result = searchFile(fullPath, query, relative(basePath, fullPath));
      if (result) results.push(result);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/tools/search-texts.ts <query> [--lang en] [--type prayers]');
    process.exit(1);
  }

  const query = args[0];
  let lang = 'en';
  let type = '';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) lang = args[++i];
    if (args[i] === '--type' && args[i + 1]) type = args[++i];
  }

  console.log(`\nSearching for: "${query}"`);
  console.log(`Language: ${lang}`);
  if (type) console.log(`Type: ${type}`);
  console.log('');

  const results: SearchResult[] = [];

  // Search in specified language
  const langDir = join(DATA_DIR, lang);
  if (type) {
    searchDir(join(langDir, type), query, langDir, results);
  } else {
    searchDir(langDir, query, langDir, results);
  }

  // Also search in shared
  searchDir(join(DATA_DIR, 'shared'), query, DATA_DIR, results);

  // Print results
  if (results.length === 0) {
    console.log('No matches found.');
  } else {
    console.log(`Found ${results.length} files with matches:\n`);
    for (const result of results.slice(0, 20)) {
      console.log(`  ${result.file}`);
      for (const match of result.matches.slice(0, 3)) {
        console.log(`    Line ${match.line}: ${match.text.substring(0, 80)}...`);
      }
      if (result.matches.length > 3) {
        console.log(`    ... and ${result.matches.length - 3} more matches`);
      }
    }
    if (results.length > 20) {
      console.log(`\n  ... and ${results.length - 20} more files`);
    }
  }
}

main();
