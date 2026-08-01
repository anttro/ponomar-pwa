/**
 * Tab definitions for the Services view.
 * Centralized so the UI (service-view.ts) and the QA validators
 * (scripts/validate-tabs.ts) share a single source of truth.
 *
 * The `template` field must match the exact file base name in
 * static/data/shared/services/templates/ (PascalCase), and `id` must
 * be a key of t.services.serviceNames / serviceDescriptions.
 */

export interface ServiceTabDef {
  /** stable id + i18n key (t.services.serviceNames / serviceDescriptions) */
  id: string;
  serviceType: string;
  /** exact template file base name: templates/{template}.json */
  template: string;
  /** data dir under static/data/shared/services/ (var-backed services) */
  dir?: string;
  /**
   * exact Var node name the template GETs (e.g. "IParalytic").
   * Defaults to P{template}; some templates use the "I" prefix.
   */
  varKey?: string;
}

/** Pre-Lent / Lent movable days: nday -> triodion index (triodion/{NN}.json) */
export const TRIODION_NDAY: Record<number, number> = {
  [-70]: 1,  // Sunday of the Publican and the Pharisee
  [-63]: 2,  // Sunday of the Prodigal Son
  [-57]: 3,  // Meat-fare Saturday
  [-56]: 4,  // Meat-fare Sunday
  [-50]: 6,  // Cheese-fare Saturday
  [-49]: 7,  // Cheese-fare Sunday (Forgiveness)
  [-42]: 14, // Sunday of the Triumph of Orthodoxy
  [-35]: 17, // Sunday of St. Gregory Palamas
  [-28]: 20, // Sunday of the Veneration of the Cross
  [-21]: 23, // Sunday of St. John Climacus
  [-14]: 27, // Sunday of St. Mary of Egypt
  [-9]: 26,  // Saturday of the Akathist
  [-8]: 29,  // Lazarus Saturday
};

/** Bright Week: nday -> service */
export const BRIGHT_WEEK: Record<number, ServiceTabDef> = {
  0: { id: 'pascha', serviceType: 'PASCHA', template: 'Pascha' },
  1: { id: 'brightmonday', serviceType: 'BRIGHTMONDAY', template: 'BrightMonday' },
  2: { id: 'brighttuesday', serviceType: 'BRIGHTTUESDAY', template: 'BrightTuesday' },
  3: { id: 'brightwednesday', serviceType: 'BRIGHTWEDNESDAY', template: 'BrightWednesday' },
  4: { id: 'brightthursday', serviceType: 'BRIGHTTHURSDAY', template: 'BrightThursday' },
  5: { id: 'brightfriday', serviceType: 'BRIGHTFRIDAY', template: 'BrightFriday' },
  6: { id: 'brightsaturday', serviceType: 'BRIGHTSATURDAY', template: 'BrightSaturday' },
};

/** Pentecostarion: nday -> service (Antipascha through All Saints) */
export const PENTECOSTARION: Record<number, ServiceTabDef> = {
  7: { id: 'antipascha', serviceType: 'ANTIPASCHA', template: 'Antipascha' },
  14: { id: 'myrrhbearers', serviceType: 'MYRRHBEARERS', template: 'Myrrhbearers' },
  21: { id: 'paralytic', serviceType: 'PARALYTIC', template: 'Paralytic', varKey: 'IParalytic' },
  25: { id: 'prepolovenie', serviceType: 'PREPOLOVENIE', template: 'Prepolovenie', varKey: 'IPrepolovenie' },
  28: { id: 'samaritan', serviceType: 'SAMARITAN', template: 'Samaritan', varKey: 'ISamaritan' },
  35: { id: 'blindman', serviceType: 'BLINDMAN', template: 'BlindMan', varKey: 'IBlindMan' },
  38: { id: 'apodosis', serviceType: 'APODOSIS', template: 'Apodosis', varKey: 'IApodosis' },
  39: { id: 'ascension', serviceType: 'ASCENSION', template: 'Ascension', varKey: 'IAscension' },
  42: { id: 'holyfathers', serviceType: 'HOLYFATHERS', template: 'HolyFathers', varKey: 'IHolyFathers' },
  48: { id: 'pentecostsaturday', serviceType: 'PENTECOSTSATURDAY', template: 'PentecostSaturday', varKey: 'IPentecostSaturday' },
  49: { id: 'pentecost', serviceType: 'PENTECOST', template: 'Pentecost', varKey: 'IPentecost' },
  50: { id: 'holyspirit', serviceType: 'HOLYSPIRIT', template: 'HolySpirit', varKey: 'IHolySpirit' },
  56: { id: 'allsaints', serviceType: 'ALLSAINTS', template: 'AllSaints', varKey: 'IAllSaints' },
};

