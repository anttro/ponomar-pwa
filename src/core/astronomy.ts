/**
 * Astronomical calculations for sunrise/sunset times and moon phase.
 * All calculations are client-side, no external APIs required.
 *
 * Sunrise/sunset algorithm based on NOAA Solar Calculator.
 * Moon phase uses the existing Paschalion lunar calculation.
 */

import { JDate } from './jdate';
import { Paschalion } from './paschalion';
import { FOUNDATION } from './paschalion';

/** Result of sunrise/sunset calculation for a given day. */
export interface SolarTimes {
  sunrise: string; // "06:34"
  sunset: string;  // "20:15"
}

/** Moon phase info for a given day. */
export interface LunarInfo {
  phase: number;        // 0–1 (0=new, 0.5=full)
  emoji: string;        // 🌑🌒🌓🌔🌕🌖🌗🌘
  name: string;         // localized phase name (set by caller)
  illumination: number; // 0–100 (percentage visible)
  trend: 'waxing' | 'waning';
  moonDay: number;      // day of the lunar cycle (1-30)
}

/** Convert moon phase (0-1) to a simple fraction string. */
export function phaseToFraction(phase: number): string {
  const dist = Math.min(phase, 1 - phase); // distance from new or full
  const fracs: [number, string][] = [
    [0.0, '0'], [0.0625, '1/16'], [0.125, '1/8'], [0.1875, '3/16'],
    [0.25, '1/4'], [0.3125, '5/16'], [0.375, '3/8'], [0.4375, '7/16'],
    [0.5, '1/2'], [0.5625, '9/16'], [0.625, '5/8'], [0.6875, '11/16'],
    [0.75, '3/4'], [0.8125, '13/16'], [0.875, '7/8'], [0.9375, '15/16'], [1.0, '1'],
  ];
  for (const [threshold, label] of fracs) {
    if (Math.abs(dist - threshold) < 0.032) return label;
  }
  return '—';
}

/**
 * Calculate sunrise and sunset times for a given Julian date and location.
 * @param jdate  Julian date (time is treated as noon)
 * @param lat    Latitude in degrees (north positive)
 * @param lon    Longitude in degrees (east positive)
 * @param tz     Timezone offset from UTC in hours (default: 3 for Moscow)
 */
