# Static Data Format Documentation

## Table of Contents
1. [Static Data Format Overview](#static-data-format-overview)
2. [Directory Structure & Organization](#directory-structure--organization)
3. [Data Models & Schemas](#data-models--schemas)
4. [File Routing Rules](#file-routing-rules)
5. [Data Components Breakdown](#data-components-breakdown)
6. [Data Management Tools](#data-management-tools)
7. [Enrichment Process](#enrichment-process)
8. [Quality Assurance Workflow](#quality-assurance-workflow)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Quick Reference](#quick-reference)

---

## Static Data Format Overview

The Ponomar PWA uses a JSON-based static data system organized by language. All liturgical data is pre-converted from XML sources and structured for efficient serving and client-side rendering.

### Core Principles
- **Language-based organization**: Each language has its own directory under `static/data/`
- **JSON storage**: All data stored as JSON files for easy parsing
- **Date-based routing**: Calendar data organized by Julian calendar dates (MM-DD format)
- **CId-based identification**: Canonical Identifiers (CIds) uniquely identify saints and feasts
- **Prefix-based file routing**: Lives files routed by CId prefix (01-12 → month files)

### Supported Languages
- `en` — English
- `cu` — Church Slavonic
- `ru` — Russian
- `el` — Greek (includes `el/mono` for monochord)
- `fr` — French
- `zh` — Chinese (includes `zh/Hans` and `zh/Hant` for Simplified/Traditional)
- `shared` — Cross-language resources

---

## Directory Structure & Organization

```
static/data/
├── en/
│   ├── menaion-bundle.json          # Date → CId mapping (authoritative)
│   ├── en-menaion-bundle.json       # Language-specific overrides
│   ├── lives/                       # Saint lives by month
│   │   ├── 01.json through 12.json  # Month-prefixed CIds (01XX-12XX)
│   │   ├── misc/                    # Non-month-prefixed CIds
│   │   │   ├── 1.json               # CIds starting with digit 1
│   │   │   ├── 2.json
│   ├── menaion/                     # Daily menaion entries (366 days)
│   ├── calendar/                    # Calendar metadata
│   └── services/                    # Service templates
├── cu/                              # Church Slavonic (similar structure)
├── ru/                              # Russian (lives, services)
├── el/                              # Greek (includes mono/)
├── fr/                              # French
├── zh/                              # Chinese (includes Hans/, Hant/)
└── shared/                          # Cross-language resources
    ├── calendar/                    # Movable feast calendar
    ├── services/                    # Shared service templates
    └── lives-index.json            # CId → scripture lookup index
```

### File Types
- `*-bundle.json` — Calendar mapping files
- `lives/*.json` — Saint lives bundles
- `menaion/*.json` — Daily liturgical entries
- `services/*.json` — Service templates and logic
- `calendar/*.json` — Calendar calculations and metadata

---

## Data Models & Schemas

### Bundle Entry (menaion-bundle.json)
```json
{
  "01-01": [
    { "id": "010101" },
    { "id": "772426" },
    { "id": "010102" }
  ]
}
```
**Structure**: Object keyed by date `MM-DD` with array of entries, each containing only `"id"` field with CId value.

### Life Entry (lives/*.json)
```json
{
  "772426": {
    "name": {
      "nominative": "Прп. Сильвестра Печерского (XII)",
      "short": "Прп. Сильвестра Печерского"
    },
    "life": {
      "id": "minei-0101-772426",
      "copyright": "Четьи-Минеи свт. Димитрия Ростовского",
      "text": "<p>Преподобный отец наш Сильвестр...</p>"
    }
  }
}
```
**Structure**: Object keyed by CId (string), each containing:
- `name` object with case variants (`nominative`, `short`, `genitive`, etc.)
- `life` object (optional) with `id`, `copyright`, and `text` fields

### Calendar Entry
```json
{
  "pascha": { "year": 2025, "date": "04-20" },
  "fixed": [
    { "date": "01-01", "rank": 5, "celebration": "Circumcision" }
  ]
}
```
**Structure**: Contains movable feast calculations and fixed calendar data.

### Service Template Entry
```json
{
  "ROYALHOURS": {
    "0": {
      "text": "In the name of the Father...",
      "type": "0"
    }
  }
}
```
**Structure**: Hierarchical service structure with text nodes and conditional logic.

---

## File Routing Rules

### Lives File Routing
Lives bundles are routed based on CId prefix:

| CId Pattern | Target File | Examples |
|-------------|--------------|----------|
| `01XX-01ZZ` | `01.json` | `010101`, `014567` |
| `02XX-02ZZ` | `02.json` | `023456`, `027890` |
| ... | ... | ... |
| `12XX-12ZZ` | `12.json` | `123456`, `127890` |
| Other CIds | `misc/{n}.json` | `772426→misc/7.json`, `373→misc/3.json` |

**Examples:**
- `010101` → `01.json`
- `1253` → `12.json`  
- `772426` → `misc/7.json`
- `373` → `misc/3.json`

### Bundle File Naming
- Main bundle: `menaion-bundle.json` (per language)
- Language overrides: `{lang}-menaion-bundle.json`
- No prefix-based routing for bundles (single file per language)

---

## Data Components Breakdown

### Menaion Bundles
**Purpose**: Authoritative date → CId mapping for calendar rendering

**Structure**: Date-keyed JSON with arrays of CIds
```json
{
  "01-01": [{ "id": "010101" }, { "id": "772426" }],
  "01-02": [{ "id": "010201" }, { "id": "772455" }]
}
```

**Coverage**: 366 Julian calendar days × multiple entries per day
**File Size**: ~50-100KB per language
**Usage**: Calendar view determines which saints to display on each day

### Lives Bundles
**Purpose**: Saint biographies and lives for enrichment

**Structure**: CId-keyed JSON with name variants and optional life text
```json
{
  "772426": {
    "name": {
      "nominative": "Прп. Сильвестра Печерского (XII)",
      "short": "Прп. Сильвестра Печерского"
    },
    "life": {
      "id": "minei-0101-772426",
      "copyright": "Четьи-Минеи свт. Димитрия Ростовского",
      "text": "<p>Complete life text in HTML...</p>"
    }
  }
}
```

**Coverage**: 3046 total CIds, 1203 with life.text enriched
**Routing**: Prefix-based (01.json-12.json + misc/{digit}.json)
**Usage**: Lives display on saint detail pages

### Calendar Data
**Purpose**: Movable feast calculations and calendar metadata

**Components**:
- `shared/calendar/triodion.json` — Pre-Lent through Holy Week
- `shared/calendar/pentecostarion.json` — Pascha through All Saints
- `{lang}/calendar/` — Language-specific calendar data

**Key Features**:
- Paschalion calculations
- Movable feast dating
- Fasting period definitions
- Holiday and commemoration metadata

### Service Templates
**Purpose**: Structured liturgical service data with conditional logic

**Organization**:
```
services/
├── octoecheos/          # Eight tones × days
├── triodion/            # 37 Lenten sections
├── pentecostarion/      # 50 Paschal days
├── menaion/             # 366 daily entries + 34 feasts
├── canons/              # Paraclete, Octoechos, Great Canon
└── shared/templates/    # Reusable service components
```

**Structure**: Hierarchical JSON with text nodes and conditional prefixes
- **P-prefix nodes**: Optional content that may be included
- **Var/I-prefix nodes**: Conditional selection logic
- **Plain nodes**: Required content always included

### Bible Metadata
**Purpose**: Bible version mappings and reading pericopes

**Structure**: Version identifiers and pericope mappings across 13 Bible versions
- Church Slavonic
- Russian Synodal
- KJV
- Brenton (Septuagint)
- Vulgate
- Other versions

### Prayer Rules & Commands
**Purpose**: Daily cycle structures and prayer rule definitions

**Components**:
- **Prayer Rules**: Daily reading schedules
- **Commands**: Service command structures
- **Horologion**: Hours, Kathismata, Compline, etc.

### Fasting Rules
**Purpose**: Period definitions and fasting exceptions

**Structure**: JSON with fasting periods, exceptions, and detailed rules
- Pre-Lent periods
- Great Lent
- Fast-free periods
- Fish/strict fasting days

---

## Data Management Tools

### Conversion Pipeline (`scripts/convert-*.ts`)

#### Master Script
**`convert-all.ts`** — Orchestrates all conversion steps
```bash
npm run convert
```

Converts XML data from Java Ponomar sources to JSON format.

#### Individual Converters

**`convert-lives.ts`** — Saint lives XML → JSON conversion
- Input: `ponomar/Ponomar/languages/{lang}/xml/lives/*.xml`
- Output: `{lang}/lives/{01.json|misc/{digit}.json}` bundles
- Features:
  - XML parsing with attribute extraction
  - Name case normalization
  - Grammar data extraction
  - Service data extraction
  - Scripture reference extraction
  - Bundle generation by month prefix

**`convert-calendar.ts`** — Calendar metadata conversion
- Input: XML calendar data
- Output: JSON calendar structures
- Features:
  - Movable feast calculations
  - Fixed feast mappings
  - Period definitions

**`convert-services.ts`** — Service template conversion
- Input: XML service definitions
- Output: JSON service templates
- Features:
  - Hierarchical structure preservation
  - Conditional logic extraction
  - Text node normalization

**`convert-bible-meta.ts`** — Bible metadata extraction
- Input: XML bible metadata
- Output: JSON version mappings and pericopes

**`convert-fasting.ts`** — Fasting rules conversion
- Input: XML fasting definitions
- Output: JSON fasting rules and periods

**`convert-commands.ts`** — Command structure conversion
- Input: XML command definitions
- Output: JSON command structures

**`convert-service-rules.ts`** — Service rule extraction
- Input: XML service rule definitions
- Output: JSON service rules

### Migration Tools (`scripts/migrate-data.ts`)

**Purpose**: Normalize data format across versions and languages

**Operations:**
1. Strip `@_` prefixes from lives name keys (all languages)
2. Remove `SId` from menaion entries (keep id = CId) (all languages)
3. Rename service directories to lowercase (cu, el, fr, zh/Hans, zh/Hant, ru)
4. Flatten Octoecheos structure (cu, fr, zh/Hans, zh/Hant)
5. Convert `TEXT` → `text` in command files
6. Move shared services into `templates/` subdirectory
7. Normalize name key casing (Nominative → nominative, Short → short)
8. Migrate merged calendar files (triodion.json, pentecostarion.json)

**Usage:**
```bash
npm run migrate              # Apply migrations
npm run migrate:dry          # Preview changes
```

### Validation Suite (`scripts/validate-*.ts`)

#### Main Validator
**`validate-data.ts`** — Comprehensive data validation
```bash
npx tsx scripts/validate-data.ts
```
**Validates:**
- Life entry structure (required fields)
- Lives bundle format (CId keys, name objects)
- Calendar data integrity
- Service template structure
- Prayer format compliance
- Command node structure
- Commemoration entries
- Fasting rule definitions

**Output:** File count, errors, warnings

#### Specialized Validators
**`validate-i18n.ts`** — Internationalization completeness
```bash
npx tsx scripts/validate-i18n.ts
```
Checks coverage across languages (en/ru/cu).

**`validate-tabs.ts`** — Service tab/template consistency
```bash
npx tsx scripts/validate-tabs.ts
```
Validates that service tabs match template structures.

**`validate-menaion.ts`** — Menaion data validation
```bash
npx tsx scripts/validate-menaion.ts
```
Validates menaion entries against calendar rules.

**`validate-prayer-rule.ts`** — Prayer rule structure validation
```bash
npx tsx scripts/validate-prayer-rule.ts
```
Validates prayer rule format and completeness.

**Period-specific Validators:**
- `validate-triodion.ts` — Triodion period validation
- `validate-pentecostarion.ts` — Pentecostarion validation
- `validate-holy-week.ts` — Holy Week validation
- `validate-great-canon.ts` — Great Canon validation
- `validate-great-compline.ts` — Great Compline validation
- `validate-libcs.ts` — Library content validation

### Utility Tools (`scripts/tools/`)

**`search-texts.ts`** — Full-text search across data files
```bash
npx tsx scripts/tools/search-texts.ts <query> [--lang en] [--type prayers]
```

**`stats.ts`** — Data statistics and size analysis
```bash
npx tsx scripts/tools/stats.ts [--lang en]
```

Provides file counts, sizes, and category breakdowns.

---

## Enrichment Process

### Overview
The enrichment process fills empty `life.text` fields in ru/lives bundles using Chetyi-Minei (St. Dimitri of Rostov) hagiographic texts.

### Source Preparation: Chetyi-Minei Import

**`convert-minei.ts`** — Converts Chetyi-Minei EPUB to date-keyed JSON

**Input Layout (extracted EPUB):**
```
extracted-epub/
├── index_split_000.xhtml through index_split_9999.xhtml
├── toc.ncx
└── content.opf
```

**Process:**
1. Parse day files sequentially
2. Extract headings: `h2` for dates (`"Память 1 января"`), `h3` for chapter titles
3. Extract paragraphs: `<p class="paragraph1">` for content
4. Collect footnotes from `<a title="...">` anchors
5. Append notes as "Примечания:" block
6. Apply heading date corrections (e.g., `calibre_toc_10023` → `01-27`)
7. Build output structure: `{ "MM-DD": [{ title, html }] }`

**Usage:**
```bash
npx tsx scripts/convert-minei.ts <extracted-epub-dir> [output.json]
```

**Output:** `scripts/output/minei.json` (gitignored, ~33MB)

### Enrichment Pipeline

**`enrich-lives.ts`** — Fuzzy-matches minei titles to CId names and fills empty lives

**Inputs:**
- `scripts/output/minei.json` — Source lives by date (MM-DD)
- `static/data/cu/menaion-bundle.json` — Authoritative date→CId map
- `static/data/ru/lives/*.json` — Target bundles for enrichment

**Matching Strategy:**
1. **Tokenization**: Split titles into tokens, filter ROLE_WORDS
2. **Dice Coefficient**: Calculate similarity over token sets
3. **Status Classification**:
   - `already-filled` — Target already has `life.text` → skip
   - `auto` — Score ≥ 0.6, empty target → write
   - `review` — Score 0.35–0.6 → manual review
   - `unmatched` — Score < 0.35 or no candidates → unmatched

**Manual Overrides:**
```typescript
const MANUAL_FIXES: Record<string, string> = {
  '02-02|сказание о сретении': '373',
  '03-24|воспоминание о чуде': '822',
  // 214 entries total
}
```
Key format: `{date}|{distinctive substring}` → CId

**Collision Handling:** Multiple sources map to same CId
- First source: writes `life.html` directly (no heading)
- Subsequent sources: append `<p><b>{title}</b></p>{html}`

**File Routing:**
```typescript
function bundleFileForCid(cid: string): string {
  return /^(0[1-9]|1[0-2])\d+/.test(cid) 
    ? `${cid.substring(0, 2)}.json` 
    : `misc/${cid.charAt(0)}.json`;
}
```

**Usage:**
```bash
# Dry run: report only
npx tsx scripts/enrich-lives.ts

# Limit to one month
npx tsx scripts/enrich-lives.ts --month 01

# Apply changes
npx tsx scripts/enrich-lives.ts --write

# Apply changes for specific month
npx tsx scripts/enrich-lives.ts --write --month 01
```

**Output:** `scripts/output/lives-match-report.json` with match status per source

### Workflow Example

**Phase 1: Source Preparation**
```bash
npx tsx scripts/convert-minei.ts ~/Downloads/chetyi-minei-epub/
# Output: scripts/output/minei.json
```

**Phase 2: Dry Run Analysis**
```bash
npx tsx scripts/enrich-lives.ts
# Shows: Auto-applied: 184, needs review: 127, unmatched: 94
# Review: scripts/output/lives-match-report.json
```

**Phase 3: Manual Review & Fixes**
- Analyze `review` entries in report
- Add MANUAL_FIXES for problematic matches
- Re-run until `review` count acceptable

**Phase 4: Write & Validate**
```bash
npx tsx scripts/enrich-lives.ts --write
# Shows: Wrote 7 updated bundle(s)
npx tsx scripts/validate-data.ts
npx tsc --noEmit
npm run build
```

**Phase 5: Commit**
```bash
git add scripts/enrich-lives.ts scripts/output/lives-match-report.json static/data/ru/lives/
git commit -m "enrich 121 more ru lives with Chetyi-Minei texts"
```

### Quality Controls

**Collision Verification:** Check multi-chapter entries have correct headings
```bash
python3 -c "
import json, re
misc = json.load(open('static/data/ru/lives/misc/4.json'))
for cid in ['493', '1674', '257401']:  # Known collision targets
    text = misc[cid]['life']['text']
    headings = re.findall(r'<b>([^<]+)</b>', text)
    print(f'{cid}: {len(headings)} chapters - {headings}')
"
```

**Coverage Tracking:** Monitor enrichment progress
```bash
python3 -c "
import json, glob, os
total = has = 0
for fp in glob.glob('static/data/ru/lives/*.json'):
    data = json.load(open(fp))
    for cid, entry in data.items():
        total += 1
        if isinstance(entry.get('life'), dict) and entry.get('life', {}).get('text'):
            has += 1
print(f'Coverage: {has}/{total} ({has*100//total}%) lives with text')
"
```

---

## Quality Assurance Workflow

### Pre-Commit Checklist

1. **Data Validation**
```bash
npx tsx scripts/validate-data.ts
# Expected: "All files valid!" or specific error count
```

2. **Type Safety**
```bash
npm run check  # or npx tsc --noEmit
# Expected: No TypeScript errors
```

3. **Build Verification**
```bash
npm run build
# Expected: Successful build with bundle sizes
```

4. **Functional Testing**
```bash
npm run dev
# Manual test: Calendar view, saint detail pages, lives display
```

### Continuous Monitoring

**Automated Checks:**
- File count validation (should be 274 files)
- JSON parseability (all data files)
- Required field presence (nominative, life.text for enriched entries)
- CId consistency (same CId should have same name across languages)

**Issue Detection:**
- Corrupted JSON files → parse errors in validate-data.ts
- Missing required fields → validation warnings
- Type mismatches → TypeScript errors
- Build failures → invalid data structures

### Issue Resolution

**Common Validation Errors:**
1. **"Missing nominative"** — Name object lacks nominative case
   - **Solution**: Add `name.nominative` field to affected entries

2. **"Failed to parse"** — Corrupted JSON file
   - **Solution**: Re-run conversion or fix JSON syntax

3. **"Rank should be 0-8"** — Invalid rank value
   - **Solution**: Normalize rank to range 0-8

4. **Build bundle size changes** — Unexpected file size increases
   - **Solution**: Check for duplicate or malformed content

---

## Common Issues & Solutions

### OCR Artifacts in Minei Texts

**Problem:** Chetyi-Minei conversion produces OCR issues like:
- Latin characters in Russian text (`Taиcии` instead of `Таисии`)
- Footnote markers `[1]` in body text
- Erratic punctuation `[1]` in titles

**Solution:**
- Keep OCR artifacts as-is (part of source text)
- Manual fixes use exact OCR substrings for matching
- Examples: `'02-15|onissima, odnogo iz lika'` → `'450'`

### Homonym Resolution on Same Date

**Problem:** Multiple saints share similar names on same date

**Examples:**
- 03-24: Иаков исповедник (68501) vs other Иаков entries
- 02-22: Варадат vs Фалассий (both map to 493)
- 09-03: Анфим, Аристион, Василиса on same date

**Solution:**
- Use distinctive substrings in MANUAL_FIXES
- Ensure uniqueness per date (verify with verification script)
- For collisions: both sources map to same CId (append behavior)

### Cross-Date Narratives

**Problem:** Some minei chapters are narratives not tied to a specific feast

**Examples:**
- 02-02: "Сказание о Сретении Господнем" (presentation narrative)
- 03-24: "Воспоминание о чуде в Печерском монастыре" (miracle story)
- 08-28: "Память святой праведной Анны" (prophetess Anna)

**Solution:**
- Identify appropriate CId for the saint/event
- Map with MANUAL_FIXES even if not on same date (though current pipeline is date-based)
- For entries with no appropriate CId: remain unmatched

### Bundle Mis-Mappings

**Problem:** Some CIds are listed on wrong calendar dates

**Example:** 
- 868 Иаков Боровицкий listed under 05-22, actual feast 10-23

**Solution:**
- Manually correct menaion-bundle.json
- Move CIds from incorrect date to correct date
- Verify with calendar sources and tradition

### File Routing Edge Cases

**Problem:** Ambiguous routing for CIds at boundaries

**Edge Cases:**
- `00` prefixes → misc/{first-digit}.json (not 00.json)
- `99` prefixes → misc/{first-digit}.json (not 09.json)
- Non-numeric CIds → misc/{first-digit}.json

**Solution:** 
```typescript
/^(0[1-9]|1[0-2])\d+/.test(cid) // Match only 01-12 followed by digits
```

### Multi-Chapter Collision Display

**Problem:** When multiple sources append to same CId, first chapter lacks heading

**Behavior:**
- First source: writes `life.html` directly (no title)
- Subsequent sources: append `<p><b>{title}</b></p>{html}`
- Result: First chapter unheaded, others clearly marked

**Acceptable Trade-off:** Consistent with all single-chapter lives (which have no heading)

---

## Quick Reference

### NPM Scripts Summary

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm run preview          # Preview production build

# Data Conversion
npm run convert          # Convert all XML sources to JSON
npm run migrate          # Normalize to current format
npm run migrate:dry      # Preview migration changes

# Validation
npm run check            # Type check (tsc --noEmit)
npx tsx scripts/validate-data.ts       # Main validator
npx tsx scripts/validate-i18n.ts        # i18n completeness
npx tsx scripts/validate-tabs.ts        # Service consistency

# Tools
npx tsx scripts/tools/search-texts.ts <query>    # Search data files
npx tsx scripts/tools/stats.ts                 # Data statistics

# Enrichment
npx tsx scripts/convert-minei.ts <epub-dir>     # Import Chetyi-Minei
npx tsx scripts/enrich-lives.ts                # Dry run enrichment
npx tsx scripts/enrich-lives.ts --write         # Apply enrichment
```

### File Extensions

| Extension | Purpose | Format |
|-----------|---------|--------|
| `.json` | All static data files | JSON |
| `.text` | Plain text resources | Plain text |
| `.xml` | Source data (not in repo) | XML |

### Git Strategy

**Tracked:** `static/data/` (except output files)
**Ignored:** 
- `scripts/output/minei.json` (33MB, generated)
- `node_modules/`
- `dist/`

### Important File Paths

```bash
# Data directories
static/data/cu/menaion-bundle.json          # Calendar authority
static/data/ru/lives/                        # Target for enrichment
static/data/shared/services/                 # Shared service templates

# Scripts
scripts/enrich-lives.ts                     # Enrichment pipeline
scripts/convert-minei.ts                    # Minei import
scripts/validate-data.ts                    # Main validator

# Output files
scripts/output/minei.json                   # Minei source (gitignored)
scripts/output/lives-match-report.json      # Match report
```

### Coverage Statistics

**Current Status:**
- Total CIds: 3046
- Lives with text: 1203 (39%)
- Empty lives: 1856 (61%)

**Enrichment Progress:**
- Chetyi-Minei chapters: 1154 total
- Matched: 1127 (auto 64 + already-filled 1063)
- Unmatched: 27 (floor: narratives, no-target, already-filled)

### Status Classifications

| Status | Meaning | Action |
|--------|---------|--------|
| `auto` | Score ≥ 0.6, empty target | Automatically written |
| `already-filled` | Target already has life.text | Skip (redundant) |
| `review` | Score 0.35–0.6 | Manual review required |
| `unmatched` | Score < 0.35 or no candidates | No suitable target |

### Key Constants

**File Paths:**
```typescript
const MINEI_PATH = 'scripts/output/minei.json';
const MENAION_BUNDLE_PATH = 'static/data/cu/menaion-bundle.json';
const LIVES_DIR = 'static/data/ru/lives';
const REPORT_PATH = 'scripts/output/lives-match-report.json';
```

**Matching Thresholds:**
```typescript
const AUTO_THRESHOLD = 0.6;      // Automatic write
const REVIEW_THRESHOLD = 0.35;   // Manual review
```

**Copyright String:**
```typescript
const COPYRIGHT = 'Четьи-Минеи свт. Димитрия Ростовского';
```

---

## Version History

- **Initial release** — Complete data format and enrichment process documentation
- **Updated** — Added bundle mis-mapping section, cross-date narrative handling, QA workflow

---

## Contributing

When contributing to the data format or enrichment pipeline:

1. **Test thoroughly:** Run validation, typecheck, and build before committing
2. **Document changes:** Update this documentation for any schema changes
3. **Preserve compatibility:** Maintain existing file routing rules and naming conventions
4. **Validate data:** Run `validate-data.ts` and fix any errors

---

## Support

For questions or issues with the static data format:
- Review this documentation
- Check existing issues in the repository
- Run validation tools for error diagnosis
- Examine the enrichment pipeline for matching problems