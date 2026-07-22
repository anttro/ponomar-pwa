/**
 * JDate — Julian calendar date engine.
 * Faithful port of Ponomar/JDate.java to TypeScript.
 * All dates are Julian calendar. Internally stored as Julian Day Number (JDN).
 *
 * JDate.java is part of the Ponomar program.
 * Copyright 2006, 2007 Aleksandr Andreev.
 * GPL v3 — see LICENSE.
 */

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_IN_MONTH_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 1-based modulo. If result is 0, returns divisor.
 * Matches Java JDate.mod() exactly.
 */
function mod1(divisor: number, modulo: number): number {
  let temp = divisor % modulo;
  if (temp === 0) temp = modulo;
  return temp;
}

export class JDate {
  readonly jdn: number;

  /** Create from Julian month/day/year. */
  constructor(monthOrJdn: number, day?: number, year?: number) {
    if (day === undefined && year === undefined) {
      // Constructor from JDN
      this.jdn = monthOrJdn;
      return;
    }

    const month = monthOrJdn;
    if (month < 1 || month > 12) throw new Error(`Invalid month: ${month}`);
    if (day! < 0) throw new Error(`Invalid day: ${day}`);

    const leap = year! % 4 === 0;
    const maxDays = leap ? DAYS_IN_MONTH_LEAP[month - 1] : DAYS_IN_MONTH[month - 1];
    if (day! > maxDays) throw new Error(`Invalid day ${day} for month ${month} (year ${year})`);

    // Fliegel-Van Flandern formula (Julian calendar)
    const a = Math.floor((14 - month) / 12);
    const y = year! + 4800 - a;
    const m = month + 12 * a - 3;
    this.jdn = day! + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }

  /** Create from JavaScript Date (Gregorian). Converts to Julian calendar. */
  static fromGregorian(date: Date): JDate {
    return JDate.fromGregorianParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  /** Create from Gregorian year/month/day. */
  static fromGregorianParts(gYear: number, gMonth: number, gDay: number): JDate {
    const a = Math.floor((14 - gMonth) / 12);
    const y = gYear + 4800 - a;
    const m = gMonth + 12 * a - 3;
    const jd = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    return new JDate(jd);
  }

  /** Create from today's date. */
  static today(): JDate {
    return JDate.fromGregorian(new Date());
  }

  /** Get year (Julian calendar). */
  getYear(): number {
    const jbar = this.jdn + 32083;
    const n1 = Math.floor(jbar / 1461) * 4;
    const n2 = Math.floor((jbar % 1461) / 365);
    const da = jbar % 1461;
    const adj = (da % 365) > 306 ? 1 : 0;
    return Math.floor(n1 + n2) - 4800 + adj;
  }

  /** Get month (1=Jan ... 12=Dec, Julian calendar). */
  getMonth(): number {
    const jbar = this.jdn + 32083;
    const da = jbar % 1461;
    let m = mod1(da, 365);
    let j = 2;
    while (m > DAYS_IN_MONTH_LEAP[j]) {
      m -= DAYS_IN_MONTH_LEAP[j];
      j++;
      if (j === 12) j = 0;
    }
    return j + 1;
  }

  /** Get day of month (Julian calendar). */
  getDay(): number {
    const jbar = this.jdn + 32083;
    const da = mod1(jbar, 1461);
    if (da === 1461) return 29; // Feb 29
    let m = mod1(da, 365);
    let k = 2;
    while (m > DAYS_IN_MONTH[k]) {
      m -= DAYS_IN_MONTH[k];
      k++;
      if (k === 12) k = 0;
    }
    return m;
  }

  /** Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday. */
  getDayOfWeek(): number {
    let temp = (this.jdn % 7) + 1;
    if (temp === 7) temp = 0;
    return temp;
  }

  /** Day of year: 0=Jan 1, ..., 364/365=Dec 31. */
  getDoy(): number {
    const jbar = this.jdn + 32083;
    const da = jbar % 1461;
    return da === 1461 ? 366 : mod1(da + 59, 365) - 1;
  }

  /** Convert to JavaScript Date (Gregorian calendar). */
  toGregorian(): Date {
    let j1: number;
    if (this.jdn >= 2299160.5) {
      const tmp = Math.floor(((this.jdn - 1867216.0) - 0.25) / 36524.25);
      j1 = this.jdn + 1 + tmp - Math.floor(0.25 * tmp);
    } else {
      j1 = this.jdn;
    }
    const j2 = j1 + 1524.0;
    const j3 = Math.floor(6680.0 + ((j2 - 2439870.0) - 122.1) / 365.25);
    const j4 = Math.floor(j3 * 365.25);
    const j5 = Math.floor((j2 - j4) / 30.6001);
    let d = Math.floor(j2 - j4 - Math.floor(j5 * 30.6001));
    let m = Math.floor(j5 - 1.0);
    if (m > 12) m -= 12;
    let y = Math.floor(j3 - 4715.0);
    if (m > 2) --y;
    if (y <= 0) --y;
    return new Date(y, m - 1, d);
  }

  /** Days to add to get to another date. Positive if this > other. */
  difference(other: JDate): number {
    return this.jdn - other.jdn;
  }

  /** Add n days, returning a new JDate. */
  addDays(n: number): JDate {
    return new JDate(this.jdn + n);
  }

  /** Subtract n days, returning a new JDate. */
  subtractDays(n: number): JDate {
    return new JDate(this.jdn - n);
  }

  /** Days in month for this date's month/year. */
  static maxDaysInMonth(month: number, year: number): number {
    return (year % 4 === 0) ? DAYS_IN_MONTH_LEAP[month - 1] : DAYS_IN_MONTH[month - 1];
  }

  equals(other: JDate): boolean {
    return this.jdn === other.jdn;
  }

  compareTo(other: JDate): number {
    return this.jdn - other.jdn;
  }

  toString(): string {
    const y = this.getYear();
    const m = this.getMonth();
    const d = this.getDay();
    return `${m < 10 ? '0' + m : m}/${d < 10 ? '0' + d : d}/${y}`;
  }

  /** Clone — returns a new JDate with the same JDN. */
  clone(): JDate {
    return new JDate(this.jdn);
  }
}
