/**
 * Shared type definitions for the Ponomar liturgical engine.
 */

/** All liturgical variables computed for a given day. */
export interface DayInfo {
  // Date components
  dow: number;        // Day of week (0=Sun, 1=Mon, ..., 6=Sat)
  doy: number;        // Day of year (0=Jan 1)
  month: number;      // Julian calendar month (1-12)
  day: number;        // Day of month
  year: number;       // Julian calendar year

  // Paschal cycle
  nday: number;       // Days from this year's Pascha (- before, 0 = Pascha, + after)
  ndayP: number;      // Days from last year's Pascha
  ndayF: number;      // Days to next year's Pascha (negative before, 0 at next Pascha)
  Easter: number;     // JDN of this year's Pascha
  Pentecost: number;  // JDN of this year's Pentecost
  LentStart: number;  // JDN of Clean Monday

  // Liturgical state
  Tone: number;       // Current Octoechos tone (1-8, -1 = none)
  dRank: number;      // Liturgical rank (0-8, higher = more important)
  PFlag: number;      // Paschal flag
  PFlag1: number;     // Service inclusion flag
  PFlag2: number;     // Service type (0=Normal, 1=Lenten, 2=Holy Week/Bright Week)
  PS: number;         // Priest status (0=Reader, 1=Priest)

  // Seasonal flags
  isLent: boolean;
  isBrightWeek: boolean;
  isApostlesFast: boolean;
  isDormitionFast: boolean;
  isNativityFast: boolean;

  // Data file references
  triodionFile: number | null;    // Index in triodion (1-70)
  pentecostarionFile: number | null; // Index in pentecostarion (1-315)
  eothinon: number;               // Sunday Matins Eothinon (1-11, 0 = none)
}

/** A single sub-canon within an ode. */
export interface CanonSubCanon {
  irmos: string;
  troparia: string[];
  theotokion: string;
}

/** A single ode within a Matins canon. */
export interface CanonOde {
  ode: number;             // Ode number (1,3,4,5,6,7,8,9)
  canons: CanonSubCanon[]; // Sub-canons per ode
}

/** Matins canon data for a given tone. */
export interface CanonData {
  tone: number;
  odes: CanonOde[];
}

/** A single ode within the Great Canon of St. Andrew. */
export interface GreatCanonOde {
  ode: number;             // 1-9 (includes Ode 2)
  irmos: string;
  troparia: string[];      // Penitential troparia
  trinityTroparion: string;
  theotokion: string;
  kontakion?: string;      // After Ode 6: "Душе моя..."
  saintTroparia?: string[]; // Troparia to St. Mary of Egypt / St. Andrew
}

/** One part of the Great Canon (divided across the 1st week). */
export interface GreatCanonPart {
  part: number;            // 1-4 for first week
  title: string;
  odes: GreatCanonOde[];
}

/** Expression evaluator variable store. */
export type EvalContext = Record<string, number>;

/** A saint/feast commemoration entry from monthly day XML. */
export interface Commemoration {
  sIds: string[];     // Saint IDs (comma-separated in source)
  cId: string;        // Commemoration ID (points to lives/{cId}.xml)
  src?: string;       // Source: G=Greek, R=Russian, U=Unsourced
  tone?: string;      // Tone expression (evaluated at runtime)
  cmd?: string;       // Conditional expression
}

/** A day's worth of commemoration data. */
export interface DayData {
  commemorations: Commemoration[];
}

/** Saint life data (from lives/{cId}.xml). */
export interface SaintData {
  name?: {
    nominative: string;
    short?: string;
    genitive?: string;
  };
  grammar?: Record<string, string>;
  rank?: number;
  life?: {
    text: string;
    id?: string;
    copyright?: string;
  };
  services?: Record<string, ServiceData>;
  troparion?: { tone: number; text: string }[];
  kontakion?: { tone: number; text: string }[];
  scriptures?: { type: string; reading: string }[];
  icon?: string;
}

/** Service data within a saint's life file. */
export interface ServiceData {
  [path: string]: Record<string, { text: string; [key: string]: string }>;
}

/** Fasting rule for a day. */
export interface FastingInfo {
  level: FastingLevel;
  description: string;
  meatFree: boolean;
  fishPermitted: boolean;
  caviarPermitted: boolean;
  oilPermitted: boolean;
  winePermitted: boolean;
  strictFast: boolean;
  noFood: boolean;
}

export enum FastingLevel {
  NoFast = 0,
  WineAndOil = 1,
  Xerophagy = 2,
  StrictWithOil = 3,
  Strict = 4,
  CompleteFast = 5,
}

/** Service template node — dynamic JSON from converted XML. */
export interface ServiceNode {
  type: string;
  [key: string]: unknown;
}

/** Service rules for a given liturgical period. */
export interface ServiceRule {
  cmd: string;
  services: Record<string, ServiceTypeConfig>;
}

export interface ServiceTypeConfig {
  type: string;
  troparion?: string;
  pickT?: number;
  kontakion?: string;
  pickK?: number;
  lentenk?: number;
}

/** Bible translation metadata. */
export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  books: BibleBook[];
  info: BibleInfo;
}

export interface BibleBook {
  id: string;
  name: string;
  chapters: number;
  short: string;
  intro?: string;
}

export interface BibleInfo {
  verseNumFormat: string;
  verseNoNumFormat: string;
  verseLink: string;
  abbrevFormat: string;
  chapterN: string;
  headerFormat: string;
  chapterNI: string;
  verseNo: string[];
  chapterNo: string[];
  cvSep: string;
  duration: string;
  selectionSeparator: string;
  bcSep: string;
  fontFace: string;
  fontSize: number;
  parts: string;
  orient: string;
}

/** Language info. */
export type LanguageCode = 'en' | 'ru' | 'cu';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nameLocal: string;
  dir: 'ltr' | 'rtl';
  fontFace: string;
  liturgicalFont: string;
  liturgicalSize: number;
}

/** Fasting rule from Fasting.xml. */
export interface FastingRule {
  case: string;   // 7-bit binary string
  cmd: string;    // boolean expression
}

/** Fasting period from Fasting.xml. */
export interface FastingPeriod {
  cmd: string;
  rules: FastingRule[];
}