export function calcSolarTimes(jdate: JDate, lat: number, lon: number, tz: number = 3): SolarTimes | null {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  // Julian Day Number at noon (UT)
  const jdn = jdate.jdn + 0.5;

  // Julian centuries since J2000.0
  const T = (jdn - 2451545.0) / 36525;

  // Solar mean anomaly (degrees)
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;

  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(degToRad(M))
    + (0.019993 - 0.000101 * T) * Math.sin(degToRad(2 * M))
    + 0.000289 * Math.sin(degToRad(3 * M));

  // Ecliptic longitude (degrees)
  const lambda = M + C + 180 + 102.9372; // +180 for true longitude, +102.9372 for perihelion

  // Obliquity of ecliptic
  const epsilon = 23.439291 - 0.0130042 * T;

  // Solar declination (degrees)
  const sinEcl = Math.sin(degToRad(epsilon));
  const ySin = sinEcl * Math.sin(degToRad(lambda));
  const dec = radToDeg(Math.asin(ySin));

  // Equation of time (minutes)
  const y = Math.tan(degToRad(epsilon / 2));
  const y2 = y * y;
  const sin2L = Math.sin(degToRad(2 * lambda));
  const sinM = Math.sin(degToRad(M));
  const cos2L = Math.cos(degToRad(2 * lambda));
  const cos2M = Math.cos(degToRad(2 * M));
  const EoT = 4 * radToDeg(
    y2 * sin2L - 2 * y * sinM + 4 * y * y2 * sinM * cos2L
    - 0.5 * y2 * y2 * cos2L - 1.25 * y2 * cos2M
  );

  // Hour angle (degrees) — cosH = (sin(-0.833) - sin(lat)*sin(dec)) / (cos(lat)*cos(dec))
  const latRad = degToRad(lat);
  const decRad = degToRad(dec);
  const cosH = (Math.sin(degToRad(-0.833)) - Math.sin(latRad) * Math.sin(decRad))
    / (Math.cos(latRad) * Math.cos(decRad));

  // Check for polar day/night
  if (cosH < -1) return { sunrise: '—', sunset: '—' }; // polar night (sun never rises)
  if (cosH > 1) return { sunrise: '—', sunset: '—' };  // midnight sun (sun never sets)

  const H = radToDeg(Math.acos(cosH));

  // UTC time of sunrise/sunset (hours)
  const sunriseUTC = 12 - H / 15 - EoT / 60 - lon / 15;
  const sunsetUTC = 12 + H / 15 - EoT / 60 - lon / 15;

  // Convert to local timezone
  const sunriseLocal = sunriseUTC + tz;
  const sunsetLocal = sunsetUTC + tz;

  // Format as HH:MM
  const fmt = (hours: number): string => {
    const h = Math.floor(((hours % 24) + 24) % 24);
    const m = Math.floor((hours - Math.floor(hours)) * 60 + 0.5);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return {
    sunrise: fmt(sunriseLocal),
    sunset: fmt(sunsetLocal),
  };
}

/**
 * Calculate ecclesiastical moon day using the foundation (age on March 1)
 * and alternating 29/30-day months.
 * Returns 1-based day of the current lunar cycle (1-30).
 */
function calcMoonDay(jdate: JDate): number {
  const year = jdate.getYear();
  const cycle = Paschalion.getLunarCycle(year);
  const foundation = FOUNDATION[cycle - 1];

  // Days from March 1 to the target date
  const march1 = new JDate(3, 1, year);
  let diff = jdate.difference(march1);
  if (diff < 0) {
    // Date is before March 1 — use previous year's foundation
    const prevCycle = cycle === 1 ? 19 : cycle - 1;
    const prevFoundation = FOUNDATION[prevCycle - 1];
    const prevMarch1 = new JDate(3, 1, year - 1);
    const diffFromPrevMarch = jdate.difference(prevMarch1);
    const adjusted = 29.53 * 12 + diffFromPrevMarch; // ~354 days for 12 lunar months
    let total = prevFoundation + adjusted;
    // Subtract full lunar cycles (alternating 29/30, starting with 29)
    const ml = (idx: number) => (idx % 2 === 0) ? 29 : 30;
    let monthIdx = 0;
    while (total >= ml(monthIdx)) { total -= ml(monthIdx); monthIdx++; }
    return Math.floor(total) + 1;
  }

  let total = foundation + diff;

  // Subtract alternating 29/30-day months (starting with 29)
  const monthLen = (idx: number) => (idx % 2 === 0) ? 29 : 30;
  let monthIdx = 0;
  while (total >= monthLen(monthIdx)) {
    total -= monthLen(monthIdx);
    monthIdx++;
  }

  return Math.floor(total) + 1;
}

/** Moon phase info for a given Julian date. */
export function getMoonInfo(jdate: JDate): LunarInfo {
  const phase = Paschalion.getLunarPhase(jdate);
  const trend = phase < 0.5 ? 'waxing' : 'waning';
  const moonDay = calcMoonDay(jdate);

  // Map phase (0-1) to emoji (0=new, 0.5=full)
  let emoji: string;
  if (phase < 0.0625) emoji = '🌑';  // new
  else if (phase < 0.1875) emoji = '🌒';  // waxing crescent
  else if (phase < 0.3125) emoji = '🌓';  // first quarter
  else if (phase < 0.4375) emoji = '🌔';  // waxing gibbous
  else if (phase < 0.5625) emoji = '🌕';  // full
  else if (phase < 0.6875) emoji = '🌖';  // waning gibbous
  else if (phase < 0.8125) emoji = '🌗';  // last quarter
  else if (phase < 0.9375) emoji = '🌘';  // waning crescent
  else emoji = '🌑';  // new

  // Illumination (0–100%)
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase)) / 2 * 100);

  return { phase, emoji, name: '', illumination, trend, moonDay };
}

/** Phase names keyed by phase bucket (0=new, 1-7 for other phases). */
export function getMoonPhaseName(phase: number, lang: string): string {
  const names: Record<string, string[]> = {
    en: ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
         'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'],
    ru: ['Новолуние', 'Растущий серп', 'Первая четверть', 'Растущая луна',
         'Полнолуние', 'Убывающая луна', 'Последняя четверть', 'Убывающий серп'],
    cu: ['Новолу́нїе', 'Растꙋ́щїй се́рпъ', 'Пе́рваѧ че́тверть', 'Растꙋ́щаѧ лꙋна̀',
         'Полнолу́нїе', 'Оу҆быва́ющаѧ лꙋна̀', 'Послѣ́днѧѧ че́тверть', 'Оу҆быва́ющїй се́рпъ'],
  };
  const list = names[lang] || names.en;
  const index = Math.round(phase * 8) % 8;
  return list[index];
}

function degToRad(d: number): number { return d * Math.PI / 180; }
function radToDeg(r: number): number { return r * 180 / Math.PI; }