/** First Week of Great Lent: nday -> service */
export const FIRST_WEEK: Record<number, ServiceTabDef> = {
  [-48]: { id: 'firstweekmonday', serviceType: 'FIRSTWEEKMONDAY', template: 'FirstWeekMonday' },
  [-47]: { id: 'firstweektuesday', serviceType: 'FIRSTWEEKTUESDAY', template: 'FirstWeekTuesday' },
  [-46]: { id: 'firstweekwednesday', serviceType: 'FIRSTWEEKWEDNESDAY', template: 'FirstWeekWednesday' },
  [-45]: { id: 'firstweekthursday', serviceType: 'FIRSTWEEKTHURSDAY', template: 'FirstWeekThursday' },
  [-44]: { id: 'firstweekfriday', serviceType: 'FIRSTWEEKFRIDAY', template: 'FirstWeekFriday' },
  [-43]: { id: 'firstweeksaturday', serviceType: 'FIRSTWEEKSATURDAY', template: 'FirstWeekSaturday' },
};

/** Festal Menaion (fixed Julian dates "M-D"): date -> service */
export const MENAION_FEAST: Record<string, ServiceTabDef> = {
  '9-8': { id: 'nativitytheotokos', serviceType: 'NATIVITYTHEOTOKOS', template: 'NativityTheotokos' },
  '9-14': { id: 'exaltation', serviceType: 'EXALTATION', template: 'Exaltation' },
  '11-21': { id: 'vvedenie', serviceType: 'VVEDENIE', template: 'Vvedenie' },
  '12-24': { id: 'nativityhours', serviceType: 'NATIVITYHOURS', template: 'NativityHours' },
  '12-25': { id: 'nativity', serviceType: 'NATIVITY', template: 'Nativity' },
  '1-5': { id: 'theophanyhours', serviceType: 'THEOPHANYHOURS', template: 'TheophanyHours' },
  '1-6': { id: 'theophany', serviceType: 'THEOPHANY', template: 'Theophany' },
  '2-2': { id: 'sretenie', serviceType: 'SRETENIE', template: 'Sretenie' },
  '3-25': { id: 'annunciation', serviceType: 'ANNUNCIATION', template: 'Annunciation' },
  '6-24': { id: 'forerunnerbirth', serviceType: 'FORERUNNERBIRTH', template: 'ForerunnerBirth' },
  '6-29': { id: 'peterpaul', serviceType: 'PETERPAUL', template: 'PeterPaul' },
  '8-6': { id: 'transfiguration', serviceType: 'TRANSFIGURATION', template: 'Transfiguration' },
  '8-15': { id: 'dormition', serviceType: 'DORMITION', template: 'Dormition' },
  '8-29': { id: 'forerunnerbeheading', serviceType: 'FORERUNNERBEHEADING', template: 'ForerunnerBeheading' },
  '9-25': { id: 'sergius', serviceType: 'SERGIUS', template: 'Sergius' },
  '9-26': { id: 'johntheologiansep', serviceType: 'JOHNTHEOLOGIANSEP', template: 'JohnTheologianSep' },
  '10-1': { id: 'pokrov', serviceType: 'POKROV', template: 'Pokrov' },
  '10-10': { id: 'ambrose', serviceType: 'AMBROSE', template: 'Ambrose' },
  '10-11': { id: 'seventhcouncilefathers', serviceType: 'SEVENTHCOUNCILFATHERS', template: 'SeventhCouncilFathers' },
  '10-22': { id: 'kazan', serviceType: 'KAZAN', template: 'Kazan' },
  '10-26': { id: 'demetrius', serviceType: 'DEMETRIUS', template: 'Demetrius' },
  '11-8': { id: 'michaelsynaxis', serviceType: 'MICHAELSYNAXIS', template: 'MichaelSynaxis' },
  '12-6': { id: 'nicholas', serviceType: 'NICHOLAS', template: 'Nicholas' },
  '1-1': { id: 'circumcision', serviceType: 'CIRCUMCISION', template: 'Circumcision' },
  '2-24': { id: 'findinghead1st', serviceType: 'FINDINGHEAD1ST', template: 'FindingHead1st' },
  '3-9': { id: 'fortymartyrs', serviceType: 'FORTYMARTYRS', template: 'FortyMartyrs' },
  '5-8': { id: 'johntheologianmay', serviceType: 'JOHNTHEOLOGIANMAY', template: 'JohnTheologianMay' },
  '5-9': { id: 'nicholastranslation', serviceType: 'NICHOLASTRANSLATION', template: 'NicholasTranslation' },
  '5-25': { id: 'findinghead3rd', serviceType: 'FINDINGHEAD3RD', template: 'FindingHead3rd' },
  '7-15': { id: 'vladimir', serviceType: 'VLADIMIR', template: 'Vladimir' },
  '7-16': { id: 'sixcouncilfathers', serviceType: 'SIXCOUNCILFATHERS', template: 'SixCouncilsFathers' },
  '7-20': { id: 'elijah', serviceType: 'ELIJAH', template: 'Elijah' },
  '7-27': { id: 'panteleimon', serviceType: 'PANTELEIMON', template: 'Panteleimon' },
  '8-1': { id: 'processioncross', serviceType: 'PROCESSIONCROSS', template: 'ProcessionCross' },
};

