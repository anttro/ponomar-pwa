/**
 * Day Computer — computes all liturgical variables for a given Julian date.
 * Replaces the core of Main.write() in the Java version.
 */

import { JDate } from './jdate';
import { Paschalion } from './paschalion';
import type { EvalContext, DayInfo } from './types';

export interface ComputedDay {
  jdate: JDate;
  gregorian: Date;
  evalContext: EvalContext;
  dayInfo: DayInfo;
}

/**
 * Compute all liturgical variables for a given Julian date.
 * Returns both the EvalContext (for expression evaluator) and structured DayInfo.
 */
export function computeDay(date: JDate): ComputedDay {
  const year = date.getYear();
  const dow = date.getDayOfWeek();
  const doy = date.getDoy();
  const month = date.getMonth();
  const day = date.getDay();

  const gregorian = date.toGregorian();

  // Paschal distances
  const pascha = Paschalion.getPascha(year);
  const nday = date.difference(pascha);
  const ndayP = date.difference(Paschalion.getPascha(year - 1));
  const ndayF = date.difference(Paschalion.getPascha(year + 1));

  const pentecost = Paschalion.getPentecost(year);
  const lentStart = Paschalion.getLentStart(year);

  // Determine file indices for triodion/pentecostarion
  let triodionFile: number | null = null;
  let pentecostarionFile: number | null = null;

  if (nday >= -70 && nday < 0) {
    // Great Lent period — triodion
    triodionFile = Math.abs(nday);
  } else if (nday < -70) {
    // Before Lent — pentecostarion from last year
    const lastPascha = Paschalion.getPascha(year - 1);
    pentecostarionFile = date.difference(lastPascha) + 1;
  } else {
    // After Pascha — pentecostarion
    pentecostarionFile = nday + 1;
  }

  // Determine liturgical state
  const isLent = nday >= -48 && nday < 0;
  const isBrightWeek = nday >= 0 && nday <= 6;
  const isApostlesFast = nday >= 57 && nday <= Paschalion.getApostlesFastLength(year);
  const isDormitionFast = month === 8 && day >= 1 && day <= 14;
  const isNativityFast = (month === 11 && day >= 15) || (month === 12 && day <= 24);

  // Tone computation — 8-week cycle after Pentecost
  // Matches Java pentecostarion XML: tone = (⌊(nday - 7) / 7⌋ % 8) + 1
  // Exceptions: Ascension (nday 39-40) and Pentecost week (nday 48-55) have no tone
  let tone = -1;
  if (nday >= 7) {
    if ((nday >= 39 && nday <= 40) || (nday >= 48 && nday <= 55)) {
      tone = -1; // Ascension or Pentecost week — no octoechos tone
    } else {
      tone = (Math.floor((nday - 7) / 7) % 8) + 1;
    }
  }

  // Rank computation
  let dRank = 0;
  // Major feasts get higher rank
  if (month === 9 && day === 14) dRank = 6; // Exaltation
  else if (month === 8 && day === 29) dRank = 6; // Beheading
  else if (nday === 0) dRank = 8; // Pascha
  else if (nday === 49) dRank = 8; // Pentecost
  else if (nday === 39) dRank = 8; // Ascension
  else if (nday === -7) dRank = 8; // Palm Sunday
  else if (month === 12 && day === 25) dRank = 6; // Nativity
  else if (month === 1 && day === 6) dRank = 6; // Theophany
  else if (month === 8 && day === 15) dRank = 6; // Dormition
  else if (month === 3 && day === 25) dRank = 6; // Annunciation
  else if (nday >= -48 && nday < 0) dRank = 3; // Lent
  else if (isBrightWeek || nday >= 49 && nday <= 56) dRank = 5; // Bright/Pentecost week

  // Paschal flag
  const PFlag = nday >= 0 ? 1 : 0;
  const PFlag1 = 1; // Default service inclusion
  const PFlag2 = isBrightWeek || (nday >= -7 && nday < 0) ? 2 : (isLent && dow !== 0 ? 1 : 0);

  // Priest status (1 = priest required, 0 = reader)
  const PS = (dRank >= 3 || dow === 0) ? 1 : 0;

  // Eothinon (Sunday Matins Gospel cycle, 1-11)
  // Based on weeks after Pascha: (⌊nday / 7⌋ % 11) + 1 for Sundays
  // Non-Sundays get 0
  let eothinon = 0;
  if (dow === 0 && nday >= 0) {
    eothinon = (Math.floor(nday / 7) % 11) + 1;
  }

  const dayInfo: DayInfo = {
    dow,
    doy,
    month,
    day,
    year,
    nday,
    ndayP,
    ndayF,
    Easter: pascha.jdn,
    Pentecost: pentecost.jdn,
    LentStart: lentStart.jdn,
    Tone: tone,
    dRank,
    PFlag,
    PFlag1,
    PFlag2,
    PS,
    isLent,
    isBrightWeek,
    isApostlesFast,
    isDormitionFast,
    isNativityFast,
    triodionFile,
    pentecostarionFile,
    eothinon,
  };

  // Build EvalContext from DayInfo (all values as numbers for the expression evaluator)
  const evalContext: EvalContext = {
    dow,
    doy,
    nday,
    ndayP,
    ndayF,
    Year: year,
    dRank,
    PFlag,
    PFlag1,
    PFlag2,
    PS,
    Tone: tone,
    Easter: pascha.jdn,
    Pentecost: pentecost.jdn,
    LentStart: lentStart.jdn,
    eothinon,
    LS: 1, // Default language
    GS: 1, // Default gospel selector
  };

  return { jdate: date, gregorian, evalContext, dayInfo };
}
