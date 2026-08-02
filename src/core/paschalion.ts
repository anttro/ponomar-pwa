/**
 * Paschalion — Orthodox Church paschal and feast day computations.
 * Faithful port of Ponomar/Paschalion.java to TypeScript.
 *
 * Paschalion.java is part of the Ponomar program.
 * Copyright 2006, 2007 Aleksandr Andreev.
 * GPL v3 — see LICENSE.
 */

import { JDate } from './jdate';

const LUNAR_MONTH = 29.52916667;

/** Age of the moon on March 1 for each year in the 19-year Metonic cycle (days). */
export const FOUNDATION = [
  14.042016807, 25.462184874, 6.084033613, 17.966386555, 28.336134454,
  9.210084034, 20.504201681, 1.420168067, 12.294117647, 23.168067227,
  4.546218487, 15.042016807, 26.294117647, 7.630252101, 18.546218487,
  29.420168067, 11.756302521, 26.210084034, 3.042016807,
];

/** 1-based modulo. If result is 0, returns divisor. */
function mod1(divisor: number, modulo: number): number {
  let temp = divisor % modulo;
  if (temp === 0) temp = modulo;
  return temp;
}

/** Modulo for decimal numbers. */
function modF(divisor: number, modulo: number): number {
  return divisor - Math.floor(divisor / modulo) * modulo;
}

