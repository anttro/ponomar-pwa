/**
 * Show statistics about the data directory.
 * Run with: npx tsx scripts/tools/stats.ts [--lang en]
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', '..', 'static', 'data');

interface Stats {
  files: number;
  jsonFiles: number;
  textFiles: number;
  totalSize: number;
  languages: string[];
  categories: Record<string, { files: number; size: number }>;
}

function scanDir(dirPath: string, stats: Stats): void {
  if (!existsSync(dirPath)) return;

  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    if (entry.startsWith('.')) continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, stats);
    } else {
      stats.files++;
      stats.totalSize += stat.size;
      if (entry.endsWith('.json')) stats.jsonFiles++;
      if (entry.endsWith('.text')) stats.textFiles++;
    }
  }
}

function getCategoryStats(dirPath: string): Record<string, { files: number; size: number }> {
  const categories: Record<string, { files: number; size: number }> = {};
  if (!existsSync(dirPath)) return categories;

  for (const entry of readdirSync(dirPath)) {
    const fullPath = join(dirPath, entry);
    if (entry.startsWith('.')) continue;

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      const subStats = getCategoryStats(fullPath);
      for (const [key, value] of Object.entries(subStats)) {
        const catKey = entry + '/' + key;
        categories[catKey] = value;
      }
    } else if (entry.endsWith('.json')) {
      categories[entry] = { files: 1, size: stat.size };
    }
  }

  return categories;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function main() {
  const args = process.argv.slice(2);
  let lang = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang' && args[i + 1]) lang = args[++i];
  }

  console.log('\nData Statistics\n');
  console.log(`Data directory: ${DATA_DIR}\n`);

  // Get languages
  const languages = readdirSync(DATA_DIR).filter(entry => {
    const fullPath = join(DATA_DIR, entry);
    return statSync(fullPath).isDirectory() && !entry.startsWith('.');
  });

  console.log(`Languages: ${languages.join(', ')}\n`);

  // Overall stats
  const overallStats: Stats = { files: 0, jsonFiles: 0, textFiles: 0, totalSize: 0, languages: [], categories: {} };
  scanDir(DATA_DIR, overallStats);

  console.log('Overall:');
  console.log(`  Total files: ${overallStats.files}`);
  console.log(`  JSON files: ${overallStats.jsonFiles}`);
  console.log(`  Text files: ${overallStats.textFiles}`);
  console.log(`  Total size: ${formatSize(overallStats.totalSize)}\n`);

  // Per-language stats
  if (lang) {
    console.log(`\nDetails for language: ${lang}`);
    const langDir = join(DATA_DIR, lang);
    if (existsSync(langDir)) {
      const langStats: Stats = { files: 0, jsonFiles: 0, textFiles: 0, totalSize: 0, languages: [], categories: {} };
      scanDir(langDir, langStats);

      console.log(`  Files: ${langStats.files}`);
      console.log(`  Size: ${formatSize(langStats.totalSize)}`);

      const categories = getCategoryStats(langDir);
      if (Object.keys(categories).length > 0) {
        console.log('\n  Categories:');
        for (const [name, stats] of Object.entries(categories).sort((a, b) => b[1].size - a[1].size)) {
          console.log(`    ${name}: ${stats.files} files, ${formatSize(stats.size)}`);
        }
      }
    }
  } else {
    // Show summary for each language
    console.log('Per-language summary:');
    for (const language of languages) {
      const langDir = join(DATA_DIR, language);
      const langStats: Stats = { files: 0, jsonFiles: 0, textFiles: 0, totalSize: 0, languages: [], categories: {} };
      scanDir(langDir, langStats);
      console.log(`  ${language}: ${langStats.files} files, ${formatSize(langStats.totalSize)}`);
    }
  }
}

main();
