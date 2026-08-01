# Project Context for AI Agents

## Quick Project Overview

**Ponomar** is a Progressive Web App for Orthodox Church calendar, liturgical services, and Bible readings.

- **Technology**: TypeScript + Vite + Tailwind CSS v4
- **Data**: JSON-based liturgical data organized by language (en, cu, el, fr, zh, ru)
- **Architecture**: Client-side PWA with static JSON data, no backend database
- **Core Functionality**: Calendar display, service assembly, Bible reading, saint lives

## Key Architectural Patterns

### Data Organization
- **Language-based structure**: `static/data/{lang}/` (en, cu, el, fr, zh, ru)
- **Bundle system**: menaion-bundles, lives bundles, service templates
- **File routing**: CIds with `01`-`12` prefix → month files, else `misc.json`

### Core Scripts
- `convert-all.ts` — Master conversion script
- `enrich-lives.ts` — Fuzzy matching and enrichment pipeline
- `validate-data.ts` — Main validator (checks 274 files)
- `convert-minei.ts` — Chetyi-Minei EPUB to JSON conversion
- `migrate-data.ts` — Data normalization

## Recent Work Context

### Completed Enrichment
- **Chetyi-Minei import**: 1154 chapters processed, 1190/3046 lives enriched
- **Manual fixes**: 214 manual corrections in `enrich-lives.ts`
- **Bundle fixes**: 868 Иаков Боровицký corrected from 05-22 to 10-23
- **Coverage**: 39% of lives have texts (source from Chetyi-Minei)

### Validation Status
- All data files validated: 274 files checked
- TypeScript compiles cleanly
- Build succeeds without errors

## Critical Invariants

- **Never overwrite existing `life.text`** — enrichment only fills empty entries
- **File routing is strict**: CId prefix determines file location
- **Bundle CIds must exist**: Menaion CIds require corresponding lives entries
- **Static data is tracked**: `static/data/` in git (except `scripts/output/minei.json`)
- **Validation must pass**: Changes must pass `validate-data.ts`, `tsc --noEemit`, `npm run build`

## Key Script Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build

# Data operations
npm run convert          # Convert XML to JSON
npm run migrate          # Normalize data format

# Validation
npx tsx scripts/validate-data.ts    # Main validator
npx tsc --noEmit                 # Type checking
npm run build                     # Build verification

# Enrichment
npx tsx scripts/enrich-lives.ts    # Dry run enrichment
npx tsx scripts/enrich-lives.ts --write # Apply enrichment
```

## File Structure Highlights

```
src/
├── core/           # Domain logic (calendar, paschalion, service assembly)
├── ui/             # View components
└── main.ts         # Entry point

scripts/
├── convert-*.ts    # XML→JSON conversion pipeline
├── validate-*.ts  # Comprehensive validation suite
└── enrich-lives.ts # Enrichment with manual fixes

static/data/
├── cu/             # Church Slavonic (authoritative calendar)
├── ru/             # Russian (enriched lives)
├── en/             # English
└── shared/         # Cross-language resources
```

## Important Notes

### Pipeline Dependencies
- **Chetyi-Minei source**: EPUB conversion requires `convert-minei.ts`
- **Enrichment workflow**: Requires minei.json output + menaion-bundle.json
- **Validation chain**: Each commit must pass validation → typecheck → build

### File System Constraints
- `scripts/output/minei.json` is gitignored (33MB source file)
- `static/data/` is fully tracked in git
- Lives files are written by month (01.json-12.json) or misc.json

## Common Tools Reference

- **Search**: `npx tsx scripts/tools/search-texts.ts <query>`
- **Stats**: `npx tsx scripts/tools/stats.ts [--lang en]`
- **Validate**: `npx tsx scripts/validate-data.ts`

## Documentation Reference

- **DATA_FORMAT.md** — Detailed technical specifications (English)
- **DATA_RUS.md** — Complete documentation in Russian
- **README.md** — Project overview and getting started

## Working Reminders

- Always run validation before committing data changes
- Check coverage statistics when working with enrichment
- Test builds after any modifications to static data
- Review the match report after dry runs

## Current State

- Total CIds: 3046
- Lives with text: 1190 (enriched from Chetyi-Minei)
- Unmatched minei chapters: 27 (floor: narratives, no-target, already-filled)
- Latest enrichment commits: `ec3f593` (3 more lives), `08950cd` (57 more lives), `381a494` (121 more lives), `7dde216` (baseline enrichment)