export const Paschalion = {
  /**
   * Get the date of Julian Pascha (Easter) for a given year.
   * Uses Gaussian Easter formulae.
   */
  getPascha(year: number): JDate {
    if (year < 33) throw new Error('Invalid year');
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31); // 3=March, 4=April
    const day = ((d + e + 114) % 31) + 1;
    return new JDate(month, day, year);
  },

  /** Pentecost: Pascha + 49 days. */
  getPentecost(year: number): JDate {
    return this.getPascha(year).addDays(49);
  },

  /** Clean Monday (Great Lent starts): Pascha - 48 days. */
  getLentStart(year: number): JDate {
    return this.getPascha(year).subtractDays(48);
  },

  /** Apostles' Fast starts: Pascha + 57 days (Monday after All Saints). */
  getApostlesFastStart(year: number): JDate {
    return this.getPascha(year).addDays(57);
  },

  /** Length of Apostles' Fast in days. Ends June 28 (Julian). */
  getApostlesFastLength(year: number): number {
    const start = this.getApostlesFastStart(year);
    const end = new JDate(6, 28, year);
    return end.difference(start);
  },

  /** Key of Boundaries (Ключ границ) — letter of the Paschal boundary. 1-30. */
  getKeyOfBoundaries(year: number): number {
    const date = this.getPascha(year);
    const m = date.getMonth();
    let g = date.getDay();
    if (m === 3) {
      g -= 21;
    } else {
      g += 10;
    }
    return g;
  },

  /** Indiction cycle. */
  getIndiction(year: number): number {
    if (year < 33) throw new Error('Invalid year');
    return mod1(year - 312, 15);
  },

  /** Solar cycle. */
  getSolarCycle(year: number): number {
    if (year < 33) throw new Error('Invalid year');
    return mod1(year + 5508, 28);
  },

  /** Lunar cycle (1-19). */
  getLunarCycle(year: number): number {
    if (year < 33) throw new Error('Invalid year');
    let temp = (year + 1) % 19 - 3;
    if (temp <= 0) temp += 19;
    return temp;
  },

  /** Lunar phase for a date: 0=new moon, 0.5=full moon. */
  getLunarPhase(date: JDate): number {
    const year = date.getYear();
    const cycle = this.getLunarCycle(year);
    let diff = date.difference(new JDate(3, 1, year));
    if (diff < 0) {
      diff = date.difference(new JDate(3, 1, year - 1));
    }
    let remainder = modF(diff, LUNAR_MONTH);
    remainder += FOUNDATION[cycle - 1];
    while (remainder >= LUNAR_MONTH) {
      remainder -= LUNAR_MONTH;
    }
    return remainder / LUNAR_MONTH;
  },

  /**
   * Annual fasting array: 0=no fast, 1=fast day, 2=cheesefare.
   * One entry per day of the year (index 0=Jan 1).
   */
  getFasts(year: number): number[] {
    if (year < 33) throw new Error('Invalid year');

    const pascha = this.getPascha(year);
    const numDays = (year % 4 === 0) ? 366 : 365;

    // Mandatory fast days (JDN → reason string)
    const mustFast = new Set<number>();
    mustFast.add(new JDate(1, 5, year).jdn);
    mustFast.add(new JDate(8, 29, year).jdn);
    mustFast.add(new JDate(9, 14, year).jdn);

    // Mandatory fast-free days
    const cantFast = new Set<number>();
    cantFast.add(new JDate(1, 6, year).jdn);

    // Period boundaries
    const SVIATKI_START = new JDate(12, 25, year);
    const SVIATKI_END = new JDate(1, 4, year);
    const PUB_PHAR_START = pascha.subtractDays(70);
    const PUB_PHAR_END = pascha.subtractDays(63);
    const CHEESE_START = pascha.subtractDays(55);
    const CHEESE_END = pascha.subtractDays(49);
    const LENT_START = pascha.subtractDays(48);
    const LENT_END = pascha.subtractDays(1);
    const BRIGHT_START = pascha;
    const BRIGHT_END = pascha.addDays(6);
    const PENT_START = pascha.addDays(49);
    const PENT_END = pascha.addDays(56);
    const APOSTLES_START = pascha.addDays(57);
    const APOSTLES_END = new JDate(6, 28, year);
    const DORM_START = new JDate(8, 1, year);
    const DORM_END = new JDate(8, 14, year);
    const ADVENT_START = new JDate(11, 15, year);
    const ADVENT_END = new JDate(12, 24, year);

    const retval = new Array<number>(numDays);
    let dummy = new JDate(1, 1, year);

    for (let i = 0; i < numDays; i++) {
      let fast = 0;
      const jdn = dummy.jdn;

      if (mustFast.has(jdn)) {
        fast = 1;
      } else if (cantFast.has(jdn)) {
        fast = 0;
      } else if (dummy.compareTo(SVIATKI_START) >= 0 || dummy.compareTo(SVIATKI_END) <= 0) {
        fast = 0;
      } else if (dummy.compareTo(PUB_PHAR_START) >= 0 && dummy.compareTo(PUB_PHAR_END) <= 0) {
        fast = 0;
      } else if (dummy.compareTo(CHEESE_START) >= 0 && dummy.compareTo(CHEESE_END) <= 0) {
        fast = 2;
      } else if (dummy.compareTo(LENT_START) >= 0 && dummy.compareTo(LENT_END) <= 0) {
        fast = 1;
      } else if (dummy.compareTo(BRIGHT_START) >= 0 && dummy.compareTo(BRIGHT_END) <= 0) {
        fast = 0;
      } else if (dummy.compareTo(PENT_START) >= 0 && dummy.compareTo(PENT_END) <= 0) {
        fast = 0;
      } else if (dummy.compareTo(APOSTLES_START) >= 0 && dummy.compareTo(APOSTLES_END) <= 0) {
        fast = 1;
      } else if (dummy.compareTo(DORM_START) >= 0 && dummy.compareTo(DORM_END) <= 0) {
        fast = 1;
      } else if (dummy.compareTo(ADVENT_START) >= 0 && dummy.compareTo(ADVENT_END) <= 0) {
        fast = 1;
      } else {
        const dow = dummy.getDayOfWeek();
        if (dow === 3 || dow === 5) fast = 1;
      }

      retval[i] = fast;
      dummy = dummy.addDays(1);
    }

    return retval;
  },

  /**
   * Major feasts for the year.
   * Returns Map< JDN, feastName >.
   */
  getFeasts(year: number): Map<number, string> {
    if (year < 33) throw new Error('Invalid year');

    const feastNames = [
      'New Year', 'Theophany', 'Nativity of the Forerunner',
      'Peter and Paul', 'Transfiguration', 'Dormition',
      'Beheading of the Forerunner', 'Nativity of the Theotokos',
      'Exaltation of the Cross', 'Protection of the Theotokos',
      'Entrance of the Theotokos', 'Nativity of Christ',
      'Pascha and Annunciation', 'Pascha', 'Annunciation',
      'Pentecost', 'Ascension', 'Palm Sunday', 'Meeting of the Lord',
    ];

    const feasts = new Map<number, string>();

    // Fixed feasts
    feasts.set(new JDate(1, 1, year).jdn, feastNames[0]);
    feasts.set(new JDate(1, 6, year).jdn, feastNames[1]);
    feasts.set(new JDate(6, 24, year).jdn, feastNames[2]);
    feasts.set(new JDate(6, 29, year).jdn, feastNames[3]);
    feasts.set(new JDate(8, 6, year).jdn, feastNames[4]);
    feasts.set(new JDate(8, 15, year).jdn, feastNames[5]);
    feasts.set(new JDate(8, 29, year).jdn, feastNames[6]);
    feasts.set(new JDate(9, 8, year).jdn, feastNames[7]);
    feasts.set(new JDate(9, 14, year).jdn, feastNames[8]);
    feasts.set(new JDate(10, 1, year).jdn, feastNames[9]);
    feasts.set(new JDate(11, 21, year).jdn, feastNames[10]);
    feasts.set(new JDate(12, 25, year).jdn, feastNames[11]);

    // Moveable feasts
    const pascha = this.getPascha(year);
    if (pascha.equals(new JDate(3, 25, year))) {
      feasts.set(pascha.jdn, feastNames[12]);
    } else {
      feasts.set(pascha.jdn, feastNames[13]);
      feasts.set(new JDate(3, 25, year).jdn, feastNames[14]);
    }
    feasts.set(pascha.addDays(49).jdn, feastNames[15]);
    feasts.set(pascha.addDays(39).jdn, feastNames[16]);
    feasts.set(pascha.subtractDays(7).jdn, feastNames[17]);

    // Meeting of the Lord — Feb 2, but transferred to Forgiveness Sunday if it falls on Clean Monday
    let meeting = new JDate(2, 2, year);
    if (pascha.difference(meeting) === 48) {
      meeting = meeting.subtractDays(1);
    }
    feasts.set(meeting.jdn, feastNames[18]);

    return feasts;
  },
};
