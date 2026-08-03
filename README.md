# Ponomar — Orthodox Calendar PWA

A Progressive Web App for Orthodox Church calendar, liturgical services, and Bible readings.

Derived from the original [Java Ponomar application](https://github.com/typiconman/ponomar) by Aleksandr Andreev, Yuri Shardt and [Sergei F.](https://github.com/typiconman).

**Demo:** <https://ponomar.atroshin.ru>

## Features

- **Calendar** — View month grids with liturgical days, fasting periods, ranks, and commemorations. Supports Julian calendar with Gregorian equivalents.
- **Service Reader** — Assembles liturgical services (Hours, Kathismata) from structured templates with conditional logic.
- **Bible Reader** — Read scripture across 13 versions (Church Slavonic, Russian Synodal, KJV, Brenton, Vulgate, etc.). Per-version reading position persists across sessions.
- **Saint Lives** — 1203/3046 lives enriched with texts from Chetyi-Minei and Bulgakov's Desktop Book.
- **Multi-language UI** — English, Russian, Church Slavonic (with dedicated Slavonic fonts).
- **Color Themes** — Switch between Default, Dark, Sepia, and High Contrast themes in settings.
- **PWA + Offline** — Installable on desktop and mobile. Preload data (lives, calendar, Bible translations) for offline use via IndexedDB cache.
- **Astronomy** — Sunrise/sunset times and ecclesiastical moon phase (day, trend, illumination) displayed in the calendar day detail panel. Location configurable in settings.
- **Navigation** — 3 top-level items (Calendar, Library, Settings) with Library dropdown: Bible, Service (Horologion, Sbornik, Prayer Rule, Canons & Akathists, Parimii, Paraclete, Irmologion), Feasts (Menaion, Lenten Triodion).

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/) — fully typed
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — PWA + service worker

## Getting Started

```bash
npm install
npm run dev
```

Data files in `static/data/` are tracked in git. The only gitignored output is `scripts/output/minei.json` (33MB Chetyi-Minei source).

**Data version**: `DATA_VERSION` in `src/ui/app.ts` controls cache invalidation. Bump it when restructuring data (new fields, reorganized bundles, updated sources) to force users to re-fetch cached data on next app load.

**Preload manifest**: After adding or removing data files, regenerate the preload manifest:
```bash
npm run generate-manifest
```
Then commit the updated `static/data/shared/preload-manifest.json` along with the data changes.

```bash
npm run build    # production build
npm run preview  # preview production build
```

## QA / Validation

```bash
npx tsc --noEmit                       # TypeScript type checking
npm run build                           # Build verification
npx tsx scripts/validate-data.ts        # Main data validator
npx tsx scripts/validate-i18n.ts         # i18n completeness (en/ru/cu)
npx tsx scripts/validate-tabs.ts         # service tab/template consistency
npx tsx scripts/validate-menaion.ts      # menaion data validation
npx tsx scripts/validate-prayer-rule.ts  # prayer rule structure validation
npx tsx scripts/validate-triodion.ts     # Triodion period validation
npx tsx scripts/validate-pentecostarion.ts # Pentecostarion validation
npx tsx scripts/validate-holy-week.ts    # Holy Week validation
npx tsx scripts/validate-great-canon.ts  # Great Canon validation
npx tsx scripts/assembler-test.ts       # service assembler integration tests
```

## Liturgical Text Categories (static/data/shared/services/)

- **Triodion** — 37 sections (Pre-Lent → Great Lent → Holy Week)
- **Pentecostarion** — 50 days (Pascha → All Saints)
- **Menaion (daily)** — 367 daily entries (one per Julian calendar day)
- **Menaion (feasts)** — 34 fixed feasts with dedicated services
- **Canons** — Paraclete (weekday, 8 tones × 6 days = 48), Octoechos (Sunday, 8 tones), Great Canon
- **Services** — 78 data-backed services with full.json (Pascha, Paralytic, Sergius, Pokrov, etc.)
- **Horologion / Sbornik / Prayer Rule / Akathists / Parimii / Paraclete / Irmologion** — daily-cycle collections
- **Lives** — Saint lives (en/cu/ru, 1203/3046 with life.text enriched from Chetyi-Minei and Bulgakov)

## Project Structure

```
src/
  core/          — Domain logic (calendar, paschalion, service assembly, i18n)
  ui/            — View components (app, calendar, bible, service, settings)
  main.ts        — Entry point
scripts/         — Data conversion, migration, validation, enrichment, and CLI tools
static/
  data/          — Liturgical data as JSON (tracked in git)
  fonts/         — Church Slavonic fonts
  icons/         — PWA icons
```

## License

Same as the original Java project.

## Documentation

- **[DATA_EN.md](DATA_EN.md)** — Comprehensive static data format documentation in English
- **[DATA_RUS.md](DATA_RUS.md)** — Complete Russian documentation of data format and enrichment process