/**
 * Convert English liturgical EPUBs to prayer JSON files.
 *
 * Parses EPUB HTML structure: <h2> section headers, <p> speaker labels + text.
 * Outputs JSON files matching the existing CU prayer format for
 * static/data/en/services/prayers/.
 *
 * Usage:
 *   npx tsx scripts/convert-english-prayers.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

interface PrayerEntry {
  type: string;
  value?: string;
  who?: string;
}

const EPUBS_DIR = '/home/catarrh/projects/liturgical_sources/en';
const OUT_DIR = join(import.meta.dirname, '..', 'static', 'data', 'en', 'services', 'prayers');

/** Map h2 section headings to prayer file IDs and section-start markers. */
const SECTION_MAP: Record<string, { id?: string; skip?: boolean }> = {
  'THE LITANY OF PEACE OR GREAT LITANY': { id: 'GreatLitany' },
  'LITANY OF PEACE OR GREAT LITANY': { id: 'GreatLitany' },
  'THE LITTLE LITANY': { id: 'LittleLitany' },
  'LITTLE LITANY': { id: 'LittleLitany' },
  'LITANY OF FERVENT SUPPLICATION': { id: 'FerventLitany' },
  'THE LITANY OF FERVENT SUPPLICATION': { id: 'FerventLitany' },
  'LITANY OF THE CATECHUMENS': { id: 'CatechumenLitany' },
  'THE LITANY OF THE CATECHUMENS': { id: 'CatechumenLitany' },
  'LITANY OF SUPPLICATION': { id: 'LitanySupplication' },
  'THE LITANY OF SUPPLICATION': { id: 'LitanySupplication' },
  'THE LITANY OF COMPLETION': { id: 'LitanySupplication' },
  'THE SMALL ENTRANCE': { id: 'SmallEntrance' },
  'SMALL ENTRANCE': { id: 'SmallEntrance' },
  'THE GREAT ENTRANCE': { id: 'GreatEntranceDialog' },
  'EPISTLE READING': { skip: true },
  'THE GOSPEL': { skip: true },
  'THE CREED': { id: 'Creed' },
  'THE LORD\'S PRAYER': { id: 'LordPrayerElevation' },
  'COMMUNION': { id: 'CommunionDialog' },
  'DISMISSAL': { id: 'PostCommunionDismissal' },
  'CHERUBIC HYMN': { id: 'CherubicHymn' },
  'CHERUBIKON': { id: 'CherubicHymn' },
  'THE NICENE CREED': { id: 'Creed' },
  'THE ANAPHORA': { id: 'AnaphoraPreface' },
  'TRISAGION': { id: 'HolyGod' },
  'HOLY GOD': { id: 'HolyGod' },
  'COME, LET US WORSHIP': { id: 'ComeLetUsWorship' },
  'COME LET US WORSHIP': { id: 'ComeLetUsWorship' },
  BLESSED: { id: 'BeatitudesRubric' },
  'ONLY-BEGOTTEN SON': { id: 'OnlyBegotten' },
  'ONLY BEGOTTEN SON': { id: 'OnlyBegotten' },
  'ANTIPHON': { id: 'AntiphonRubric' },
  'THE ANTIPHONS': { id: 'AntiphonRubric' },
};

/** Map speaker name in EPUB to who code. */
const SPEAKER_MAP: Record<string, string> = {
  DEACON: 'D',
  PRIEST: 'P',
  CHOIR: 'C',
  READER: 'R',
  'CHOIR (AFTER EACH PETITION)': 'C',
};

const EXTRA_TEXT_MARKERS = ['(after each petition)', '(or)', '(replaces the Trisagion during Great Lent)'];

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^A-Za-z]/g, '');
  return letters.length > 2 && letters === letters.toUpperCase();
}

function cleanText(s: string): string {
  let t = s.trim();
  for (const marker of EXTRA_TEXT_MARKERS) {
    t = t.replace(new RegExp(marker, 'gi'), '').trim();
  }
  t = t.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ');
  return t;
}

