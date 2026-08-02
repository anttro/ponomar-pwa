# Ponomar — Orthodox Calendar PWA

A Progressive Web App for Orthodox Church calendar, liturgical services, and Bible readings.

Derived from the original [Java Ponomar application](https://github.com/typiconman/ponomar) by Aleksandr Andreev, Yuri Shardt and [Sergei F.](https://github.com/typiconman).

**Demo:** <https://ponomar.atroshin.ru>

## Features

- **Calendar** — View month grids with liturgical days, fasting periods, ranks, and commemorations. Supports Julian calendar with Gregorian equivalents.
- **Service Reader** — Assembles liturgical services (Hours, Kathismata) from structured templates with conditional logic.
- **Bible Reader** — Read scripture across 13 versions (Church Slavonic, Russian Synodal, KJV, Brenton, Vulgate, etc.). Per-version reading position persists across sessions.
- **Multi-language UI** — English, Russian, Church Slavonic (with dedicated Slavonic fonts).
- **PWA** — Installable on desktop and mobile devices.
- **Navigation** — 3 top-level items (Calendar, Library, Settings) with Library dropdown: Bible, Service (Horologion, Sbornik, Prayer Rule, Canons & Akathists, Parimii, Paraclete, Irmologion), Feasts (Menaion, Lenten Triodion).
- **Astronomy** — Sunrise/sunset times and ecclesiastical moon phase (day, trend, illumination) displayed in the calendar day detail panel. Location configurable in settings.

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/) — fully typed
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) — legacy XML conversion (manual only)

## Getting Started

```bash
npm install
npm run dev
```

Data files in `static/data/` are tracked in git. The only gitignored output is `scripts/output/minei.json` (33MB Chetyi-Minei source).

```bash
npm run convert           # re-convert all data from XML
npm run migrate           # normalize to current format
```

Set `PONOMAR_JAVA_HOME` to point at a local clone of the Java Ponomar repository (defaults to `../ponomar`).

```bash
npm run build    # production build
npm run preview  # preview production build
```

## QA / Validation

```bash
npx tsx scripts/validate-data.ts        # Main validator (274 files checked)
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
- **Services** — 78 data-backed services with full.json (Pascha, Paralytic, Sergius, Pokrov, etc.; Var/I-prefix + bare P-prefix varNodes now intercepted)
- **Horologion / Sbornik / Prayer Rule / Akathists / Parimii / Paraclete / Irmologion** — daily-cycle collections
- **Lives** — Saint lives (en/cu/ru, 1190/3046 with life.text enriched from Chetyi-Minei)

## Project Structure

```
src/
  core/          — Domain logic (calendar, paschalion, service assembly, i18n)
  ui/            — View components (app, calendar, bible, service, settings)
  main.ts        — Entry point
scripts/         — Data conversion, migration, validation, enrichment, and CLI tools
static/
  data/          — Liturgical data as JSON (tracked in git, generated from Java XML via npm run convert)
  fonts/         — Church Slavonic fonts
  icons/         — PWA icons
```

## License

Same as the original Java project.

## Documentation

- **[DATA_FORMAT.md](DATA_FORMAT.md)** — Comprehensive static data format documentation in English
- **[DATA_RUS.md](DATA_RUS.md)** — Complete Russian documentation of data format and enrichment process

Covers:
- Static data models, routing rules, and component breakdown
- Complete tool inventory for conversion, migration, and validation
- Chetyi-Minei enrichment pipeline and quality assurance workflow
- Quick reference for all available NPM scripts and commands
