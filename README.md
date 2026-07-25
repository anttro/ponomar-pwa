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

Data files in `static/data/` are pre-converted JSON (not committed). To regenerate from the Java XML sources, run:

```bash
npm run convert           # re-convert all data from XML
npm run migrate           # normalize to current format
```

Set `PONOMAR_JAVA_HOME` to point at a local clone of the Java Ponomar repository (defaults to `../ponomar`).

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Project Structure

```
src/
  core/          — Domain logic (calendar, paschalion, service assembly, i18n)
  ui/            — View components (app, calendar, bible, service, settings)
  main.ts        — Entry point
scripts/         — Data conversion, migration, validation, and CLI tools
static/
  data/          — Liturgical data as JSON (not committed, generated from Java XML via npm run convert)
  fonts/         — Church Slavonic fonts
  icons/         — PWA icons
```

## License

Same as the original Java project.