/** Parse a single EPUB file, extracting prayer sections. */
function parseEpub(epubPath: string): Record<string, PrayerEntry[]> {
  const tmpDir = '/tmp/english_epub';
  if (existsSync(tmpDir)) execSync(`rm -rf "${tmpDir}"`);
  mkdirSync(tmpDir, { recursive: true });
  execSync(`unzip -o "${epubPath}" -d "${tmpDir}" > /dev/null 2>&1`);

  const result: Record<string, PrayerEntry[]> = {};
  let currentId: string | null = null;
  let entries: PrayerEntry[] = [];
  let currentSpeaker: { who: string; text: string } | null = null;

  // Parse all xhtml files
  const files = readdirSync(tmpDir).filter((f: string) => f.endsWith('.xhtml'));
  const allFiles = files.map((f: string) => join(tmpDir, f));

  // Also check OPS/ subdirectory
  const opsDir = join(tmpDir, 'OPS');
  if (existsSync(opsDir)) {
    const opsFiles = readdirSync(opsDir).filter((f: string) => f.endsWith('.xhtml') && f.startsWith('chapter'));
    for (const f of opsFiles) allFiles.push(join(opsDir, f));
  }

  for (const filePath of allFiles) {
    if (!existsSync(filePath)) continue;
    const html = readFileSync(filePath, 'utf-8');

    // Extract all paragraph-like content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) continue;
    const body = bodyMatch[1];

    // Tokenize by tags
    const tagRegex = /<(h[12]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;

    while ((m = tagRegex.exec(body)) !== null) {
      const tagName = m[1].toLowerCase();
      let inner = m[2];

      // Strip HTML from inner content
      inner = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      if (tagName === 'h1') {
        // Main title — skip
        continue;
      }

      if (tagName === 'h2') {
        // Section header — check if it maps to a prayer file
        const upper = inner.toUpperCase().replace(/\s+/g, ' ').trim();

        // Find matching section
        let matched = false;
        for (const [key, val] of Object.entries(SECTION_MAP)) {
          if (upper.includes(key)) {
            if (val.skip) {
              currentId = null;
              entries = [];
            } else if (val.id) {
              if (currentId && entries.length > 1) {
                result[currentId] = entries;
              }
              currentId = val.id;
              entries = [];
              entries.push({ type: 'HEADER', value: inner + '.' });
            }
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Unknown section — end current
          if (currentId && entries.length > 1) {
            result[currentId] = entries;
          }
          currentId = null;
          entries = [];
        }
        currentSpeaker = null;
        continue;
      }

      if (!currentId) continue;

      // Process paragraph
      const upper = inner.toUpperCase().trim();

      // Check if this is a speaker label
      const speakerKey = upper.replace(/[^A-Z\s]/g, '').trim();
      if (SPEAKER_MAP[speakerKey]) {
        // Flush previous speaker's text
        if (currentSpeaker) {
          const clean = cleanText(currentSpeaker.text);
          if (clean) {
            entries.push({ type: 'TEXT', value: clean, who: currentSpeaker.who });
          }
        }
        currentSpeaker = { who: SPEAKER_MAP[speakerKey], text: '' };
        // If there's text after the speaker label on the same line
        const afterLabel = inner.replace(speakerKey, '').trim();
        if (afterLabel && !isAllCaps(afterLabel)) {
          currentSpeaker.text = afterLabel;
        }
        continue;
      }

      // Check if this is a speaker label followed by text (like "CHOIR (after each petition)")
      for (const [key, code] of Object.entries(SPEAKER_MAP)) {
        if (upper.startsWith(key)) {
          if (currentSpeaker) {
            const clean = cleanText(currentSpeaker.text);
            if (clean) {
              entries.push({ type: 'TEXT', value: clean, who: currentSpeaker.who });
            }
          }
          currentSpeaker = { who: code, text: '' };
          const afterLabel = inner.replace(new RegExp(key, 'i'), '').trim();
          if (afterLabel && !isAllCaps(afterLabel)) {
            currentSpeaker.text = afterLabel;
          }
          break;
        }
      }

      // If it's plain text (not a speaker label)
      if (!currentSpeaker) {
        currentSpeaker = { who: 'D', text: inner };
      } else if (!isAllCaps(inner) && inner.length > 0) {
        // Append to current speaker's text
        if (currentSpeaker.text) currentSpeaker.text += ' ';
        currentSpeaker.text += inner;
      }
    }
  }

  // Flush last speaker
  if (currentSpeaker && currentId) {
    const clean = cleanText(currentSpeaker.text);
    if (clean) {
      entries.push({ type: 'TEXT', value: clean, who: currentSpeaker.who });
    }
  }

  // Save last section
  if (currentId && entries.length > 1) {
    result[currentId] = entries;
  }

  // Cleanup
  execSync(`rm -rf "${tmpDir}"`);

  return result;
}

function writePrayerFile(id: string, entries: PrayerEntry[]): void {
  const outPath = join(OUT_DIR, `${id}.json`);
  writeFileSync(outPath, JSON.stringify(entries));
  console.log(`  ${id}.json — ${entries.length} nodes`);
}

async function main() {
  console.log('Converting English liturgical EPUBs...\n');

  // Process each EPUB
  const epubs = [
    { file: 'Divine Liturgy of St John.epub', label: 'Divine Liturgy of St. John' },
    { file: 'Divine Liturgy of St Basil.epub', label: 'Divine Liturgy of St. Basil' },
  ];

  const allPrayers: Record<string, PrayerEntry[]> = {};

  for (const epub of epubs) {
    const epubPath = join(EPUBS_DIR, epub.file);
    if (!existsSync(epubPath)) {
      console.log(`  SKIP: ${epub.label} (file not found)`);
      continue;
    }
    console.log(`Processing ${epub.label}...`);
    const prayers = parseEpub(epubPath);
    const names = Object.keys(prayers);
    console.log(`  Found ${names.length} sections: ${names.join(', ')}`);
    for (const [id, entries] of Object.entries(prayers)) {
      if (allPrayers[id]) {
        // Merge: keep existing but add missing
        console.log(`  Note: ${id} already exists, keeping first version`);
      } else {
        allPrayers[id] = entries;
      }
    }
  }

  // Write all prayer files
  console.log('\nWriting prayer files...');
  mkdirSync(OUT_DIR, { recursive: true });
  const written = Object.keys(allPrayers).length;
  for (const [id, entries] of Object.entries(allPrayers)) {
    writePrayerFile(id, entries);
  }

  console.log(`\nDone. ${written} prayer files written to ${OUT_DIR}`);
  console.log('Remaining missing files need other sources.');
}

main().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});