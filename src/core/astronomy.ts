/**
 * Astronomical calculations for sunrise/sunset times and moon phase.
 * All calculations are client-side, no external APIs required.
 *
 * Sunrise/sunset algorithm based on NOAA Solar Calculator.
 * Moon phase uses the existing Paschalion lunar calculation.
 */

import { JDate } from './jdate';
import { Paschalion } from './paschalion';

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

/** Moon phase info for a given Julian date. */
export function getMoonInfo(jdate: JDate): LunarInfo {
  const phase = Paschalion.getLunarPhase(jdate);

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

  return { phase, emoji, name: '', illumination };
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