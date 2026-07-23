# Ponomar — Orthodox Calendar PWA

A Progressive Web App for Orthodox Church calendar, liturgical services, and Bible readings.

Derived from the original [Java Ponomar application](https://github.com/typiconman/ponomar) by Aleksandr Andreev and [Sergei F.](https://github.com/typiconman).

**Demo:** <https://ponomar.atroshin.ru>

## Features

- **Calendar** — View month grids with liturgical days, fasting periods, ranks, and commemorations. Supports Julian calendar with Gregorian equivalents.
- **Service Reader** — Assembles liturgical services (Hours, Vespers, Matins, Liturgy) from structured XML templates with conditional logic.
- **Bible Reader** — Read scripture across 13 versions (Church Slavonic, Russian Synodal, KJV, Brenton, Vulgate, etc.). Per-version reading position persists across sessions.
- **Multi-language UI** — English, Russian, Church Slavonic (with dedicated Slavonic fonts).
- **PWA** — Installable on desktop and mobile devices.

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/) — fully typed
- [Vite](https://vitejs.dev/) — build tool
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) — service XML conversion

## Getting Started

```bash
npm install
npm run dev
```

The data conversion from the Java project's XML sources happens automatically as part of the build. Point the conversion script at your local clone of the Java Ponomar repository by setting `PONOMAR_JAVA_HOME` (defaults to `../ponomar`).

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
scripts/         — XML-to-JSON conversion tools
static/
  data/          — Generated liturgical data (not committed, built from Java XML)
  fonts/         — Church Slavonic fonts
  icons/         — PWA icons
```

## License

Same as the original Java project.