/**
 * Data-backed services (Var node = P{template}, data dir under
 * static/data/shared/services/): serviceType -> def.
 */
export const HOLY_WEEK: Record<string, ServiceTabDef> = {
  PALMSUNDAY: { id: 'palmsunday', serviceType: 'PALMSUNDAY', template: 'PalmSunday', dir: 'palm-sunday' },
  GREATMONDAY: { id: 'greatmonday', serviceType: 'GREATMONDAY', template: 'GreatMonday', dir: 'great-monday' },
  GREATTUESDAY: { id: 'greattuesday', serviceType: 'GREATTUESDAY', template: 'GreatTuesday', dir: 'great-tuesday' },
  GREATWEDNESDAY: { id: 'greatwednesday', serviceType: 'GREATWEDNESDAY', template: 'GreatWednesday', dir: 'great-wednesday' },
  GREATTHURSDAY: { id: 'greatthursday', serviceType: 'GREATTHURSDAY', template: 'GreatThursday', dir: 'great-thursday' },
  PASSIONGOSPELS: { id: 'passiongospels', serviceType: 'PASSIONGOSPELS', template: 'PassionGospels', dir: 'passion-gospels' },
  ROYALHOURSFRIDAY: { id: 'royalhoursfriday', serviceType: 'ROYALHOURSFRIDAY', template: 'RoyalHoursFriday', dir: 'royal-hours-friday' },
  LAMENTATIONS: { id: 'lamentations', serviceType: 'LAMENTATIONS', template: 'Lamentations', dir: 'lamentations' },
  BURIALVESPERS: { id: 'burialvespers', serviceType: 'BURIALVESPERS', template: 'BurialVespers', dir: 'burial-vespers' },
  SATURDAYHOURS: { id: 'saturdayhours', serviceType: 'SATURDAYHOURS', template: 'SaturdayHours', dir: 'saturday-hours' },
  SATURDAYLITURGY: { id: 'saturdayliturgy', serviceType: 'SATURDAYLITURGY', template: 'SaturdayVespersLiturgy', dir: 'saturday-vespers-liturgy' },
  SATURDAYMIDNIGHT: { id: 'saturdaymidnight', serviceType: 'SATURDAYMIDNIGHT', template: 'SaturdayMidnight', dir: 'saturday-midnight' },
  PASCHA: { id: 'pascha', serviceType: 'PASCHA', template: 'Pascha', dir: 'pascha' },
  BRIGHTMONDAY: { id: 'brightmonday', serviceType: 'BRIGHTMONDAY', template: 'BrightMonday', dir: 'bright-monday' },
  BRIGHTTUESDAY: { id: 'brighttuesday', serviceType: 'BRIGHTTUESDAY', template: 'BrightTuesday', dir: 'bright-tuesday' },
  BRIGHTWEDNESDAY: { id: 'brightwednesday', serviceType: 'BRIGHTWEDNESDAY', template: 'BrightWednesday', dir: 'bright-wednesday' },
  BRIGHTTHURSDAY: { id: 'brightthursday', serviceType: 'BRIGHTTHURSDAY', template: 'BrightThursday', dir: 'bright-thursday' },
  BRIGHTFRIDAY: { id: 'brightfriday', serviceType: 'BRIGHTFRIDAY', template: 'BrightFriday', dir: 'bright-friday' },
  BRIGHTSATURDAY: { id: 'brightsaturday', serviceType: 'BRIGHTSATURDAY', template: 'BrightSaturday', dir: 'bright-saturday' },
  ANTIPASCHA: { id: 'antipascha', serviceType: 'ANTIPASCHA', template: 'Antipascha', dir: 'antipascha' },
  MYRRHBEARERS: { id: 'myrrhbearers', serviceType: 'MYRRHBEARERS', template: 'Myrrhbearers', dir: 'myrrhbearers' },
  PARALYTIC: { id: 'paralytic', serviceType: 'PARALYTIC', template: 'Paralytic', dir: 'paralytic', varKey: 'IParalytic' },
  PREPOLOVENIE: { id: 'prepolovenie', serviceType: 'PREPOLOVENIE', template: 'Prepolovenie', dir: 'prepolovenie', varKey: 'IPrepolovenie' },
  SAMARITAN: { id: 'samaritan', serviceType: 'SAMARITAN', template: 'Samaritan', dir: 'samaritan', varKey: 'ISamaritan' },
  BLINDMAN: { id: 'blindman', serviceType: 'BLINDMAN', template: 'BlindMan', dir: 'blindman', varKey: 'IBlindMan' },
  APODOSIS: { id: 'apodosis', serviceType: 'APODOSIS', template: 'Apodosis', dir: 'apodosis', varKey: 'IApodosis' },
  ASCENSION: { id: 'ascension', serviceType: 'ASCENSION', template: 'Ascension', dir: 'ascension', varKey: 'IAscension' },
  HOLYFATHERS: { id: 'holyfathers', serviceType: 'HOLYFATHERS', template: 'HolyFathers', dir: 'holyfathers', varKey: 'IHolyFathers' },
  PENTECOSTSATURDAY: { id: 'pentecostsaturday', serviceType: 'PENTECOSTSATURDAY', template: 'PentecostSaturday', dir: 'pentecostsaturday', varKey: 'IPentecostSaturday' },
  PENTECOST: { id: 'pentecost', serviceType: 'PENTECOST', template: 'Pentecost', dir: 'pentecost', varKey: 'IPentecost' },
  HOLYSPIRIT: { id: 'holyspirit', serviceType: 'HOLYSPIRIT', template: 'HolySpirit', dir: 'holyspirit', varKey: 'IHolySpirit' },
  ALLSAINTS: { id: 'allsaints', serviceType: 'ALLSAINTS', template: 'AllSaints', dir: 'allsaints', varKey: 'IAllSaints' },
  RUSSIANSAINTS: { id: 'russiansaints', serviceType: 'RUSSIANSAINTS', template: 'RussianSaints', dir: 'russiansaints', varKey: 'IRussianSaints' },
  FIRSTWEEKMONDAY: { id: 'firstweekmonday', serviceType: 'FIRSTWEEKMONDAY', template: 'FirstWeekMonday', dir: 'first-week-monday' },
  FIRSTWEEKTUESDAY: { id: 'firstweektuesday', serviceType: 'FIRSTWEEKTUESDAY', template: 'FirstWeekTuesday', dir: 'first-week-tuesday' },
  FIRSTWEEKWEDNESDAY: { id: 'firstweekwednesday', serviceType: 'FIRSTWEEKWEDNESDAY', template: 'FirstWeekWednesday', dir: 'first-week-wednesday' },
  FIRSTWEEKTHURSDAY: { id: 'firstweekthursday', serviceType: 'FIRSTWEEKTHURSDAY', template: 'FirstWeekThursday', dir: 'first-week-thursday' },
  FIRSTWEEKFRIDAY: { id: 'firstweekfriday', serviceType: 'FIRSTWEEKFRIDAY', template: 'FirstWeekFriday', dir: 'first-week-friday' },
  FIRSTWEEKSATURDAY: { id: 'firstweeksaturday', serviceType: 'FIRSTWEEKSATURDAY', template: 'FirstWeekSaturday', dir: 'first-week-saturday' },
  NATIVITYTHEOTOKOS: { id: 'nativitytheotokos', serviceType: 'NATIVITYTHEOTOKOS', template: 'NativityTheotokos', dir: 'nativity-theotokos' },
  EXALTATION: { id: 'exaltation', serviceType: 'EXALTATION', template: 'Exaltation', dir: 'exaltation' },
  VVEDENIE: { id: 'vvedenie', serviceType: 'VVEDENIE', template: 'Vvedenie', dir: 'vvedenie' },
  NATIVITYHOURS: { id: 'nativityhours', serviceType: 'NATIVITYHOURS', template: 'NativityHours', dir: 'nativity-hours' },
  NATIVITY: { id: 'nativity', serviceType: 'NATIVITY', template: 'Nativity', dir: 'nativity' },
  THEOPHANYHOURS: { id: 'theophanyhours', serviceType: 'THEOPHANYHOURS', template: 'TheophanyHours', dir: 'theophany-hours' },
  THEOPHANY: { id: 'theophany', serviceType: 'THEOPHANY', template: 'Theophany', dir: 'theophany' },
  SRETENIE: { id: 'sretenie', serviceType: 'SRETENIE', template: 'Sretenie', dir: 'sretenie' },
  ANNUNCIATION: { id: 'annunciation', serviceType: 'ANNUNCIATION', template: 'Annunciation', dir: 'annunciation' },
  FORERUNNERBIRTH: { id: 'forerunnerbirth', serviceType: 'FORERUNNERBIRTH', template: 'ForerunnerBirth', dir: 'forerunner-birth' },
  PETERPAUL: { id: 'peterpaul', serviceType: 'PETERPAUL', template: 'PeterPaul', dir: 'peter-paul' },
  TRANSFIGURATION: { id: 'transfiguration', serviceType: 'TRANSFIGURATION', template: 'Transfiguration', dir: 'transfiguration' },
  DORMITION: { id: 'dormition', serviceType: 'DORMITION', template: 'Dormition', dir: 'dormition' },
  FORERUNNERBEHEADING: { id: 'forerunnerbeheading', serviceType: 'FORERUNNERBEHEADING', template: 'ForerunnerBeheading', dir: 'forerunner-beheading' },
  SERGIUS: { id: 'sergius', serviceType: 'SERGIUS', template: 'Sergius', dir: 'sergius' },
  JOHNTHEOLOGIANSEP: { id: 'johntheologiansep', serviceType: 'JOHNTHEOLOGIANSEP', template: 'JohnTheologianSep', dir: 'johntheologian-sep' },
  POKROV: { id: 'pokrov', serviceType: 'POKROV', template: 'Pokrov', dir: 'pokrov' },
  AMBROSE: { id: 'ambrose', serviceType: 'AMBROSE', template: 'Ambrose', dir: 'ambrose' },
  SEVENTHCOUNCILFATHERS: { id: 'seventhcouncilefathers', serviceType: 'SEVENTHCOUNCILFATHERS', template: 'SeventhCouncilFathers', dir: 'seventh-council-fathers' },
  KAZAN: { id: 'kazan', serviceType: 'KAZAN', template: 'Kazan', dir: 'kazan' },
  DEMETRIUS: { id: 'demetrius', serviceType: 'DEMETRIUS', template: 'Demetrius', dir: 'demetrius' },
  MICHAELSYNAXIS: { id: 'michaelsynaxis', serviceType: 'MICHAELSYNAXIS', template: 'MichaelSynaxis', dir: 'michael-synaxis' },
  NICHOLAS: { id: 'nicholas', serviceType: 'NICHOLAS', template: 'Nicholas', dir: 'nicholas' },
  CIRCUMCISION: { id: 'circumcision', serviceType: 'CIRCUMCISION', template: 'Circumcision', dir: 'circumcision' },
  FINDINGHEAD1ST: { id: 'findinghead1st', serviceType: 'FINDINGHEAD1ST', template: 'FindingHead1st', dir: 'finding-head-1st' },
  FORTYMARTYRS: { id: 'fortymartyrs', serviceType: 'FORTYMARTYRS', template: 'FortyMartyrs', dir: 'forty-martyrs' },
  JOHNTHEOLOGIANMAY: { id: 'johntheologianmay', serviceType: 'JOHNTHEOLOGIANMAY', template: 'JohnTheologianMay', dir: 'johntheologian-may' },
  NICHOLASTRANSLATION: { id: 'nicholastranslation', serviceType: 'NICHOLASTRANSLATION', template: 'NicholasTranslation', dir: 'nicholas-translation' },
  FINDINGHEAD3RD: { id: 'findinghead3rd', serviceType: 'FINDINGHEAD3RD', template: 'FindingHead3rd', dir: 'finding-head-3rd' },
  VLADIMIR: { id: 'vladimir', serviceType: 'VLADIMIR', template: 'Vladimir', dir: 'vladimir' },
  SIXCOUNCILFATHERS: { id: 'sixcouncilfathers', serviceType: 'SIXCOUNCILFATHERS', template: 'SixCouncilsFathers', dir: 'six-councils-fathers' },
  ELIJAH: { id: 'elijah', serviceType: 'ELIJAH', template: 'Elijah', dir: 'elijah' },
  PANTELEIMON: { id: 'panteleimon', serviceType: 'PANTELEIMON', template: 'Panteleimon', dir: 'panteleimon' },
  PROCESSIONCROSS: { id: 'processioncross', serviceType: 'PROCESSIONCROSS', template: 'ProcessionCross', dir: 'procession-cross' },
  FOREFATHERSSUNDAY: { id: 'forefatherssunday', serviceType: 'FOREFATHERSSUNDAY', template: 'ForefathersSunday', dir: 'forefathers-sunday' },
  HOLYFATHERSNATIVITY: { id: 'holyfathersnativity', serviceType: 'HOLYFATHERSNATIVITY', template: 'HolyFathersNativity', dir: 'holy-fathers-nativity' },
  SUNDAYAFTERNATIVITY: { id: 'sundayafternativity', serviceType: 'SUNDAYAFTERNATIVITY', template: 'SundayAfterNativity', dir: 'sunday-after-nativity' },
};

/** Var node name for a data-backed service (e.g. PalmSunday -> PPalmSunday) */
export function holyWeekVarName(def: ServiceTabDef): string {
  return def.varKey ?? `P${def.template}`;
}
