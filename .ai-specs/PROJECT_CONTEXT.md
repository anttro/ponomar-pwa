# Project Context for AI Agents

## Quick Project Overview

**Ponomar** is a Progressive Web App for Orthodox Church calendar, liturgical services, and Bible readings.

- **Technology**: TypeScript + Vite + Tailwind CSS v4
- **Data**: JSON-based liturgical data organized by language (en, cu, ru)
- **Architecture**: Client-side PWA with static JSON data, no backend database
- **Core Functionality**: Calendar display, service assembly, Bible reading, saint lives, astronomy

## Key Architectural Patterns

### Data Organization
- **Language-based structure**: `static/data/{lang}/` (en, cu, ru)
- **Bundle system**: menaion-bundles, lives bundles (month-prefixed + misc split), service templates
- **File routing**: CIds with `01`-`12` prefix → month files, else `misc/{first-digit}.json`

### Core Scripts
- `convert-services.ts` — Service XML to JSON conversion
- `enrich-lives.ts` — Fuzzy matching and enrichment pipeline (Chetyi-Minei + Bulgakov)
- `validate-data.ts` — Main validator
- `convert-bulgakov.ts` — Bulgakov's Desktop Book EPUB to JSON conversion

## Recent Work Context

### Completed Enrichment
- **Chetyi-Minei import**: 1154 chapters processed, 1190 lives enriched
- **Bulgakov import**: 332 entries from "Настольная книга" Menaion section, 13 new lives enriched
- **Manual fixes**: 224 manual corrections in `enrich-lives.ts` (64 Minei + 9 Bulgakov + others)
- **Bundle fixes**: 868 Иаков Боровицкий corrected from 05-22 to 10-23
- **Coverage**: 1203/3046 lives have texts (sources: Chetyi-Minei + Bulgakov)

### Validation Status
- All data files validated
- TypeScript compiles cleanly
- Build succeeds without errors

## Critical Invariants

- **Never overwrite existing `life.text`** — enrichment only fills empty entries
- **Bulgakov is secondary source** — fills gaps, never overrides Minei
- **File routing is strict**: CId prefix determines file location
- **Bundle CIds must exist**: Menaion CIds require corresponding lives entries
- **Static data is tracked**: `static/data/` in git (except `scripts/output/minei.json`)
- **Validation must pass**: Changes must pass `tsc --noEmit`, `npm run build`

## Key Script Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build

# Validation
npx tsc --noEmit                 # Type checking
npm run build                     # Build verification
npx tsx scripts/validate-data.ts  # Main validator

# Enrichment (Minei)
npx tsx scripts/enrich-lives.ts              # Dry run
npx tsx scripts/enrich-lives.ts --write       # Apply

# Enrichment (Bulgakov)
npx tsx scripts/enrich-lives.ts --bulgakov    # Dry run
npx tsx scripts/enrich-lives.ts --bulgakov --write
```

## File Structure Highlights

```
src/
├── core/           # Domain logic (calendar, paschalion, service assembly, astronomy)
├── ui/             # View components
└── main.ts         # Entry point

scripts/
├── convert-*.ts    # XML/EPUB → JSON conversion pipeline
├── validate-*.ts   # Comprehensive validation suite
└── enrich-lives.ts # Enrichment with manual fixes (Minei + Bulgakov)

static/data/
├── cu/             # Church Slavonic (authoritative calendar)
├── ru/             # Russian (enriched lives)
├── en/             # English (enriched lives + service texts)
└── shared/         # Cross-language resources (calendar, lives index, parimii)
```

## Important Notes

### Pipeline Dependencies
- **Chetyi-Minei source**: EPUB conversion requires `convert-minei.ts`
- **Bulgakov source**: EPUB conversion requires `convert-bulgakov.ts`
- **Enrichment workflow**: Requires minei.json + bulgakov.json + menaion-bundle.json
- **Validation chain**: Each commit must pass typecheck → build

### File System Constraints
- `scripts/output/minei.json` is gitignored (33MB source file)
- `scripts/output/bulgakov.json` is gitignored
- `static/data/` is fully tracked in git
- Lives files: month files (01.json-12.json) + misc split (misc/0.json-misc/9.json)

## Current State

- Total CIds: 3046
- Lives with text: 1203 (Chetyi-Minei + Bulgakov)
- Unmatched Minei: 27 (floor: narratives, no-target, already-filled)
- Unmatched Bulgakov: 121 (all no recoverable targets)
- Latest enrichment commits: `e32d787` (Bulgakov), `c342a5b` (orthography), `08950cd` (64 fixes)

## Documentation Reference

- **DATA_EN.md** — Detailed technical specifications (English)
- **DATA_RUS.md** — Complete documentation in Russian
- **README.md** — Project overview and getting started