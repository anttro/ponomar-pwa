/**
 * Internationalization (i18n) module for Ponomar PWA.
 * Provides translations for UI strings in English, Russian, and Church Slavonic.
 */

export type LanguageCode = 'en' | 'ru' | 'cu';

export interface Translations {
  // General
  appName: string;
  loading: string;
  error: string;
  notAvailable: string;

  // Navigation
  nav: {
    calendar: string;
    service: string;
    bible: string;
    prayer: string;
    akathists: string;
    parimii: string;
    horologion: string;
    sbornik: string;
    paraclete: string;
    irmologion: string;
    menaion: string;
    triodion: string;
    settings: string;
    library: string;
    appTitle: string;
    festal: string;
  };

  // Триодь постная
  triodion: {
    title: string;
    subtitle: string;
    sections: string[];
  };

  // Минѣѧ (daily Menaion)
  menaion: {
    title: string;
    subtitle: string;
  };

  // Ирмологий
  irmologion: {
    title: string;
    subtitle: string;
    sections: string[];
  };

  // Параклитика (weekday Octoechos)
  paraclete: {
    title: string;
    subtitle: string;
    days: string[];
  };

  // Horologion (Часослов)
  horologion: {
    title: string;
    subtitle: string;
    sections: {
      midnightDaily: string;
      midnightSaturday: string;
      midnightSunday: string;
      typica: string;
      interhour1: string;
      interhour3: string;
      interhour6: string;
      interhour9: string;
      panagia: string;
      mealBlessing: string;
      smallCompline: string;
    };
  };

  // Богослужебный сборник (Приложение к часослову)
  sbornik: {
    title: string;
    subtitle: string;
    sections: {
      sunday: string;
      weekday: string;
      feast: string;
      lent: string;
      pentecost: string;
      common: string;
      theotokionSunday: string;
      theotokion8tones: string;
      theotokionDismissal: string;
      katavasia: string;
      trinity: string;
      lamps: string;
      exapostilaria: string;
      songsFeasts: string;
      songsDaily: string;
      songsLent: string;
    };
  };

  // Parimii readings (Паримии)
  parimii: {
    title: string;
    subtitle: string;
    sections: {
      sept: string;
      oct: string;
      nov: string;
      dec: string;
      jan: string;
      feb: string;
      mar: string;
      apr: string;
      may: string;
      jun: string;
      jul: string;
      aug: string;
      cheeseWeek: string;
      lentWeek1: string;
      lentWeek2: string;
      lentWeek3: string;
      lentWeek4: string;
      lentWeek5: string;
      palmWeek: string;
      holyWeek: string;
      pentecostarion: string;
      commonSaints: string;
    };
  };

  // Canons and akathists (Каноны и акафисты)
  akathists: {
    title: string;
    subtitle: string;
    sections: {
      trinity: string;
      jesusCompunction: string;
      akathistJesus: string;
      jesusPenitential: string;
      pascha: string;
      nativity: string;
      cross: string;
      theotokosMoleben: string;
      theotokosThanksgiving: string;
      akathistTheotokos: string;
      theotokosNativity: string;
      pokrov: string;
      utoliPechali: string;
      skoroposlushnitsa: string;
      troeruchitsa: string;
      angels: string;
      michael: string;
      gabriel: string;
      guardianAngel: string;
      forerunner: string;
      nicholasCanon: string;
      akathistNicholas: string;
      spiridon: string;
      cyprian: string;
      panteleimon: string;
      tryphon: string;
      sergius: string;
      alexanderSvirsky: string;
      seraphim: string;
      johnKronstadt: string;
      maryEgypt: string;
      murom: string;
      saintAnne: string;
    };
  };

  // Prayer rule (Молитвослов)
  prayer: {
    title: string;
    subtitle: string;
    selectSection: string;
    notFound: string;
    empty: string;
    sections: {
      morning: string;
      morningDesc: string;
      diptychs: string;
      diptychsDesc: string;
      evening: string;
      eveningDesc: string;
      threeCanons: string;
      threeCanonsDesc: string;
      communion: string;
      communionDesc: string;
      thanksgiving: string;
      thanksgivingDesc: string;
      ruleImpurity: string;
      ruleImpurityDesc: string;
      litiaDeparted: string;
      litiaDepartedDesc: string;
      twelvePsalms: string;
      twelvePsalmsDesc: string;
      beginningEnding: string;
      beginningEndingDesc: string;
    };
  };

  // Calendar
  calendar: {
    months: string[];
    monthsGenitive: string[];
    dayNames: string[];
    dayNamesFull: string[];
    rankLabels: Record<number, string>;
    rankIcons: Record<number, string>;
    pascha: string;
    pentecost: string;
    cleanMonday: string;
    greatLent: string;
    brightWeek: string;
    weekAfterPentecost: string;
    weekOrdSuffix: string;
    apostlesFast: string;
    dormitionFast: string;
    nativityFast: string;
    commemorations: string;
    fastingRule: string;
    readings: string;
    noCommemorations: string;
    noReadings: string;
    readingTypes: Record<string, string>;
    defaultBibleVersion: string;
    dayReading: string[];
    readSep: string;
    colon: string;
    dayOfYear: string;
    ofYear: string;
    tone: string;
    gregorianDate: string;
    churchDate: string;
    annoMundi: string;
    yearOfWorld: string;
    fromYear: string;
    fromAdam: string;
    sunrise: string;
    sunset: string;
    moonPhase: string;
    noLocation: string;
    moonDay: string;
  };

  // Services
  services: {
    title: string;
    selectService: string;
    serviceProducedNoOutput: string;
    errorLoading: string;
    nodesAssembled: string;
    greatLent: string;
    brightWeek: string;
    apostlesFast: string;
    dormitionFast: string;
    nativityFast: string;
    tone: string;
    roleLabel: string;
    rolePriest: string;
    roleReader: string;
    roleAuto: string;
    serviceNames: {
      primes: string;
      third: string;
      sixth: string;
      ninth: string;
      vespers: string;
      liturgy: string;
      royalhours: string;
      compline: string;
      greatcompline: string;
      mariasstanding: string;
      passiongospels: string;
      royalhoursfriday: string;
      lamentations: string;
      palmsunday: string;
      greatmonday: string;
      greattuesday: string;
      greatwednesday: string;
      greatthursday: string;
      burialvespers: string;
      saturdayhours: string;
      saturdayliturgy: string;
      saturdaymidnight: string;
      pascha: string;
      brightmonday: string;
      brighttuesday: string;
      brightwednesday: string;
      brightthursday: string;
      brightfriday: string;
      brightsaturday: string;
      antipascha: string;
      myrrhbearers: string;
      paralytic: string;
      prepolovenie: string;
      samaritan: string;
      blindman: string;
      apodosis: string;
      ascension: string;
      holyfathers: string;
      pentecostsaturday: string;
      pentecost: string;
      holyspirit: string;
      allsaints: string;
      russiansaints: string;
      firstweekmonday: string;
      firstweektuesday: string;
      firstweekwednesday: string;
      firstweekthursday: string;
      firstweekfriday: string;
      firstweeksaturday: string;
      nativitytheotokos: string;
      exaltation: string;
      vvedenie: string;
      nativityhours: string;
      nativity: string;
      theophanyhours: string;
      theophany: string;
      sretenie: string;
      annunciation: string;
      forerunnerbirth: string;
      peterpaul: string;
      transfiguration: string;
      dormition: string;
      forerunnerbeheading: string;
      sergius: string;
      johntheologiansep: string;
      pokrov: string;
      ambrose: string;
      seventhcouncilefathers: string;
      kazan: string;
      demetrius: string;
      michaelsynaxis: string;
      nicholas: string;
      circumcision: string;
      findinghead1st: string;
      fortymartyrs: string;
      johntheologianmay: string;
      nicholastranslation: string;
      findinghead3rd: string;
      vladimir: string;
      sixcouncilfathers: string;
      elijah: string;
      panteleimon: string;
      processioncross: string;
      forefatherssunday: string;
      holyfathersnativity: string;
      sundayafternativity: string;
      matins: string;
      menaionDay: string;
      triodion: string;
    };
    serviceDescriptions: {
      primes: string;
      third: string;
      sixth: string;
      ninth: string;
      vespers: string;
      liturgy: string;
      royalhours: string;
      compline: string;
      greatcompline: string;
      mariasstanding: string;
      passiongospels: string;
      royalhoursfriday: string;
      lamentations: string;
      palmsunday: string;
      greatmonday: string;
      greattuesday: string;
      greatwednesday: string;
      greatthursday: string;
      burialvespers: string;
      saturdayhours: string;
      saturdayliturgy: string;
      saturdaymidnight: string;
      pascha: string;
      brightmonday: string;
      brighttuesday: string;
      brightwednesday: string;
      brightthursday: string;
      brightfriday: string;
      brightsaturday: string;
      antipascha: string;
      myrrhbearers: string;
      paralytic: string;
      prepolovenie: string;
      samaritan: string;
      blindman: string;
      apodosis: string;
      ascension: string;
      holyfathers: string;
      pentecostsaturday: string;
      pentecost: string;
      holyspirit: string;
      allsaints: string;
      russiansaints: string;
      firstweekmonday: string;
      firstweektuesday: string;
      firstweekwednesday: string;
      firstweekthursday: string;
      firstweekfriday: string;
      firstweeksaturday: string;
      nativitytheotokos: string;
      exaltation: string;
      vvedenie: string;
      nativityhours: string;
      nativity: string;
      theophanyhours: string;
      theophany: string;
      sretenie: string;
      annunciation: string;
      forerunnerbirth: string;
      peterpaul: string;
      transfiguration: string;
      dormition: string;
      forerunnerbeheading: string;
      sergius: string;
      johntheologiansep: string;
      pokrov: string;
      ambrose: string;
      seventhcouncilefathers: string;
      kazan: string;
      demetrius: string;
      michaelsynaxis: string;
      nicholas: string;
      circumcision: string;
      findinghead1st: string;
      fortymartyrs: string;
      johntheologianmay: string;
      nicholastranslation: string;
      findinghead3rd: string;
      vladimir: string;
      sixcouncilfathers: string;
      elijah: string;
      panteleimon: string;
      processioncross: string;
      forefatherssunday: string;
      holyfathersnativity: string;
      sundayafternativity: string;
      matins: string;
      menaionDay: string;
      triodion: string;
    };
  };

  // Bible
  bible: {
    selectBook: string;
    selectChapter: string;
    read: string;
    loading: string;
    noTextFound: string;
    notAvailableOffline: string;
    ensureDataConverted: string;
  };

  // Settings
  settings: {
    title: string;
    language: string;
    fontSettings: string;
    usePonomarFont: string;
    usePonomarFontDesc: string;
    fontPreview: string;
    fontPreviewNoteActive: string;
    fontPreviewNoteInactive: string;
    fontSize: string;
    systemFont: string;
    theme: string;
    themeDefault: string;
    themeDark: string;
    themeSepia: string;
    themeHC: string;
    bibleSettings: string;
    defaultTranslation: string;
    showVerseNumbers: string;
    verseNewLine: string;
    bibleComments: {
      fullBible: string;
      ntOnly: string;
      otOnly: string;
      otProphets: string;
    };
    calendarType: string;
    julian: string;
    gregorian: string;
    about: string;
    aboutText: string;
    aboutAppName: string;
    aboutLicense: string;
    installPwa: string;
    offlineOfferTitle: string;
    offlineOfferText: string;
    offlineOfferPreloadAll: string;
    offlineOfferChoose: string;
    offlineOfferSkip: string;
    offlineContent: string;
    offlineLangs: string;
    offlineDataTypes: string;
    offlineLives: string;
    offlineCalendar: string;
    offlineMenaion: string;
    offlineBible: string;
    offlinePreload: string;
    offlineClearCache: string;
    offlineCalculating: string;
    offlineDone: string;
    offlineFailed: string;
    offlineSelectLang: string;
    offlineSelectAll: string;
    offlineCleared: string;
    offlineCacheInfo: string;
    locationTitle: string;
    latitude: string;
    longitude: string;
    requestLocation: string;
    locationNote: string;
  };

  // Common
  common: {
    priest: string;
    reader: string;
    deacon: string;
    choir: string;
    all: string;
  };
}

const translations: Record<LanguageCode, Translations> = {
  en: {
    appName: '☦ Ponomar',
    loading: 'Loading...',
    error: 'Error',
    notAvailable: 'Not available',

    nav: {
      calendar: '📅 Calendar',
      service: '📖 Service',
      bible: 'Bible',
      prayer: '📿 Prayer Rule',
      akathists: '📜 Canons & Akathists',
      parimii: '📖 Paroemia',
      horologion: '⏰ Horologion',
      sbornik: '📚 Sbornik',
      paraclete: '📗 Paraclete',
      irmologion: '🎵 Irmologion',
      menaion: '📕 Menaion',
      triodion: '📗 Lenten Triodion',
      settings: '⚙ Settings',
      library: '📚 Library',
      appTitle: 'Ponomar',
      festal: '📗 Feasts',
    },

    triodion: {
      title: 'Lenten Triodion',
      subtitle: 'The services of the Pre-Lent and Great Lent weeks (Church Slavonic)',
      sections: ["Sunday of the Publican and the Pharisee", "Sunday of the Prodigal Son", "Meat-fare Saturday", "Meat-fare Sunday", "Cheese-fare Week", "Cheese-fare Saturday", "Cheese-fare Sunday (Forgiveness)", "Monday of the 1st Week", "Tuesday of the 1st Week", "Wednesday of the 1st Week", "Thursday of the 1st Week", "Friday of the 1st Week", "Saturday of the 1st Week", "Sunday of the Triumph of Orthodoxy", "2nd Week", "Saturday of the 2nd Week", "Sunday of St. Gregory Palamas", "3rd Week", "Saturday of the 3rd Week", "Sunday of the Veneration of the Cross", "4th Week", "Saturday of the 4th Week", "Sunday of St. John Climacus", "5th Week", "Standing of St. Mary of Egypt", "Saturday of the Akathist", "Sunday of St. Mary of Egypt", "Week of the Palms (Vaii)", "Lazarus Saturday", "Palm Sunday", "Great Monday", "Great Tuesday", "Great Wednesday", "Great Thursday", "Great Friday", "Great Saturday", "Stichera"],
    },

    menaion: {
      title: 'Menaion',
      subtitle: 'The daily services of the saints for every day of the year (Church Slavonic)',
    },

    irmologion: {
      title: 'Irmologion',
      subtitle: 'The irmosy and chants of the Octoechos and feasts (Church Slavonic)',
      sections: ["Irmosy of Tone 1", "Irmosy of Tone 2", "Irmosy of Tone 3", "Irmosy of Tone 4", "Irmosy of Tone 5", "Irmosy of Tone 6", "Irmosy of Tone 7", "Irmosy of Tone 8", "Irmosy: Forefeast of Nativity", "Irmosy: Forefeast of Theophany", "Chants of the Divine Liturgy", "Lord, I have cried (Vespers, Presanctified)", "Sunday Theotokia", "Daily Theotokia", "Antiphons of the Degrees", "Trinitarian songs and canon verses", "Sunday and festal verses", "Rules for songs and canons in Great Lent", "Sunday Troparia", "Sunday Prokimena", "Saturday Troparia", "Paschal Canon", "Chosen Psalms", "Festal refrains of Ode 9"],
    },

    paraclete: {
      title: 'Paraclete (Weekday Octoechos)',
      subtitle: 'The daily canons and stichera of the Octoechos, tones 1–8 (Church Slavonic)',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },

    horologion: {
      title: 'Horologion',
      subtitle: 'The daily cycle of the Hours (Church Slavonic)',
      sections: {
        midnightDaily: 'Midnight Office, daily',
        midnightSaturday: 'Midnight Office, Saturday',
        midnightSunday: 'Midnight Office, Sunday',
        typica: 'Typica',
        interhour1: 'Interhour of the 1st Hour',
        interhour3: 'Interhour of the 3rd Hour',
        interhour6: 'Interhour of the 6th Hour',
        interhour9: 'Interhour of the 9th Hour',
        panagia: 'Rite of the Panagia',
        mealBlessing: 'Blessing of the Table',
        smallCompline: 'Small Compline',
      },
    },

    sbornik: {
      title: 'Богослужебный сборник',
      subtitle: 'Reference collection: troparia, kontakia, theotokia and biblical songs (Church Slavonic)',
      sections: {
        sunday: 'Troparia and Kontakia: Sunday',
        weekday: 'Troparia and Kontakia: weekdays',
        feast: 'Troparia and Kontakia: feasts by month',
        lent: 'Troparia and Kontakia: Great Lent',
        pentecost: 'Troparia and Kontakia: Pentecostarion',
        common: 'Troparia and Kontakia: common for saints',
        theotokionSunday: 'Sunday evening Theotokia (8 tones)',
        theotokion8tones: 'Theotokia of the 8 tones',
        theotokionDismissal: 'Dismissal Theotokia',
        katavasia: 'Katavasia for the whole year',
        trinity: 'Trinitarian troparia (8 tones)',
        lamps: 'Weekday Lamps (Photagogika)',
        exapostilaria: 'Exapostilaria of the week',
        songsFeasts: 'Biblical songs: feasts',
        songsDaily: 'Biblical songs: daily',
        songsLent: 'Biblical songs: Great Lent',
      },
    },

    parimii: {
      title: 'Paroemia Readings',
      subtitle: 'Old Testament readings for the feasts of the year and Great Lent (Church Slavonic)',
      sections: {
        sept: 'September',
        oct: 'October',
        nov: 'November',
        dec: 'December',
        jan: 'January',
        feb: 'February',
        mar: 'March',
        apr: 'April',
        may: 'May',
        jun: 'June',
        jul: 'July',
        aug: 'August',
        cheeseWeek: 'Cheese-fare Week',
        lentWeek1: '1st Week of Great Lent',
        lentWeek2: '2nd Week of Great Lent',
        lentWeek3: '3rd Week of Great Lent',
        lentWeek4: '4th Week of Great Lent',
        lentWeek5: '5th Week of Great Lent',
        palmWeek: 'Palm Week (6th Week of Lent)',
        holyWeek: 'Holy Week',
        pentecostarion: 'Pentecostarion',
        commonSaints: 'Common Paroemia for Saints',
      },
    },

    akathists: {
      title: 'Canons and Akathists',
      subtitle: 'From the Каноны и акафисты (Church Slavonic)',
      sections: {
        trinity: 'Canon to the Holy Trinity',
        jesusCompunction: 'Canon of compunction with akathist to Jesus',
        akathistJesus: 'Akathist to Sweetest Jesus',
        jesusPenitential: 'Penitential canon to Jesus',
        pascha: 'Canon of Holy Pascha',
        nativity: 'Canons to the Nativity of Christ',
        cross: 'Canon to the Precious Cross',
        theotokosMoleben: 'Moleben canon to the Theotokos (in sorrow)',
        theotokosThanksgiving: 'Thanksgiving canon with akathist to the Theotokos',
        akathistTheotokos: 'Akathist to the Most Holy Theotokos',
        theotokosNativity: 'Canons to the Nativity of the Theotokos',
        pokrov: 'Canon to the Protection of the Theotokos',
        utoliPechali: 'Canon before the "Assuage my sorrows" icon',
        skoroposlushnitsa: 'Canon before the "Quick to Hear" icon',
        troeruchitsa: 'Canon before the "Three-handed" icon',
        angels: 'Canon to the holy archangels and angels',
        michael: 'Canon to the Archangel Michael',
        gabriel: 'Canon to the Archangel Gabriel',
        guardianAngel: 'Canon to the Guardian Angel',
        forerunner: 'Canon to St. John the Forerunner',
        nicholasCanon: 'Canon with akathist to St. Nicholas',
        akathistNicholas: 'Akathist to St. Nicholas',
        spiridon: 'Canon to St. Spyridon of Trimythous',
        cyprian: 'Canon to the Hieromartyr Cyprian and Martyr Justina',
        panteleimon: 'Canon to the Great Martyr Panteleimon',
        tryphon: 'Canon to the Martyr Tryphon',
        sergius: 'Canon to St. Sergius of Radonezh',
        alexanderSvirsky: 'Canon to St. Alexander of Svir',
        seraphim: 'Canon to St. Seraphim of Sarov',
        johnKronstadt: 'Canon to St. John of Kronstadt',
        maryEgypt: 'Canon to St. Mary of Egypt',
        murom: 'Canon to Sts. Peter and Fevronia of Murom',
        saintAnne: 'Canon to St. Anne, Mother of the Theotokos',
      },
    },

    prayer: {
      title: 'Prayer Rule',
      subtitle: 'Personal prayers from the Молитвослов (Church Slavonic)',
      selectSection: 'Select a section to read',
      notFound: 'Section not found',
      empty: 'No content',
      sections: {
        morning: 'Morning Prayers',
        morningDesc: 'Молитвы утренния',
        diptychs: 'Diptychs (Memorial)',
        diptychsDesc: 'Помянник — prayers for the living and departed',
        evening: 'Evening Prayers',
        eveningDesc: 'Молитвы на сон грядущим',
        threeCanons: 'Three Canons',
        threeCanonsDesc: 'Penitential to Jesus, Moleben to the Theotokos, Guardian Angel',
        communion: 'Preparation for Holy Communion',
        communionDesc: 'Последование ко Святому Причащению',
        thanksgiving: 'Thanksgiving after Communion',
        thanksgivingDesc: 'Благодарственные молитвы по Святом Причащении',
        ruleImpurity: 'Rule of Impurity',
        ruleImpurityDesc: 'Правило от осквернения',
        litiaDeparted: 'Litia for the Departed (Lay)',
        litiaDepartedDesc: 'Чин литии о усопших, аще несть священника',
        twelvePsalms: 'Rule of the Twelve Psalms',
        twelvePsalmsDesc: 'Чин, како подобает пети дванадесять псалмов особь',
        beginningEnding: 'Beginning and Ending of Prayers',
        beginningEndingDesc: 'Молитва предначинательная и окончание молитв',
      },
    },

    calendar: {
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      monthsGenitive: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      dayNamesFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      rankLabels: {
        1: 'Troparion',
        2: 'Antiphon',
        3: 'Hexahymn',
        4: 'Doxology',
        5: 'Polyeleos',
        6: 'Great Saint',
        7: 'Great Feast of the Theotokos',
        8: 'Great Feast of the Lord',
      },
      rankIcons: {
        2: '🕃',
        3: '🕃',
        4: '🕂',
        5: '🕁',
        6: '🕀',
      },
      pascha: 'Pascha: ',
      pentecost: 'Pentecost: ',
      cleanMonday: 'Clean Monday: ',
      greatLent: ' · Great Lent',
      brightWeek: ' · Bright Week',
      weekAfterPentecost: 'week after Pentecost',
      weekOrdSuffix: 'th',
      apostlesFast: " · Apostles' Fast",
      dormitionFast: ' · Dormition Fast',
      nativityFast: ' · Nativity Fast',
      commemorations: 'Commemorations',
      fastingRule: 'Fasting Rule',
      readings: 'Readings',
      noCommemorations: 'No commemorations for this day',
      noReadings: 'No readings assigned',
      readingTypes: {
        apostol: 'Apostol',
        gospel: 'Gospel',
        matins: 'Matins',
        vespers: 'Vespers',
        primes: '1st Hour',
        terce: '3rd Hour',
        sext: '6th Hour',
        none: '9th Hour',
        liturgy: 'Liturgy',
        '0': 'Vespers',
        '1': 'Reading',
        '2': 'Reading',
        '3': 'Reading',
        '4': '4th Reading',
        '5': '5th Reading',
        '6': '6th Reading',
        '7': '7th Reading',
        '8': '8th Reading',
        '9': '9th Reading',
        '10': '10th Reading',
        '11': '11th Reading',
        '12': '12th Reading',
        '13': '13th Reading',
        '14': '14th Reading',
        '15': '15th Reading',
        A: 'Reading',
      },
      defaultBibleVersion: 'en/bible/kjv',
      dayReading: ['for Sunday', 'for Monday', 'for Tuesday', 'for Wednesday', 'for Thursday', 'for Friday', 'for Saturday'],
      readSep: '; ',
      colon: ': ',
      dayOfYear: ' · Day ',
      ofYear: ' of year',
      tone: 'Tone ',
      gregorianDate: 'Civil (Gregorian) Date',
      churchDate: 'Church (Julian) Date',
      annoMundi: 'Year of the World',
      yearOfWorld: 'year of the world',
      fromYear: 'from Christ',
      fromAdam: 'from Adam',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      moonPhase: 'Moon',
      noLocation: 'Set location in Settings',
      moonDay: 'day',
    },

    services: {
      title: 'Services',
      selectService: 'Select a service to view its content.',
      serviceProducedNoOutput: 'Service produced no output.',
      errorLoading: 'Error loading service.',
      nodesAssembled: 'nodes assembled.',
      greatLent: ' · Great Lent',
      brightWeek: ' · Bright Week',
      apostlesFast: " · Apostles' Fast",
      dormitionFast: ' · Dormition Fast',
      nativityFast: ' · Nativity Fast',
      tone: ' · Tone ',
      roleLabel: 'Role:',
      rolePriest: 'Priest',
      roleReader: 'Reader',
      roleAuto: 'Auto',
      serviceNames: {
        primes: 'First Hour',
        third: 'Third Hour',
        sixth: 'Sixth Hour',
        ninth: 'Ninth Hour',
        vespers: 'Vespers',
        liturgy: 'Divine Liturgy',
        royalhours: 'Royal Hours',
        compline: 'Compline',
        greatcompline: 'Great Compline',
        mariasstanding: 'Standing of St. Mary of Egypt',
        passiongospels: 'Matins of the Twelve Passion Gospels',
        royalhoursfriday: 'Royal Hours of Great Friday',
        lamentations: 'Lamentations Matins',
        palmsunday: 'Palm Sunday',
        greatmonday: 'Great Monday',
        greattuesday: 'Great Tuesday',
        greatwednesday: 'Great Wednesday',
        greatthursday: 'Great Thursday',
        burialvespers: 'Vespers of the Burial',
        saturdayhours: 'Holy Saturday Hours',
        saturdayliturgy: 'Holy Saturday Vespers & Liturgy',
        saturdaymidnight: 'Midnight Office of Holy Saturday',
        pascha: 'Pascha',
        brightmonday: 'Bright Monday',
        brighttuesday: 'Bright Tuesday',
        brightwednesday: 'Bright Wednesday',
        brightthursday: 'Bright Thursday',
        brightfriday: 'Bright Friday',
        brightsaturday: 'Bright Saturday',
        antipascha: 'Antipascha (Thomas Sunday)',
        myrrhbearers: 'Sunday of the Myrrhbearers',
        paralytic: 'Sunday of the Paralytic',
        prepolovenie: 'Mid-Pentecost',
        samaritan: 'Sunday of the Samaritan Woman',
        blindman: 'Sunday of the Blind Man',
        apodosis: 'Apodosis of Pascha',
        ascension: 'Ascension of the Lord',
        holyfathers: 'Holy Fathers of Nicea',
        pentecostsaturday: 'Pentecost Saturday',
        pentecost: 'Pentecost (Holy Trinity)',
        holyspirit: 'Monday of the Holy Spirit',
        allsaints: 'All Saints Sunday',
        russiansaints: 'All Saints of Russia',
        firstweekmonday: 'First Week: Monday',
        firstweektuesday: 'First Week: Tuesday',
        firstweekwednesday: 'First Week: Wednesday',
        firstweekthursday: 'First Week: Thursday',
        firstweekfriday: 'First Week: Friday',
        firstweeksaturday: 'First Week: Saturday',
        nativitytheotokos: 'Nativity of the Theotokos',
        exaltation: 'Exaltation of the Cross',
        vvedenie: 'Entry into the Temple',
        nativityhours: 'Royal Hours of Nativity Eve',
        nativity: 'Nativity of Christ',
        theophanyhours: 'Royal Hours of Theophany Eve',
        theophany: 'Theophany',
        sretenie: 'Presentation of the Lord',
        annunciation: 'Annunciation',
        forerunnerbirth: 'Nativity of St. John the Forerunner',
        peterpaul: 'Chief Apostles Peter and Paul',
        transfiguration: 'Transfiguration of the Lord',
        dormition: 'Dormition of the Theotokos',
        forerunnerbeheading: 'Beheading of St. John the Forerunner',
        sergius: 'St. Sergius of Radonezh',
        johntheologiansep: 'St. John the Theologian',
        pokrov: 'Protection of the Theotokos',
        ambrose: 'St. Ambrose of Optina',
        seventhcouncilefathers: 'Fathers of the 7th Council',
        kazan: 'Kazan Icon of the Theotokos',
        demetrius: 'St. Demetrius of Thessalonica',
        michaelsynaxis: 'Synaxis of Archangel Michael',
        nicholas: 'St. Nicholas the Wonderworker',
        circumcision: 'Circumcision of the Lord',
        findinghead1st: '1st and 2nd Finding of the Forerunner\'s Head',
        fortymartyrs: 'Forty Martyrs of Sebaste',
        johntheologianmay: 'St. John the Theologian (May 8)',
        nicholastranslation: 'Translation of St. Nicholas\' Relics',
        findinghead3rd: '3rd Finding of the Forerunner\'s Head',
        vladimir: 'St. Vladimir, Equal-to-the-Apostles',
        sixcouncilfathers: 'Fathers of the Six Councils',
        elijah: 'Prophet Elijah',
        panteleimon: 'St. Panteleimon the Healer',
        processioncross: 'Procession of the Cross (Aug 1)',
        forefatherssunday: 'Sunday of the Holy Forefathers',
        holyfathersnativity: 'Sunday of the Holy Fathers before Nativity',
        sundayafternativity: 'Sunday after the Nativity',
        matins: 'Matins',
        menaionDay: 'Service of the Day',
        triodion: 'Triodion',
      },
      serviceDescriptions: {
        primes: 'First Hour',
        third: 'Third Hour',
        sixth: 'Sixth Hour',
        ninth: 'Ninth Hour',
        vespers: 'Evening service (Vespers)',
        liturgy: 'Principal service (Divine Liturgy)',
        royalhours: 'Royal Hours',
        compline: 'Night office (Compline)',
        greatcompline: 'Great Compline with the Canon of St. Andrew',
        mariasstanding: 'Matins with the Great Canon and the Life of St. Mary of Egypt (Marias Standing)',
        passiongospels: 'Matins of Great Friday with the twelve Passion Gospels',
        royalhoursfriday: 'Royal Hours of Great Friday (1st, 3rd, 6th, 9th)',
        lamentations: 'Matins of Great Saturday with the Lamentations (Praises of the Burial)',
        palmsunday: 'Palm Sunday: Vespers and Matins of the Entry into Jerusalem',
        greatmonday: 'Great Monday: daily cycle (Matins, Hours, Typica, Vespers)',
        greattuesday: 'Great Tuesday: daily cycle (Matins, Hours, Typica, Vespers)',
        greatwednesday: 'Great Wednesday: daily cycle (Matins, Hours, Typica, Vespers)',
        greatthursday: 'Great Thursday: daily cycle (Matins, Hours, Typica, Vespers)',
        burialvespers: 'Vespers of Great Friday with the Shroud and the cell Compline',
        saturdayhours: 'Holy Saturday Hours (3rd, 6th, 9th) with Typica',
        saturdayliturgy: 'Holy Saturday Vespers with the Liturgy of St. Basil (15 paroemia)',
        saturdaymidnight: 'Midnight Office of Holy Saturday with the canon',
        pascha: 'Pascha: Matins, Hours, Liturgy and Artos blessing',
        brightmonday: 'Bright Monday: Matins and Liturgy',
        brighttuesday: 'Bright Tuesday: Matins and Liturgy',
        brightwednesday: 'Bright Wednesday: Matins and Liturgy',
        brightthursday: 'Bright Thursday: Matins and Liturgy',
        brightfriday: 'Bright Friday: Matins and Liturgy',
        brightsaturday: 'Bright Saturday: Matins and Vespers',
        antipascha: 'Antipascha: Sunday of St. Thomas (Week 2 of Pascha)',
        myrrhbearers: 'Sunday of the Myrrhbearers, St. Joseph and Nicodemus (Week 3)',
        paralytic: 'Sunday of the Paralytic (Week 4)',
        prepolovenie: 'Mid-Pentecost: the Feast of the Half of Pentecost',
        samaritan: 'Sunday of the Samaritan Woman (Week 5)',
        blindman: 'Sunday of the Blind Man (Week 6)',
        apodosis: 'Apodosis of Pascha',
        ascension: 'Ascension of our Lord Jesus Christ',
        holyfathers: 'Sunday of the 318 Holy Fathers of the First Council of Nicea',
        pentecostsaturday: 'Saturday of the Souls before Pentecost',
        pentecost: 'Pentecost: the Descent of the Holy Spirit (Holy Trinity)',
        holyspirit: 'Monday of the Holy Spirit',
        allsaints: 'Sunday of All Saints (Week 1 after Pentecost)',
        russiansaints: 'All Saints who shone forth in the Russian Land',
        firstweekmonday: 'Monday of the First Week: complete daily cycle (Matins, Hours, Typica, Vespers, Great Compline)',
        firstweektuesday: 'Tuesday of the First Week: complete daily cycle',
        firstweekwednesday: 'Wednesday of the First Week: complete daily cycle',
        firstweekthursday: 'Thursday of the First Week: complete daily cycle',
        firstweekfriday: 'Friday of the First Week: daily cycle with the Presanctified Liturgy and koliva',
        firstweeksaturday: 'Saturday of the First Week: Matins with the Canon of St. Theodore, Hours and Liturgy',
        nativitytheotokos: 'Nativity of the Most Holy Theotokos (Great Feast)',
        exaltation: 'World Exaltation of the Precious and Life-giving Cross (Great Feast)',
        vvedenie: 'Entry into the Temple of the Most Holy Theotokos (Great Feast)',
        nativityhours: 'Royal Hours of the Eve of the Nativity of Christ',
        nativity: 'Nativity of our Lord God and Saviour Jesus Christ (Great Feast)',
        theophanyhours: 'Royal Hours of the Eve of Theophany',
        theophany: 'The Holy Theophany: the Baptism of our Lord Jesus Christ (Great Feast)',
        sretenie: 'Presentation of our Lord Jesus Christ in the Temple (Great Feast)',
        annunciation: 'Annunciation of the Most Holy Theotokos (Great Feast)',
        forerunnerbirth: 'Nativity of the Honorable Prophet, Forerunner and Baptist John (Great Feast)',
        peterpaul: 'Holy Glorious All-praised Chief Apostles Peter and Paul (Great Feast)',
        transfiguration: 'Holy Transfiguration of our Lord God and Saviour Jesus Christ (Great Feast)',
        dormition: 'Dormition of the Most Holy Theotokos (Great Feast)',
        forerunnerbeheading: 'Beheading of the Honorable Head of the Prophet and Baptist John (Great Feast)',
        sergius: 'Repose of St. Sergius, Abbot of Radonezh, Wonderworker',
        johntheologiansep: 'Repose of the Holy Apostle and Evangelist John the Theologian',
        pokrov: 'Protection of the Most Holy Theotokos and Ever-Virgin Mary',
        ambrose: 'Repose of St. Ambrose, Elder of Optina',
        seventhcouncilefathers: 'Fathers of the 7th Ecumenical Council (Nicea, 787)',
        kazan: 'Service to the Appearing of the Kazan Icon of the Theotokos',
        demetrius: 'Holy Great Martyr Demetrius of Thessalonica, the Myrrh-streamer',
        michaelsynaxis: 'Synaxis of the Holy Archangel Michael and the Bodiless Powers',
        nicholas: 'St. Nicholas, Archbishop of Myra in Lycia, the Wonderworker',
        circumcision: 'Circumcision of our Lord Jesus Christ and St. Basil the Great',
        findinghead1st: '1st and 2nd Finding of the Honorable Head of the Forerunner',
        fortymartyrs: 'Forty Holy Martyrs of Sebaste',
        johntheologianmay: 'Holy Apostle and Evangelist John the Theologian (May 8)',
        nicholastranslation: 'Translation of the Relics of St. Nicholas the Wonderworker',
        findinghead3rd: '3rd Finding of the Honorable Head of the Holy Forerunner',
        vladimir: 'St. Vladimir, Equal-to-the-Apostles, Grand Prince',
        sixcouncilfathers: 'Commemoration of the Fathers of the Six Ecumenical Councils',
        elijah: 'Holy Glorious Prophet Elijah',
        panteleimon: 'Holy Great Martyr and Healer Panteleimon',
        processioncross: 'Procession of the Precious and Life-giving Cross',
        forefatherssunday: 'Sunday of the Holy Forefathers (2nd Sunday before Nativity)',
        holyfathersnativity: 'Sunday of the Holy Fathers before the Nativity',
        sundayafternativity: 'Sunday after the Nativity of Christ',
        matins: 'Morning service (Matins)',
        menaionDay: 'The day\u2019s service from the Menaion (stichera, troparion, canon of the commemoration)',
        triodion: 'The day\u2019s service from the Lenten Triodion',
      },
    },

    bible: {
      selectBook: 'Select a book',
      selectChapter: 'Select a chapter',
      read: 'Read',
      loading: 'Loading...',
      noTextFound: 'No text found for this passage.',
      notAvailableOffline: 'Text not available for offline viewing.',
      ensureDataConverted: 'Bible text files are lazy-loaded on demand. Please ensure the data has been converted and is available.',
    },

    settings: {
      title: 'Settings',
      language: 'Interface Language',
      fontSettings: 'Church Slavonic Font',
      usePonomarFont: 'Use Ponomar font for Church Slavonic texts',
      usePonomarFontDesc: 'Use Ponomar font for Church Slavonic texts',
      fontPreview: 'Preview:',
      fontPreviewNoteActive: 'Ponomar font active — liturgical rank icons will render correctly',
      fontPreviewNoteInactive: 'System font active — rank icons will use Ponomar font regardless',
      fontSize: 'Liturgical Text Size: ',
      systemFont: 'System Default',
      theme: 'Color Scheme',
      themeDefault: 'Default',
      themeDark: 'Dark',
      themeSepia: 'Sepia',
      themeHC: 'High Contrast',
      bibleSettings: 'Bible',
      defaultTranslation: 'Default Translation',
      showVerseNumbers: 'Show verse numbers',
      verseNewLine: 'Each verse on a new line',
      bibleComments: {
        fullBible: 'Full Bible',
        ntOnly: 'NT only',
        otOnly: 'OT only',
        otProphets: 'OT Prophets',
      },
      calendarType: 'Default Calendar',
      julian: 'Julian',
      gregorian: 'Gregorian',
      about: 'About Ponomar',
      aboutText: ' is an Orthodox Church calendar application providing liturgical information, service texts, and Bible readings in multiple languages.',
      aboutAppName: 'Ponomar',
      aboutLicense: 'Based on the Ponomar Java desktop application by Aleksandr Andreev and Yuri Shardt. Licensed under GPL v3.',
      installPwa: 'Install Ponomar',
      offlineOfferTitle: 'Offline Data',
      offlineOfferText: 'If you plan to use the application without internet access, you should preload data for offline usage.',
      offlineOfferPreloadAll: 'Pre-load everything',
      offlineOfferChoose: 'Choose data to preload',
      offlineOfferSkip: 'Don\'t preload',
      offlineContent: 'Offline Content',
      offlineLangs: 'Languages to cache',
      offlineDataTypes: 'Data to cache',
      offlineLives: 'Lives',
      offlineCalendar: 'Calendar & Services',
      offlineMenaion: 'Menaion',
      offlineBible: 'Bible',
      offlinePreload: 'Preload',
      offlineClearCache: 'Clear cache',
      offlineCalculating: 'Calculating storage...',
      offlineDone: 'Done! Data cached for offline use.',
      offlineFailed: 'files failed to load (retry to attempt again)',
      offlineSelectLang: 'Please select at least one language.',
      offlineSelectAll: 'Select all',
      offlineCleared: 'Cache cleared.',
      offlineCacheInfo: '{0}, {2} files',
      locationTitle: 'Location',
      latitude: 'Latitude',
      longitude: 'Longitude',
      requestLocation: 'Request location',
      locationNote: 'Used for sunrise/sunset calculation',
    },

    common: {
      priest: 'Priest',
      reader: 'Reader',
      deacon: 'Deacon',
      choir: 'Choir',
      all: 'All',
    },
  },

  ru: {
    appName: '☦ Понома́рь',
    loading: 'Загрузка...',
    error: 'Ошибка',
    notAvailable: 'Недоступно',

    nav: {
      calendar: '📅 Календарь',
      service: '📖 Устав',
      bible: 'Библия',
      prayer: '📿 Молитвослов',
      akathists: '📜 Каноны и акафисты',
      parimii: '📖 Паримии',
      horologion: '⏰ Часослов',
      sbornik: '📚 Сборник',
      paraclete: '📗 Параклитика',
      irmologion: '🎵 Ирмологий',
      menaion: '📕 Минея',
      triodion: '📗 Триодь постная',
      settings: '⚙ Настройки',
      library: '📚 Библиотека',
      appTitle: 'Пономарь',
      festal: '📗 Праздники',
    },

    triodion: {
      title: 'Триодь постная',
      subtitle: 'Службы предпостных и великопостных недель и седмиц (церковнославянский язык)',
      sections: ["Неделя о мытаре и фарисее", "Неделя о блудном сыне", "Суббота мясопустная", "Неделя мясопустная", "Сырная седмица", "Суббота сыропустная", "Неделя сыропустная (Прощёное воскресенье)", "Понедельник первой седмицы", "Вторник первой седмицы", "Среда первой седмицы", "Четверг первой седмицы", "Пятница первой седмицы", "Суббота первой седмицы", "Неделя Торжества Православия", "Вторая седмица", "Суббота второй седмицы", "Неделя Григория Паламы", "Третья седмица", "Суббота третьей седмицы", "Неделя Крестопоклонная", "Четвертая седмица", "Суббота четвертой седмицы", "Неделя Иоанна Лествичника", "Пятая седмица", "Мариино стояние", "Суббота Акафиста", "Неделя Марии Египетской", "Седмица ваий", "Лазарева суббота", "Вербное воскресенье", "Великий Понедельник", "Великий Вторник", "Великая Среда", "Великий Четверг", "Великий Пяток", "Великая Суббота", "Стихи"],
    },

    menaion: {
      title: 'Минея',
      subtitle: 'Ежедневные службы святым на каждый день года (церковнославянский язык)',
    },

    irmologion: {
      title: 'Ирмологий',
      subtitle: 'Ирмосы и песнопения Октоиха и праздников (церковнославянский язык)',
      sections: ["Ирмосы первого гласа", "Ирмосы второго гласа", "Ирмосы третьего гласа", "Ирмосы четвертого гласа", "Ирмосы пятого гласа", "Ирмосы шестого гласа", "Ирмосы седьмого гласа", "Ирмосы восьмого гласа", "Ирмосы предпразднства Рождества", "Ирмосы предпразднства Крещения", "Церковные песнопения Божественной Литургии", "Господи, воззвах (вечерни и Преждеосвященные)", "Богородичны воскресные", "Богородичны на все дни", "Степенны", "Песни Троичные и стихи канонов", "Стихи воскресные и праздничные", "Указ о песнях и канонах в Великий пост", "Тропари воскресные", "Прокимны воскресные", "Тропари субботние", "Пасхальный канон", "Избранные псалмы", "Припевы праздничные на девятой песни"],
    },

    paraclete: {
      title: 'Параклитика (Октоих вседневный)',
      subtitle: 'Вседневные каноны и стихиры Октоиха, гласы 1–8 (церковнославянский язык)',
      days: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    },

    horologion: {
      title: 'Часослов',
      subtitle: 'Суточный круг богослужения (церковнославянский язык)',
      sections: {
        midnightDaily: 'Полунощница вседневная',
        midnightSaturday: 'Полунощница субботняя',
        midnightSunday: 'Полунощница воскресная',
        typica: 'Изобразительны',
        interhour1: 'Междочасие 1-го часа',
        interhour3: 'Междочасие 3-го часа',
        interhour6: 'Междочасие 6-го часа',
        interhour9: 'Междочасие 9-го часа',
        panagia: 'Чин о Панагии',
        mealBlessing: 'Благословение трапезы',
        smallCompline: 'Малое повечерие',
      },
    },

    sbornik: {
      title: 'Богослужебный сборник',
      subtitle: 'Справочный сборник: тропари, кондаки, богородичны и песни Священного Писания (церковнославянский язык)',
      sections: {
        sunday: 'Тропари и кондаки воскресные',
        weekday: 'Тропари и кондаки на всю седмицу',
        feast: 'Тропари и кондаки праздников по месяцам',
        lent: 'Тропари и кондаки св. Четыредесятницы',
        pentecost: 'Тропари и кондаки св. Пятидесятницы',
        common: 'Тропари и кондаки общие святым',
        theotokionSunday: 'Богородичны воскресные вечерние (8 гласов)',
        theotokion8tones: 'Богородичны осьми гласов',
        theotokionDismissal: 'Богородичны отпустительныя',
        katavasia: 'Катавасия во всё лето',
        trinity: 'Троичны осьми гласов',
        lamps: 'Светильны дневнии',
        exapostilaria: 'Ексапостиларии всея седмицы',
        songsFeasts: 'Песни Священного Писания: праздничнии',
        songsDaily: 'Песни Священного Писания: вседневнии',
        songsLent: 'Песни Священного Писания: Четыредесятницы',
      },
    },

    parimii: {
      title: 'Паримии',
      subtitle: 'Ветхозаветные чтения на праздники года и Великий пост (церковнославянский язык)',
      sections: {
        sept: 'Сентябрь',
        oct: 'Октябрь',
        nov: 'Ноябрь',
        dec: 'Декабрь',
        jan: 'Январь',
        feb: 'Февраль',
        mar: 'Март',
        apr: 'Апрель',
        may: 'Май',
        jun: 'Июнь',
        jul: 'Июль',
        aug: 'Август',
        cheeseWeek: 'Сырная седмица',
        lentWeek1: '1-я седмица Великого поста',
        lentWeek2: '2-я седмица Великого поста',
        lentWeek3: '3-я седмица Великого поста',
        lentWeek4: '4-я седмица Великого поста',
        lentWeek5: '5-я седмица Великого поста',
        palmWeek: 'Седмица Ваий (6-я седмица поста)',
        holyWeek: 'Страстная седмица',
        pentecostarion: 'Пятидесятница',
        commonSaints: 'Общие паримии святым',
      },
    },

    akathists: {
      title: 'Каноны и акафисты',
      subtitle: 'Из сборника канонов и акафистов (церковнославянский язык)',
      sections: {
        trinity: 'Канон ко Святой и Живоначальной Троице',
        jesusCompunction: 'Канон умилительный со акафистом ко Господу Иисусу Христу',
        akathistJesus: 'Акафист Сладчайшему Господу нашему Иисусу Христу',
        jesusPenitential: 'Канон покаянный ко Господу нашему Иисусу Христу',
        pascha: 'Канон Святыя Пасхи',
        nativity: 'Каноны Рождеству Христову',
        cross: 'Канон Честному и Животворящему Кресту',
        theotokosMoleben: 'Канон молебный ко Пресвятой Богородице (во всякой скорби)',
        theotokosThanksgiving: 'Канон благодарен со акафистом ко Пресвятой Богородице',
        akathistTheotokos: 'Акафист Пресвятой Владычице нашей Богородице',
        theotokosNativity: 'Каноны Рождеству Пресвятой Богородицы',
        pokrov: 'Канон Покрова Пресвятой Богородицы',
        utoliPechali: 'Канон пред иконой «Утоли моя печали»',
        skoroposlushnitsa: 'Канон пред иконой «Скоропослушница»',
        troeruchitsa: 'Канон пред иконой «Троеручица»',
        angels: 'Канон святым архангелам и ангелам',
        michael: 'Канон святому Архистратигу Михаилу',
        gabriel: 'Канон святому Архангелу Гавриилу',
        guardianAngel: 'Канон Ангелу-хранителю',
        forerunner: 'Канон святому Иоанну Предтече',
        nicholasCanon: 'Канон со акафистом святителю Николаю',
        akathistNicholas: 'Акафист святителю Николаю Чудотворцу',
        spiridon: 'Канон преподобному Спиридону Тримифунтскому',
        cyprian: 'Канон священномученику Киприану и мученице Иустине',
        panteleimon: 'Канон великомученику и целителю Пантелеимону',
        tryphon: 'Канон мученику Трифону',
        sergius: 'Канон преподобному Сергию Радонежскому',
        alexanderSvirsky: 'Канон преподобному Александру Свирскому',
        seraphim: 'Канон преподобному Серафиму Саровскому',
        johnKronstadt: 'Канон святому праведному Иоанну Кронштадтскому',
        maryEgypt: 'Канон преподобной Марии Египетской',
        murom: 'Канон святым чудотворцам Муромским Петру и Февронии',
        saintAnne: 'Канон святой Анне, матери Пресвятой Богородицы',
      },
    },

    prayer: {
      title: 'Молитвослов',
      subtitle: 'Личные молитвы (церковнославянский язык)',
      selectSection: 'Выберите раздел для чтения',
      notFound: 'Раздел не найден',
      empty: 'Нет содержимого',
      sections: {
        morning: 'Молитвы утренние',
        morningDesc: 'Утреннее молитвенное правило',
        diptychs: 'Помянник',
        diptychsDesc: 'Молитвы о живых и усопших',
        evening: 'Молитвы на сон грядущим',
        eveningDesc: 'Вечернее молитвенное правило',
        threeCanons: 'Три канона',
        threeCanonsDesc: 'Покаянный ко Господу Иисусу Христу, молебный ко Пресвятой Богородице, Ангелу-хранителю',
        communion: 'Последование ко Святому Причащению',
        communionDesc: 'Подготовительное правило ко Причащению',
        thanksgiving: 'Благодарственные молитвы по Святом Причащении',
        thanksgivingDesc: 'Молитвы после Причащения',
        ruleImpurity: 'Правило от осквернения',
        ruleImpurityDesc: 'Молитвы по осквернении',
        litiaDeparted: 'Чин литии о усопших',
        litiaDepartedDesc: 'Лития о усопших, совершаемая мирянином',
        twelvePsalms: 'Чин двенадцати псалмов',
        twelvePsalmsDesc: 'Чин, како подобает пети дванадесять псалмов особь',
        beginningEnding: 'Начало и окончание молитв',
        beginningEndingDesc: 'Молитва предначинательная и окончание молитв',
      },
    },

    calendar: {
      months: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ],
      monthsGenitive: [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ],
      dayNames: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      dayNamesFull: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
      rankLabels: {
        1: 'Тропарь',
        2: 'Антифон',
        3: 'Шестипеснец',
        4: 'Славословие',
        5: 'Полиелей',
        6: 'Великий святой',
        7: 'Великий праздник Богородичный',
        8: 'Великий праздник Господень',
      },
      rankIcons: {
        2: '🕃',
        3: '🕃',
        4: '🕂',
        5: '🕁',
        6: '🕀',
      },
      pascha: 'Пасха: ',
      pentecost: 'Пятидесятница: ',
      cleanMonday: 'Чистый понедельник: ',
      greatLent: ' · Великий пост',
      brightWeek: ' · Светлая седмица',
      weekAfterPentecost: 'седмица по Пятидесятнице',
      weekOrdSuffix: 'я',
      apostlesFast: ' · Петров пост',
      dormitionFast: ' · Успенский пост',
      nativityFast: ' · Рождественский пост',
      commemorations: 'Память святых',
      fastingRule: 'Правило поста',
      readings: 'Чтения',
      noCommemorations: 'Нет памятей на этот день',
      noReadings: 'Чтения не назначены',
      readingTypes: {
        apostol: 'Апостол',
        gospel: 'Евангелие',
        matins: 'Утреня',
        vespers: 'Вечерня',
        primes: '1-й час',
        terce: '3-й час',
        sext: '6-й час',
        none: '9-й час',
        liturgy: 'Литургия',
        '0': 'Вечерня',
        '1': 'Вечерня',
        '2': 'Вечерня',
        '3': 'Вечерня',
        '4': '4-е чтение',
        '5': '5-е чтение',
        '6': '6-е чтение',
        '7': '7-е чтение',
        '8': '8-е чтение',
        '9': '9-е чтение',
        '10': '10-е чтение',
        '11': '11-е чтение',
        '12': '12-е чтение',
        '13': '13-е чтение',
        '14': '14-е чтение',
        '15': '15-е чтение',
        A: 'Чтение',
      },
      defaultBibleVersion: 'ru/bible/synod',
      dayReading: ['для воскресенья', 'для понедельника', 'для вторника', 'для среды', 'для четверга', 'для пятницы', 'для субботы'],
      readSep: '; ',
      colon: ': ',
      dayOfYear: ' · День ',
      ofYear: ' года',
      tone: 'Глас ',
      gregorianDate: 'По гражданскому стилю',
      churchDate: 'По церковному стилю',
      annoMundi: 'Лета от сотворения мира',
      yearOfWorld: 'год от сотворения мира',
      fromYear: 'от РХ',
      fromAdam: 'от Адама',
      sunrise: 'Восход',
      sunset: 'Закат',
      moonPhase: 'Луна',
      noLocation: 'Укажите местоположение в настройках',
      moonDay: 'день',
    },

    services: {
      title: 'Богослужения',
      selectService: 'Выберите богослужение для просмотра.',
      serviceProducedNoOutput: 'Богослужение не дало текста.',
      errorLoading: 'Ошибка загрузки богослужения.',
      nodesAssembled: 'узлов собрано.',
      greatLent: ' · Великий пост',
      brightWeek: ' · Светлая седмица',
      apostlesFast: ' · Петров пост',
      dormitionFast: ' · Успенский пост',
      nativityFast: ' · Рождественский пост',
      tone: ' · Глас ',
      roleLabel: 'Чин:',
      rolePriest: 'Священник',
      roleReader: 'Чтец',
      roleAuto: 'Авто',
      serviceNames: {
        primes: 'Первый час',
        third: 'Третий час',
        sixth: 'Шестой час',
        ninth: 'Девятый час',
        vespers: 'Вечерня',
        liturgy: 'Божественная Литургия',
        royalhours: 'Царские часы',
        compline: 'Повечерие',
        greatcompline: 'Великое Повечерие',
        mariasstanding: 'Стояние Марии Египетской',
        passiongospels: 'Утреня 12 Евангелий Страстей',
        royalhoursfriday: 'Царские часы Великой Пятницы',
        lamentations: 'Утреня с Погребением (Похвалы)',
        palmsunday: 'Неделя Ваий (Вход Господень в Иерусалим)',
        greatmonday: 'Великий Понедельник',
        greattuesday: 'Великий Вторник',
        greatwednesday: 'Великая Среда',
        greatthursday: 'Великий Четверток',
        burialvespers: 'Вечерня с выносом Плащаницы',
        saturdayhours: 'Часы Великой Субботы',
        saturdayliturgy: 'Вечерня и Литургия Великой Субботы',
        saturdaymidnight: 'Полунощница Великой Субботы',
        pascha: 'Пасха',
        brightmonday: 'Светлый Понедельник',
        brighttuesday: 'Светлый Вторник',
        brightwednesday: 'Светлая Среда',
        brightthursday: 'Светлый Четверток',
        brightfriday: 'Светлая Пятница',
        brightsaturday: 'Светлая Суббота',
        antipascha: 'Антипасха (Неделя Фомы)',
        myrrhbearers: 'Неделя Жён-мироносиц',
        paralytic: 'Неделя о расслабленном',
        prepolovenie: 'Преполовение Пятидесятницы',
        samaritan: 'Неделя о самаряныне',
        blindman: 'Неделя о слепом',
        apodosis: 'Отдание Пасхи',
        ascension: 'Вознесение Господне',
        holyfathers: 'Неделя святых отцов Никейских',
        pentecostsaturday: 'Троицкая родительская суббота',
        pentecost: 'Пятидесятница (Святая Троица)',
        holyspirit: 'День Святаго Духа',
        allsaints: 'Неделя Всех Святых',
        russiansaints: 'Все Святые в земле Российской просиявшие',
        firstweekmonday: 'Понедельник первой седмицы',
        firstweektuesday: 'Вторник первой седмицы',
        firstweekwednesday: 'Среда первой седмицы',
        firstweekthursday: 'Четверток первой седмицы',
        firstweekfriday: 'Пятница первой седмицы',
        firstweeksaturday: 'Суббота первой седмицы',
        nativitytheotokos: 'Рождество Пресвятой Богородицы',
        exaltation: 'Воздвижение Креста Господня',
        vvedenie: 'Введение во храм Пресвятой Богородицы',
        nativityhours: 'Царские часы Навечерия Рождества',
        nativity: 'Рождество Христово',
        theophanyhours: 'Царские часы Навечерия Богоявления',
        theophany: 'Богоявление (Крещение Господне)',
        sretenie: 'Сретение Господне',
        annunciation: 'Благовещение Пресвятой Богородицы',
        forerunnerbirth: 'Рождество Иоанна Предтечи',
        peterpaul: 'Святых первоверховных апостолов Петра и Павла',
        transfiguration: 'Преображение Господне',
        dormition: 'Успение Пресвятой Богородицы',
        forerunnerbeheading: 'Усекновение главы Иоанна Предтечи',
        sergius: 'Преподобный Сергий Радонежский',
        johntheologiansep: 'Апостол и евангелист Иоанн Богослов',
        pokrov: 'Покров Пресвятой Богородицы',
        ambrose: 'Преподобный Амвросий Оптинский',
        seventhcouncilefathers: 'Святых отцов VII Вселенского Собора',
        kazan: 'Казанская икона Божией Матери',
        demetrius: 'Великомученик Димитрий Солунский',
        michaelsynaxis: 'Собор Архистратига Михаила',
        nicholas: 'Святитель Николай Чудотворец',
        circumcision: 'Обрезание Господне',
        findinghead1st: 'Первое и второе обретение главы Предтечи',
        fortymartyrs: 'Сорок мучеников Севастийских',
        johntheologianmay: 'Апостол Иоанн Богослов (8 мая)',
        nicholastranslation: 'Перенесение мощей Николая Чудотворца',
        findinghead3rd: 'Третье обретение главы Предтечи',
        vladimir: 'Равноапостольный князь Владимир',
        sixcouncilfathers: 'Святых отцов шести Вселенских Соборов',
        elijah: 'Пророк Илия',
        panteleimon: 'Великомученик и целитель Пантелеимон',
        processioncross: 'Происхождение Честных Древ Креста',
        forefatherssunday: 'Неделя святых Праотец',
        holyfathersnativity: 'Неделя святых Отец пред Рождеством',
        sundayafternativity: 'Неделя по Рождестве Христовом',
        matins: 'Утреня',
        menaionDay: 'Служба дня',
        triodion: 'Триодь',
      },
      serviceDescriptions: {
        primes: 'Час первый',
        third: 'Час третий',
        sixth: 'Час шестой',
        ninth: 'Час девятый',
        vespers: 'Вечернее богослужение (Вечерня)',
        liturgy: 'Главное богослужение (Божественная Литургия)',
        royalhours: 'Царские часы',
        compline: 'Ночное богослужение (Повечерие)',
        greatcompline: 'Великое Повечерие с каноном Андрея Критского',
        mariasstanding: 'Утреня с Великим каноном и житием Марии Египетской (Мариино стояние)',
        passiongospels: 'Утреня Великой Пятницы с двенадцатью Евангелиями Святых Страстей',
        royalhoursfriday: 'Царские часы Великой Пятницы (1-й, 3-й, 6-й, 9-й)',
        lamentations: 'Утреня Великой Субботы с Погребением Плащаницы (Похвалы)',
        palmsunday: 'Неделя Ваий: вечерня и утреня Входа Господня в Иерусалим',
        greatmonday: 'Великий Понедельник: суточный круг (утреня, часы, изобразительны, вечерня)',
        greattuesday: 'Великий Вторник: суточный круг (утреня, часы, изобразительны, вечерня)',
        greatwednesday: 'Великая Среда: суточный круг (утреня, часы, изобразительны, вечерня)',
        greatthursday: 'Великий Четверток: суточный круг (утреня, часы, изобразительны, вечерня)',
        burialvespers: 'Вечерня Великой Пятницы с выносом Плащаницы и малое повечерие',
        saturdayhours: 'Часы Великой Субботы (3-й, 6-й, 9-й) с изобразительными',
        saturdayliturgy: 'Вечерня Великой Субботы с Литургией св. Василия Великого (15 паремий)',
        saturdaymidnight: 'Полунощница Великой Субботы с каноном',
        pascha: 'Пасха: утреня, часы, Литургия и благословение артоса',
        brightmonday: 'Светлый Понедельник: утреня и Литургия',
        brighttuesday: 'Светлый Вторник: утреня и Литургия',
        brightwednesday: 'Светлая Среда: утреня и Литургия',
        brightthursday: 'Светлый Четверток: утреня и Литургия',
        brightfriday: 'Светлая Пятница: утреня и Литургия',
        brightsaturday: 'Светлая Суббота: утреня и вечерня',
        antipascha: 'Антипасха: Неделя св. апостола Фомы (2-я неделя по Пасхе)',
        myrrhbearers: 'Неделя Жён-мироносиц, прав. Иосифа и Никодима (3-я по Пасхе)',
        paralytic: 'Неделя о расслабленном (4-я по Пасхе)',
        prepolovenie: 'Преполовение Пятидесятницы',
        samaritan: 'Неделя о самаряныне (5-я по Пасхе)',
        blindman: 'Неделя о слепом (6-я по Пасхе)',
        apodosis: 'Отдание Пасхи',
        ascension: 'Вознесение Господа Бога и Спаса нашего Иисуса Христа',
        holyfathers: 'Неделя 318 святых отцов I Никейского Собора (7-я по Пасхе)',
        pentecostsaturday: 'Вселенская родительская суббота перед Пятидесятницей',
        pentecost: 'Пятидесятница: Сошествие Святаго Духа (Святая Троица)',
        holyspirit: 'День Святаго Духа (Духов день)',
        allsaints: 'Неделя Всех Святых (1-я по Пятидесятнице)',
        russiansaints: 'Собор Всех Святых, в земле Российской просиявших',
        firstweekmonday: 'Понедельник первой седмицы: полный суточный круг (утреня, часы, изобразительны, вечерня, великое повечерие)',
        firstweektuesday: 'Вторник первой седмицы: полный суточный круг',
        firstweekwednesday: 'Среда первой седмицы: полный суточный круг',
        firstweekthursday: 'Четверток первой седмицы: полный суточный круг',
        firstweekfriday: 'Пятница первой седмицы: суточный круг с Литургией Преждеосвященных Даров и благословением колива',
        firstweeksaturday: 'Суббота первой седмицы: утреня с каноном вмч. Феодору Тирону, часы и Литургия',
        nativitytheotokos: 'Рождество Пресвятой Владычицы нашей Богородицы и Приснодевы Марии (двунадесятый праздник)',
        exaltation: 'Всемирное Воздвижение Честного и Животворящего Креста (двунадесятый праздник)',
        vvedenie: 'Вход во храм Пресвятой Владычицы нашей Богородицы (двунадесятый праздник)',
        nativityhours: 'Царские часы в Навечерие Рождества Христова',
        nativity: 'Рождество по плоти Господа Бога и Спаса нашего Иисуса Христа (двунадесятый праздник)',
        theophanyhours: 'Царские часы в Навечерие Богоявления',
        theophany: 'Святое Богоявление, Крещение Господа Бога и Спаса нашего Иисуса Христа (двунадесятый праздник)',
        sretenie: 'Сретение Господа Бога и Спаса нашего Иисуса Христа (двунадесятый праздник)',
        annunciation: 'Благовещение Пресвятой Владычицы нашей Богородицы (двунадесятый праздник)',
        forerunnerbirth: 'Рождество Честного славного Пророка, Предтечи и Крестителя Иоанна (великий праздник)',
        peterpaul: 'Святых славных и всехвальных первоверховных апостолов Петра и Павла (великий праздник)',
        transfiguration: 'Святое Преображение Господа Бога и Спаса нашего Иисуса Христа (двунадесятый праздник)',
        dormition: 'Успение Пресвятой Владычицы нашей Богородицы и Приснодевы Марии (двунадесятый праздник)',
        forerunnerbeheading: 'Усекновение Честной главы славного Пророка, Предтечи и Крестителя Иоанна (великий праздник)',
        sergius: 'Преставление преподобного отца нашего Сергия, игумена Радонежского, чудотворца',
        johntheologiansep: 'Преставление святого апостола и евангелиста Иоанна Богослова',
        pokrov: 'Покров Пресвятой Владычицы нашей Богородицы и Приснодевы Марии',
        ambrose: 'Преставление преподобного отца нашего Амвросия, старца Оптинского',
        seventhcouncilefathers: 'Святых отцов седьмого Вселенского Собора (Никейского, 787 г.)',
        kazan: 'Служба явлению иконы Пресвятой Богородицы Казанской',
        demetrius: 'Святого славного великомученика Димитрия Мироточивого',
        michaelsynaxis: 'Собор святого Архистратига Михаила и прочих бесплотных сил',
        nicholas: 'Иже во святых отца нашего Николая, архиепископа Мир Ликийских, чудотворца',
        circumcision: 'Обрезание по плоти Господа нашего Иисуса Христа и память свт. Василия Великого',
        findinghead1st: 'Первое и второе обретение Честной главы Пророка, Предтечи и Крестителя Иоанна',
        fortymartyrs: 'Святых сорока мучеников, в Севастийском озере мучившихся',
        johntheologianmay: 'Святого славного апостола и евангелиста Иоанна Богослова (8 мая)',
        nicholastranslation: 'Перенесение Честных мощей иже во святых отца нашего Николая',
        findinghead3rd: 'Третье обретение Честной главы святого славного Пророка, Предтечи',
        vladimir: 'Святого равноапостольного великого князя Владимира, во святом крещении Василия',
        sixcouncilfathers: 'Память совершаем святых отец Вселенских шести Соборов',
        elijah: 'Святого славного Пророка Илии',
        panteleimon: 'Святого великомученика и целителя Пантелеимона',
        processioncross: 'Происхождение Честных Древ Животворящего Креста',
        forefatherssunday: 'Неделя святых Праотец (2-я пред Рождеством)',
        holyfathersnativity: 'Неделя святых Отец пред Рождеством Христовым',
        sundayafternativity: 'Неделя по Рождестве Христовом',
        matins: 'Утреннее богослужение (Утреня)',
        menaionDay: 'Служба дня из Минеи (стихиры, тропарь, канон памяти)',
        triodion: 'Служба дня из Триоди постной',
      },
    },

    bible: {
      selectBook: 'Выберите книгу',
      selectChapter: 'Выберите главу',
      read: 'Читать',
      loading: 'Загрузка...',
      noTextFound: 'Текст не найден для этого отрывка.',
      notAvailableOffline: 'Текст недоступен для просмотра в автономном режиме.',
      ensureDataConverted: 'Файлы библейского текста загружаются по требованию. Убедитесь, что данные сконвертированы и доступны.',
    },

    settings: {
      title: 'Настройки',
      language: 'Язык интерфейса',
      fontSettings: 'Шрифт церковнославянского',
      usePonomarFont: 'Использовать шрифт Понома́рь для церковнославянских текстов',
      usePonomarFontDesc: 'Использовать шрифт Понома́рь для церковнославянских текстов',
      fontPreview: 'Предпросмотр:',
      fontPreviewNoteActive: 'Шрифт Понома́рь активен — иконы чинов будут отображаться правильно',
      fontPreviewNoteInactive: 'Системный шрифт активен — иконы чинов будут использовать Понома́рь в любом случае',
      fontSize: 'Размер литургического текста: ',
      systemFont: 'Системный шрифт',
      theme: 'Цветовая схема',
      themeDefault: 'Стандартная',
      themeDark: 'Тёмная',
      themeSepia: 'Сепия',
      themeHC: 'Высокая контрастность',
      bibleSettings: 'Библия',
      defaultTranslation: 'Перевод по умолчанию',
      showVerseNumbers: 'Показывать номера стихов',
      verseNewLine: 'Каждый стих с новой строки',
      bibleComments: {
        fullBible: 'Полная Библия',
        ntOnly: 'Новый Завет',
        otOnly: 'Ветхий Завет',
        otProphets: 'Пророки',
      },
      calendarType: 'Календарь по умолчанию',
      julian: 'Юлианский',
      gregorian: 'Григорианский',
      about: 'О Понома́ре',
      aboutText: ' — приложение православного календаря, предоставляющее литургическую информацию, тексты служб и библейские чтения на нескольких языках.',
      aboutAppName: 'Пономарь',
      aboutLicense: 'Основано на Java-приложении Понома́рь от Александра Андреева и Юрия Шардт. Лицензия GPL v3.',
      installPwa: 'Установить Пономарь',
      offlineOfferTitle: 'Офлайн-данные',
      offlineOfferText: 'Если вы планируете использовать приложение без интернета, предзагрузите данные для офлайн-использования.',
      offlineOfferPreloadAll: 'Загрузить всё',
      offlineOfferChoose: 'Выбрать данные',
      offlineOfferSkip: 'Не загружать',
      offlineContent: 'Офлайн-контент',
      offlineLangs: 'Языки для кэширования',
      offlineDataTypes: 'Типы данных',
      offlineLives: 'Жития',
      offlineCalendar: 'Календарь и службы',
      offlineMenaion: 'Минея',
      offlineBible: 'Библия',
      offlinePreload: 'Загрузить',
      offlineClearCache: 'Очистить кэш',
      offlineCalculating: 'Расчёт размера...',
      offlineDone: 'Готово! Данные закэшированы для офлайн-использования.',
      offlineFailed: 'файлов не загружено (повторите для повторной попытки)',
      offlineSelectLang: 'Пожалуйста, выберите хотя бы один язык.',
      offlineSelectAll: 'Выбрать все',
      offlineCleared: 'Кэш очищен.',
      offlineCacheInfo: '{0}, {2} файлов',
      locationTitle: 'Местоположение',
      latitude: 'Широта',
      longitude: 'Долгота',
      requestLocation: 'Запросить местоположение',
      locationNote: 'Используется для расчёта восхода/заката',
    },

    common: {
      priest: 'Свящ.',
      reader: 'Чтец',
      deacon: 'Диакон',
      choir: 'Хор',
      all: 'Все',
    },
  },

  cu: {
    appName: '☦ Понома́рь',
    loading: 'Загрузка...',
    error: 'Ошибка',
    notAvailable: 'Недоступно',

    nav: {
      calendar: '📅 Календарь',
      service: '📖 Уставъ',
      bible: 'Библия',
      prayer: '📿 Молитвосло́въ',
      akathists: '📜 Кано́ны и҆ а҆ка́ѳїсты',
      parimii: '📖 Паремі́и',
      horologion: '⏰ Часосло́въ',
      sbornik: '📚 Сбо́рникъ',
      paraclete: '📗 Пара́клитїка',
      irmologion: '🎵 Їрмоло́гїй',
      menaion: '📕 Мїне́ѧ',
      triodion: '📗 Трїѡ́дь по́стнаѧ',
      settings: '⚙ Настройки',
      library: '📚 Библіоте́ка',
      appTitle: 'Понома́рь',
      festal: '📗 Пра́здники',
    },

    triodion: {
      title: 'Трїѡ́дь по́стнаѧ',
      subtitle: 'Слꙋ́жбы предпо́стныхъ и҆ великопо́стныхъ недѣ́ль и҆ седми́цъ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: ["Недѣ́лѧ ѡ҆ мытарѣ̀ и҆ фарїсе́и", "Недѣ́лѧ ѡ҆ блꙋ́дномъ сы́нѣ", "Сꙋббѡ́та мѧсопꙋ́стнаѧ", "Недѣ́лѧ мѧсопꙋ́стнаѧ", "Сы́рнаѧ седми́ца", "Сꙋббѡ́та сыропꙋ́стнаѧ", "Недѣ́лѧ сыропꙋ́стнаѧ (Проще́ное)", "Понедѣ́льникъ пе́рвыѧ седми́цы", "Вто́рникъ пе́рвыѧ седми́цы", "Сре́да пе́рвыѧ седми́цы", "Четверто́къ пе́рвыѧ седми́цы", "Пѧто́къ пе́рвыѧ седми́цы", "Сꙋббѡ́та пе́рвыѧ седми́цы", "Недѣ́лѧ Торжества̀ Правосла́вїѧ", "Втора́ѧ седми́ца", "Сꙋббѡ́та втора́ѧ седми́цы", "Недѣ́лѧ григо́рїа пала́мы", "Тре́тїѧ седми́ца", "Сꙋббѡ́та тре́тїѧ седми́цы", "Недѣ́лѧ Крестопокло́ннаѧ", "Четве́ртаѧ седми́ца", "Сꙋббѡ́та четве́ртыѧ седми́цы", "Недѣ́лѧ і҆ѡа́нна лѣ́ствичника", "Пѧ́таѧ седми́ца", "Марі́ино стоѧ́нїе", "Сꙋббѡ́та а҆ка́ѳїста", "Недѣ́лѧ марі́и є҆гѵ́петскїѧ", "Седми́ца ва̀їй", "Ла́зарева сꙋббѡ́та", "Вербное воскресе́нїе", "Вели́кїй понедѣ́льникъ", "Вели́кїй вто́рникъ", "Вели́каѧ сре́да", "Вели́кїй четверто́къ", "Вели́кїй пѧто́къ", "Вели́каѧ сꙋббѡ́та", "Стїхѝ"],
    },

    menaion: {
      title: 'Мїне́ѧ',
      subtitle: 'Вседне́вныѧ слꙋ́жбы ст҃ы̑мъ на кі́йждо де́нь го́да (церковнославѧ́нскїй ѧ҆зы́къ)',
    },

    irmologion: {
      title: 'Їрмоло́гїй',
      subtitle: 'Їрмосы̀ и҆ пѣснопѣ̑нїѧ ѡ҆ктѡ́иха и҆ пра́здникѡвъ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: ["Їрмосы̀ а҃-гѡ гла́са", "Їрмосы̀ в҃-гѡ гла́са", "Їрмосы̀ г҃-гѡ гла́са", "Їрмосы̀ д҃-гѡ гла́са", "Їрмосы̀ є҃-гѡ гла́са", "Їрмосы̀ ѕ҃-гѡ гла́са", "Їрмосы̀ з҃-гѡ гла́са", "Їрмосы̀ и҃-гѡ гла́са", "Їрмосы̀ предпра́зднства ржⷭ҇тва̀", "Їрмосы̀ предпра́зднства кр҃ще́нїѧ", "Церкѡ́вныѧ пѣснопѣ̑нїѧ бж҃е́ственныѧ лїтꙋргі́и", "Гдⷭ҇и воззва́хъ (вече́рни и҆ преждеѡсщ҃е́нныѧ)", "Бг҃оро́дичны воскрⷭ҇ны", "Бг҃оро́дичны на всѧ̑ дни̑", "Степе́нны", "Пѣ̑сни трⷪ҇чны и҆ стїхѝ кано́нѡвъ", "Стїхѝ воскрⷭ҇ны и҆ пра́здничны", "Ꙋка́зъ ѡ҆ пѣ́снехъ и҆ кано́нѣхъ въ вели́кїй по́стъ", "Тропарѝ воскрⷭ҇ны", "Прокі́мны воскрⷭ҇ны", "Тропарѝ сꙋббѡ́тнїи", "Кано́нъ па́схи", "И҆збра̑нныѧ ѱалмы̀", "Припѣ́вы пра́здничныѧ на десѧ́той пѣ́сни"],
    },

    paraclete: {
      title: 'Пара́клитїка (Ѡ҆ктѡ́ихъ вседне́вный)',
      subtitle: 'Вседне́вныѧ кано́ны и҆ стїхи̑ры ѡ҆ктѡ́иха, гла́сы а҃–и҃ (церковнославѧ́нскїй ѧ҆зы́къ)',
      days: ['Понедѣ́льникъ', 'Вто́рникъ', 'Сре́да', 'Четве́ртокъ', 'Пѧ́токъ', 'Сꙋббѡ́та'],
    },

    horologion: {
      title: 'Часосло́въ',
      subtitle: 'Вседне́вный крꙋ́гъ бг҃ослꙋже́нїѧ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: {
        midnightDaily: 'Полꙋ́нощница вседне́внаѧ',
        midnightSaturday: 'Полꙋ́нощница сꙋббѡ́тнаѧ',
        midnightSunday: 'Полꙋ́нощница воскрⷭ҇наѧ',
        typica: 'И҆зѡбрази́тельны',
        interhour1: 'Междоча́сїе а҃-гѡ часа̀',
        interhour3: 'Междоча́сїе г҃-гѡ часа̀',
        interhour6: 'Междоча́сїе ѕ҃-гѡ часа̀',
        interhour9: 'Междоча́сїе ѳ҃-гѡ часа̀',
        panagia: 'Чи́нъ ѡ҆ панагі́и',
        mealBlessing: 'Бл҃гослове́нїе трапе́зы',
        smallCompline: 'Ма́лое повече́рїе',
      },
    },

    sbornik: {
      title: 'Бг҃ослꙋже́бный сбо́рникъ',
      subtitle: 'Спра́вочный сбо́рникъ: тропарѝ, кондакѝ, бг҃оро́дичны и҆ пѣ́сни ст҃а́гѡ писа́нїѧ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: {
        sunday: 'Тропарѝ и҆ кондакѝ воскрⷭ҇ны',
        weekday: 'Тропарѝ и҆ кондакѝ во всю̀ седми́цꙋ',
        feast: 'Тропарѝ и҆ кондакѝ пра́здникѡвъ по мѣсѧцамъ',
        lent: 'Тропарѝ и҆ кондакѝ ст҃ы́ѧ четыредесѧ́тницы',
        pentecost: 'Тропарѝ и҆ кондакѝ ст҃ы́ѧ пѧтдесѧ́тницы',
        common: 'Тропарѝ и҆ кондакѝ ѻ҆́бщїи ст҃ы̑мъ',
        theotokionSunday: 'Бг҃оро́дичны воскрⷭ҇ны вече́рнїѧ (ѻ҆́смь гласѡ́въ)',
        theotokion8tones: 'Бг҃оро́дичны ѻ҆сьмѝ гласѡ́въ',
        theotokionDismissal: 'Бг҃оро́дичны ѿпꙋсти́тельныѧ',
        katavasia: 'Катава́сїа во всѐ лѣ́то',
        trinity: 'Трⷪ҇чны ѻ҆сьмѝ гласѡ́въ',
        lamps: 'Свѣти́льны дневні́и',
        exapostilaria: 'Є҆ѯапостїла́рїи всеѧ̀ седми́цы',
        songsFeasts: 'Пѣ́сни ст҃а́гѡ писа́нїѧ: пра́здничнїи',
        songsDaily: 'Пѣ́сни ст҃а́гѡ писа́нїѧ: вседне́внїи',
        songsLent: 'Пѣ́сни ст҃а́гѡ писа́нїѧ: четыредесѧ́тницы',
      },
    },

    parimii: {
      title: 'Паремі́и',
      subtitle: 'Ветхозавѣ́тныѧ чте́нїѧ на пра́здники го́да и҆ вели́кїй по́стъ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: {
        sept: 'Мѣ́сѧцъ септе́мврїй',
        oct: 'Мѣ́сѧцъ ѻ҆ктѡ́врїй',
        nov: 'Мѣ́сѧцъ ное́мврїй',
        dec: 'Мѣ́сѧцъ деке́мврїй',
        jan: 'Мѣ́сѧцъ і҆аннꙋа́рїй',
        feb: 'Мѣ́сѧцъ феѵрꙋа́рїй',
        mar: 'Мѣ́сѧцъ ма́ртъ',
        apr: 'Мѣ́сѧцъ а҆прі́ллїй',
        may: 'Мѣ́сѧцъ ма́їй',
        jun: 'Мѣ́сѧцъ і҆ꙋ́нїй',
        jul: 'Мѣ́сѧцъ і҆ꙋ́лїй',
        aug: 'Мѣ́сѧцъ а҆́ѵгꙋстъ',
        cheeseWeek: 'Сы́рнаѧ седми́ца',
        lentWeek1: 'Пе́рваѧ седми́ца вели́кагѡ поста̀',
        lentWeek2: 'Втора́ѧ седми́ца вели́кагѡ поста̀',
        lentWeek3: 'Тре́тїѧ седми́ца вели́кагѡ поста̀',
        lentWeek4: 'Четве́ртаѧ седми́ца вели́кагѡ поста̀',
        lentWeek5: 'Пѧ́таѧ седми́ца вели́кагѡ поста̀',
        palmWeek: 'Седми́ца ва̀їй (шеста́ѧ седми́ца поста̀)',
        holyWeek: 'Ст҃а́ѧ и҆ вели́каѧ седми́ца',
        pentecostarion: 'Ст҃ы́ѧ пентико́стїи',
        commonSaints: 'Паремі́и ѻ҆́бщыѧ ст҃ы̑мъ',
      },
    },

    akathists: {
      title: 'Кано́ны и҆ а҆ка́ѳїсты',
      subtitle: 'И҆з̾ собра́нїѧ кано́нѡвъ и҆ а҆ка́ѳїстѡвъ (церковнославѧ́нскїй ѧ҆зы́къ)',
      sections: {
        trinity: 'Канѡ́нъ ко ст҃ѣ́й и҆ живонача́льнѣй трⷪ҇цѣ',
        jesusCompunction: 'Канѡ́нъ ᲂу҆мили́тельный со а҆ка́ѳїстомъ ко гдⷭ҇ꙋ і҆и҃сꙋ хрⷭ҇тꙋ̀',
        akathistJesus: 'А҆ка́ѳїстъ сладча́йшемꙋ гдⷭ҇ꙋ і҆и҃сꙋ хрⷭ҇тꙋ̀',
        jesusPenitential: 'Канѡ́нъ покаѧ́нный ко гдⷭ҇ꙋ і҆и҃сꙋ хрⷭ҇тꙋ̀',
        pascha: 'Канѡ́нъ ст҃ы́ѧ па́схи',
        nativity: 'Канѡ́ны ржⷭ҇твꙋ̀ хрⷭ҇то́вꙋ',
        cross: 'Канѡ́нъ чⷭ҇тно́мꙋ и҆ животворѧ́щемꙋ крⷭ҇тꙋ̀',
        theotokosMoleben: 'Канѡ́нъ моле́бный ко прест҃ѣ́й бцⷣѣ (во всѧ́кой ско́рби)',
        theotokosThanksgiving: 'Канѡ́нъ бл҃года́ренъ со а҆ка́ѳїстомъ ко прест҃ѣ́й бцⷣѣ',
        akathistTheotokos: 'А҆ка́ѳїстъ прест҃ѣ́й влⷣчцѣ бцⷣѣ',
        theotokosNativity: 'Канѡ́ны ржⷭ҇твꙋ̀ прест҃ы́ѧ бцⷣы',
        pokrov: 'Канѡ́нъ покро́ва прест҃ы́ѧ бцⷣы',
        utoliPechali: 'Канѡ́нъ пред̾ і҆кѡ́ною «ᲂу҆толѝ моѧ̑ печа̑ли»',
        skoroposlushnitsa: 'Канѡ́нъ пред̾ і҆кѡ́ною «Скоропослꙋ́шница»',
        troeruchitsa: 'Канѡ́нъ пред̾ і҆кѡ́ною «Троерꙋ́чица»',
        angels: 'Канѡ́нъ ст҃ы̑мъ а҆рха́гг҃лѡмъ и҆ а҆́гг҃лѡмъ',
        michael: 'Канѡ́нъ ст҃а́гѡ а҆рхїстрати́га мїхаи́ла',
        gabriel: 'Канѡ́нъ ст҃а́гѡ а҆рха́гг҃ла гаврїи́ла',
        guardianAngel: 'Канѡ́нъ а҆́гг҃лꙋ храни́телю',
        forerunner: 'Канѡ́нъ ст҃о́мꙋ і҆ѡа́ннꙋ прⷣте́чи',
        nicholasCanon: 'Канѡ́нъ со а҆ка́ѳїстомъ ст҃и́телю нїкола́ю',
        akathistNicholas: 'А҆ка́ѳїстъ ст҃и́телю нїкола́ю чꙋдотво́рцꙋ',
        spiridon: 'Канѡ́нъ прпⷣбнагѡ спѷрїдѡ́на трїмѷфі́йскагѡ',
        cyprian: 'Канѡ́нъ сщ҃мч҃ка кѷпрїа́на и҆ мч҃цы і҆ꙋсті́ны',
        panteleimon: 'Канѡ́нъ вмч҃ка и҆ цѣли́телѧ пантелеи́мона',
        tryphon: 'Канѡ́нъ мч҃ника трѵ́фѡна',
        sergius: 'Канѡ́нъ прпⷣбнагѡ се́ргїа ра́донежскагѡ',
        alexanderSvirsky: 'Канѡ́нъ прпⷣбнагѡ а҆леѯа́ндра сви́рскагѡ',
        seraphim: 'Канѡ́нъ прпⷣбнагѡ серафі́ма саро́вскагѡ',
        johnKronstadt: 'Канѡ́нъ ст҃а́гѡ і҆ѡа́нна кроншта́дтскагѡ',
        maryEgypt: 'Канѡ́нъ прпⷣбныѧ марі́и є҆гѵ́птѧныни',
        murom: 'Канѡ́нъ ст҃ы́хъ мꙋ́ромскихъ чꙋдотво́рцєвъ петр҃а и҆ феѵрѡ́нїи',
        saintAnne: 'Канѡ́нъ ст҃ы́ѧ а҆́нны, ма́тере прест҃ы́ѧ бцⷣы',
      },
    },

    prayer: {
      title: 'Молитвосло́въ',
      subtitle: 'Ли́чныѧ мл҃твы (церковнославѧ́нскїй ѧ҆зы́къ)',
      selectSection: 'И҆зберетѝ раздѣ́лъ длѧ чте́нїѧ',
      notFound: 'Раздѣ́лъ не ѡ҆брѣ́тенъ',
      empty: 'Нѣ́сть содержа́нїѧ',
      sections: {
        morning: 'Мл҃твы ᲂу҆́трєннїѧ',
        morningDesc: 'Оу҆́треннее мл҃твенное пра́вило',
        diptychs: 'Помѧ́нникъ',
        diptychsDesc: 'Мл҃твы ѡ҆ живы́хъ и҆ ᲂу҆со́пшихъ',
        evening: 'Мл҃твы на со́нъ грѧдꙋ́щымъ',
        eveningDesc: 'Вече́рнее мл҃твенное пра́вило',
        threeCanons: 'Трѝ канѡ́на',
        threeCanonsDesc: 'Покаѧ́нный ко гдⷭ҇ꙋ і҆и҃сꙋ хрⷭ҇тꙋ̀, моле́бный ко прест҃ѣ́й бцⷣѣ, а҆́гг҃лꙋ храни́телю',
        communion: 'Послѣ́дованїе ко ст҃о́мꙋ причаще́нїю',
        communionDesc: 'Подготови́тельное пра́вило ко причаще́нїю',
        thanksgiving: 'Бл҃года́рствєнныѧ мл҃твы по ст҃ѣ́мъ причаще́нїи',
        thanksgivingDesc: 'Мл҃твы по́слѣ причаще́нїѧ',
        ruleImpurity: 'Пра́вило ѿ ѡ҆скверне́нїѧ',
        ruleImpurityDesc: 'Мл҃твы по ѡ҆скверне́нїи',
        litiaDeparted: 'Чи́нъ лїті́и ѡ҆ ᲂу҆со́пшихъ',
        litiaDepartedDesc: 'Лїті́ѧ ѡ҆ ᲂу҆со́пшихъ, соверша́емаѧ мі́рѧниномъ',
        twelvePsalms: 'Чи́нъ двана́десѧти ѱалмѡ́въ',
        twelvePsalmsDesc: 'Чи́нъ, ка́кѡ подоба́етъ пѣ́ти двана́десѧть ѱалмѡ́въ ѻ҆со́бь',
        beginningEnding: 'Нача́ло и҆ ѡ҆конча́нїе мл҃твъ',
        beginningEndingDesc: 'Мл҃тва предначина́тельнаѧ и҆ ѡ҆конча́нїе мл҃твъ',
      },
    },

    calendar: {
      months: [
        'Январь', 'Февраль', 'Мартъ', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Августъ', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ],
      monthsGenitive: [
        'января', 'февраля', 'марта', 'апрѣля', 'мая', 'іюня',
        'іюля', 'августа', 'септемврія', 'октоврія', 'ноемврія', 'декаврія'
      ],
      dayNames: ['Нед', 'Пон', 'Вто', 'Сре', 'Чет', 'Пят', 'Суб'],
      dayNamesFull: ['Неделя', 'Понедельникъ', 'Вторникъ', 'Среда', 'Четвергъ', 'Пятница', 'Суббота'],
      rankLabels: {
        1: 'Тропарь',
        2: 'Антифонъ',
        3: 'Шестопѣснецъ',
        4: 'Славословіе',
        5: 'Полиелей',
        6: 'Великій святой',
        7: 'Великій праздникъ Богородичный',
        8: 'Великій праздникъ Господень',
      },
      rankIcons: {
        2: '🕃',
        3: '🕃',
        4: '🕂',
        5: '🕁',
        6: '🕀',
      },
      pascha: 'Пасха: ',
      pentecost: 'Пятидесятница: ',
      cleanMonday: 'Чистый понедельникъ: ',
      greatLent: ' · Великій постъ',
      brightWeek: ' · Светлая седмица',
      weekAfterPentecost: 'седмица по Пѧтидесѧтницѣ',
      weekOrdSuffix: 'ѧ',
      apostlesFast: ' · Петровъ постъ',
      dormitionFast: ' · Успенскій постъ',
      nativityFast: ' · Рождественскій постъ',
      commemorations: 'Память святыхъ',
      fastingRule: 'Правило поста',
      readings: 'Чтения',
      noCommemorations: 'Нетъ памятей на сей день',
      noReadings: 'Чтения не назначаются',
      readingTypes: {
        apostol: 'А҆пⷭ҇лъ',
        gospel: 'Є҆ѵⷢ҇лїе',
        matins: 'Оу҆́тренѧ',
        vespers: 'Вече́рнѧ',
        primes: 'Ча́съ пе́рвый',
        terce: 'Ча́съ тре́тїй',
        sext: 'Ча́съ шесты́й',
        none: 'Ча́съ девѧ́тый',
        liturgy: 'Лїтꙋргі́ѧ',
        '0': 'Вече́рнѧ',
        '1': 'Вече́рнѧ',
        '2': 'Вече́рнѧ',
        '3': 'Вече́рнѧ',
        '4': '4-е чте́ніе',
        '5': '5-е чте́ніе',
        '6': '6-е чте́ніе',
        '7': '7-е чте́ніе',
        '8': '8-е чте́ніе',
        '9': '9-е чте́ніе',
        '10': '10-е чте́ніе',
        '11': '11-е чте́ніе',
        '12': '12-е чте́ніе',
        '13': '13-е чте́ніе',
        '14': '14-е чте́ніе',
        '15': '15-е чте́ніе',
        A: 'Чте́ніе',
      },
      defaultBibleVersion: 'cu/bible/elis',
      dayReading: ['длѧ̀ недѣ́ли', 'длѧ̀ понедѣ́льника', 'длѧ̀ вто́рника', 'длѧ̀ сре́ды', 'длѧ̀ четвертка̀', 'длѧ̀ пѧткѝ', 'длѧ̀ сꙋббѡ́ты'],
      readSep: ': ',
      colon: ': ',
      dayOfYear: ' · День ',
      ofYear: ' года',
      tone: 'Гласъ ',
      gregorianDate: 'По гражданскому стилю',
      churchDate: 'По церковному стилю',
      annoMundi: 'Лѣта отъ сотворенiя мiра',
      yearOfWorld: 'лѣта отъ сотворенiя мiра',
      fromYear: 'от РХ',
      fromAdam: 'от Адама',
      sunrise: 'Восходъ',
      sunset: 'Закатъ',
      moonPhase: 'Лꙋна̀',
      noLocation: 'Оу҆кажі́те мѣстоположе́нїе въ настройкахъ',
      moonDay: 'де́нь',
    },

    services: {
      title: 'Богослуженiя',
      selectService: 'Изберете богослуженiе для просмотра.',
      serviceProducedNoOutput: 'Богослуженiе не дало текста.',
      errorLoading: 'Ошибка загрузки богослуженiя.',
      nodesAssembled: 'узлов собрано.',
      greatLent: ' · Великій постъ',
      brightWeek: ' · Светлая седмица',
      apostlesFast: ' · Петровъ постъ',
      dormitionFast: ' · Успенскій постъ',
      nativityFast: ' · Рождественскій постъ',
      tone: ' · Гласъ ',
      roleLabel: 'Чинъ:',
      rolePriest: 'Священникъ',
      roleReader: 'Чтецъ',
      roleAuto: 'Авто',
      serviceNames: {
        primes: 'Первый часъ',
        third: 'Третий часъ',
        sixth: 'Шестой часъ',
        ninth: 'Девятый часъ',
        vespers: 'Вечерня',
        liturgy: 'Божественная Литургия',
        royalhours: 'Царскія часъ',
        compline: 'Повечерiе',
        greatcompline: 'Вели́кое Повече́рiе',
        mariasstanding: 'Стоѧ́нїе ма́ріи є҆гѵ́петскїѧ',
        passiongospels: 'Оу҆́тренѧ двана́десѧти є҆ѵⷢ҇лїй',
        royalhoursfriday: 'Ца́рскїѧ часы̀ вели́кагѡ пѧтка̀',
        lamentations: 'Оу҆́тренѧ со погребе́нїемъ',
        palmsunday: 'Недѣ́лѧ ва́їй (Вхо́дъ гдⷭ҇ень во і҆ерⷭ҇ли́мъ)',
        greatmonday: 'Вели́кїй понедѣ́льникъ',
        greattuesday: 'Вели́кїй вто́рникъ',
        greatwednesday: 'Вели́каѧ сре́да',
        greatthursday: 'Вели́кїй четверто́къ',
        burialvespers: 'Вече́рнѧ со и҆знесе́нїемъ плащани́цы',
        saturdayhours: 'Часы̀ вели́кїѧ сꙋббѡ́ты',
        saturdayliturgy: 'Вече́рнѧ и҆ литꙋргі́ѧ вели́кїѧ сꙋббѡ́ты',
        saturdaymidnight: 'Полꙋ́нощница вели́кїѧ сꙋббѡ́ты',
        pascha: 'Па́сха',
        brightmonday: 'Понедѣ́льникъ свѣ́тлыѧ седми́цы',
        brighttuesday: 'Вто́рникъ свѣ́тлыѧ седми́цы',
        brightwednesday: 'Сре́да свѣ́тлыѧ седми́цы',
        brightthursday: 'Четверто́къ свѣ́тлыѧ седми́цы',
        brightfriday: 'Пѧто́къ свѣ́тлыѧ седми́цы',
        brightsaturday: 'Сꙋббѡ́та свѣ́тлыѧ седми́цы',
        antipascha: 'Недѣ́лѧ а҆нтїпа́схи',
        myrrhbearers: 'Недѣ́лѧ ст҃ы́хъ же́нъ мѷроно́сицъ',
        paralytic: 'Недѣ́лѧ ѡ҆ разсла́бленнѣмъ',
        prepolovenie: 'Преполове́нїе ст҃ы́ѧ пѧтдесѧ́тницы',
        samaritan: 'Недѣ́лѧ ѡ҆ самарѧны́ни',
        blindman: 'Недѣ́лѧ ѡ҆ слѣпо́мъ',
        apodosis: 'Ѿда́нїе пра́здника па́схи',
        ascension: 'Вознесе́нїе гдⷭ҇не',
        holyfathers: 'Недѣ́лѧ ст҃ы́хъ ѻ҆тє́цъ нїке́йскихъ',
        pentecostsaturday: 'Сꙋббѡ́та ст҃ы́ѧ пѧтдесѧ́тницы',
        pentecost: 'Недѣ́лѧ ст҃ы́ѧ пентико́стїи',
        holyspirit: 'Понедѣ́льникъ ст҃а́гѡ дх҃а',
        allsaints: 'Недѣ́лѧ всѣ́хъ ст҃ы́хъ',
        russiansaints: 'Всѝ ст҃і́и въ землѝ рѡссі́йстей просїѧ́вшїи',
        firstweekmonday: 'Понедѣ́льникъ пе́рвыѧ седми́цы',
        firstweektuesday: 'Вто́рникъ пе́рвыѧ седми́цы',
        firstweekwednesday: 'Сре́да пе́рвыѧ седми́цы',
        firstweekthursday: 'Четверто́къ пе́рвыѧ седми́цы',
        firstweekfriday: 'Пѧто́къ пе́рвыѧ седми́цы',
        firstweeksaturday: 'Сꙋббѡ́та пе́рвыѧ седми́цы',
        nativitytheotokos: 'Ржⷭ҇тво̀ прест҃ы́ѧ бцⷣы',
        exaltation: 'Воздви́женїе крⷭ҇та̀ гдⷭ҇нѧ',
        vvedenie: 'Вхо́дъ во хра́мъ прест҃ы́ѧ бцⷣы',
        nativityhours: 'Ца́рскїѧ часы̀ навече́рїѧ ржⷭ҇тва̀',
        nativity: 'Ржⷭ҇тво̀ хрⷭ҇то́во',
        theophanyhours: 'Ца́рскїѧ часы̀ навече́рїѧ бг҃оѧвле́нїѧ',
        theophany: 'Ст҃о́е бг҃оѧвле́нїе',
        sretenie: 'Срѣ́тенїе гдⷭ҇не',
        annunciation: 'Бл҃говѣ́щенїе прест҃ы́ѧ бцⷣы',
        forerunnerbirth: 'Рождество̀ і҆ѡа́нна предте́чи',
        peterpaul: 'Ст҃ы́хъ а҆пⷭ҇лъ петр҃а и҆ па́ѵла',
        transfiguration: 'Преѡбраже́нїе гдⷭ҇не',
        dormition: 'Оу҆спе́нїе прест҃ы́ѧ бцⷣы',
        forerunnerbeheading: 'Оу҆сѣкнове́нїе главы̀ і҆ѡа́нна предте́чи',
        sergius: 'Прпⷣбный се́ргїй ра́донежскїй',
        johntheologiansep: 'А҆пⷭ҇лъ і҆ є҆ѵⷢ҇лі́стъ і҆ѡа́ннъ бг҃осло́въ',
        pokrov: 'Покро́въ прест҃ы́ѧ бцⷣы',
        ambrose: 'Прпⷣбный а҆мвро́сїй ѻ҆́птинскїй',
        seventhcouncilefathers: 'Ст҃ы́хъ ѻ҆тє́цъ ѕ҃-гѡ вселе́нскагѡ собо́ра',
        kazan: 'Каза́нскаѧ і҆кѡ́на бж҃їѧ мт҃ре',
        demetrius: 'Вмч҃къ дими́трїй солꙋ́нскїй',
        michaelsynaxis: 'Собо́ръ а҆рхїстрати́га мїхаи́ла',
        nicholas: 'Свт҃и́тель нїкола́й чꙋдотво́рецъ',
        circumcision: 'Ѡ҆брѣ́занїе гдⷭ҇не',
        findinghead1st: 'Пе́рвое и҆ второ́е ѡ҆брѣ́тенїе главы̀ предте́чи',
        fortymartyrs: 'М҃ мч҃никъ севасті́йскихъ',
        johntheologianmay: 'А҆пⷭ҇лъ і҆ѡа́ннъ бг҃осло́въ (ма́їа и҃)',
        nicholastranslation: 'Пренесе́нїе моще́й нїкола́а чꙋдотво́рца',
        findinghead3rd: 'Тре́тїе ѡ҆брѣ́тенїе главы̀ предте́чи',
        vladimir: 'Равноапⷭ҇льный кнѧ́зь влади́мїръ',
        sixcouncilfathers: 'Ст҃ы́хъ ѻ҆тє́цъ шестѝ вселе́нскихъ собо́рѡвъ',
        elijah: 'Прⷪ҇ро́къ и҆лїѧ̀',
        panteleimon: 'Вмч҃къ и҆ цѣли́тель пантелеи́монъ',
        processioncross: 'Происхожде́нїе честны́хъ дре́въ крⷭ҇та̀',
        forefatherssunday: 'Недѣ́лѧ ст҃ы́хъ пра́ѻтєцъ',
        holyfathersnativity: 'Недѣ́лѧ ст҃ы́хъ ѻ҆тє́цъ пред̾ ржⷭ҇тво́мъ',
        sundayafternativity: 'Недѣ́лѧ по ржⷭ҇твѣ̀ хрⷭ҇то́вѣ',
        matins: 'Оу҆́тренѧ',
        menaionDay: 'Слꙋ́жба днѧ̀',
        triodion: 'Трїѡ́дь',
      },
      serviceDescriptions: {
        primes: 'Часъ первый',
        third: 'Часъ третий',
        sixth: 'Часъ шестой',
        ninth: 'Часъ девятый',
        vespers: 'Вечернее богослуженiе (Вечерня)',
        liturgy: 'Главное богослуженiе (Божественнаꙗ Литургiꙗ)',
        royalhours: 'Царскія часъ',
        compline: 'Ночное богослуженiе (Повечерiе)',
        greatcompline: 'Вели́кое Повече́рiе съ кано́номъ а҆ндре́а кри́тскагѡ',
        mariasstanding: 'Оу҆́тренѧ съ вели́кимъ кано́номъ и҆ житїе́мъ ма́ріи є҆гѵ́петскїѧ (Марі́ино стоѧ́нїе)',
        passiongospels: 'Оу҆́тренѧ вели́кагѡ пѧтка̀ съ двана́десѧтїю є҆ѵⷢ҇лїами ст҃ы́хъ страсте́й',
        royalhoursfriday: 'Ца́рскїѧ часы̀ вели́кагѡ пѧтка̀ (а҃-й, г҃-й, ѕ҃-й, ѳ҃-й)',
        lamentations: 'Оу҆́тренѧ вели́кїѧ сꙋббѡ́ты со погребе́нїемъ плащани́цы (Похвалы̀)',
        palmsunday: 'Недѣ́лѧ ва́їй: вече́рнѧ и҆ ᲂу҆́тренѧ вхо́да гдⷭ҇нѧ во і҆ерⷭ҇ли́мъ',
        greatmonday: 'Вели́кїй понедѣ́льникъ: все́й де́нь (ᲂу҆́тренѧ, часы̀, и҆зѡбрази́тельна, вече́рнѧ)',
        greattuesday: 'Вели́кїй вто́рникъ: все́й де́нь (ᲂу҆́тренѧ, часы̀, и҆зѡбрази́тельна, вече́рнѧ)',
        greatwednesday: 'Вели́каѧ сре́да: все́й де́нь (ᲂу҆́тренѧ, часы̀, и҆зѡбрази́тельна, вече́рнѧ)',
        greatthursday: 'Вели́кїй четверто́къ: все́й де́нь (ᲂу҆́тренѧ, часы̀, и҆зѡбрази́тельна, вече́рнѧ)',
        burialvespers: 'Вече́рнѧ вели́кагѡ пѧтка̀ со и҆знесе́нїемъ плащани́цы и҆ ма́лое повече́рїе',
        saturdayhours: 'Часы̀ вели́кїѧ сꙋббѡ́ты (г҃-й, ѕ҃-й, ѳ҃-й) со и҆зѡбрази́тельными',
        saturdayliturgy: 'Вече́рнѧ вели́кїѧ сꙋббѡ́ты съ литꙋргі́ею ст҃а́гѡ васі́лїѧ вели́кагѡ (п҃є паре́мій)',
        saturdaymidnight: 'Полꙋ́нощница вели́кїѧ сꙋббѡ́ты съ кано́номъ',
        pascha: 'Па́сха: ᲂу҆́тренѧ, часы̀, лїтꙋргі́ѧ и҆ благослове́нїе а҆́ртоса',
        brightmonday: 'Понедѣ́льникъ свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ лїтꙋргі́ѧ',
        brighttuesday: 'Вто́рникъ свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ лїтꙋргі́ѧ',
        brightwednesday: 'Сре́да свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ лїтꙋргі́ѧ',
        brightthursday: 'Четверто́къ свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ лїтꙋргі́ѧ',
        brightfriday: 'Пѧто́къ свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ лїтꙋргі́ѧ',
        brightsaturday: 'Сꙋббѡ́та свѣ́тлыѧ седми́цы: ᲂу҆́тренѧ и҆ вече́рнѧ',
        antipascha: 'Недѣ́лѧ а҆нтїпа́схи: ст҃а́гѡ а҆пⷭ҇ла ѳомы̀ (в҃-ѧ недѣ́лѧ по па́сцѣ)',
        myrrhbearers: 'Недѣ́лѧ ст҃ы́хъ же́нъ мѷроно́сицъ, і҆ѡ́сифа и҆ нїкоди́ма (г҃-ѧ по па́сцѣ)',
        paralytic: 'Недѣ́лѧ ѡ҆ разсла́бленнѣмъ (д҃-ѧ по па́сцѣ)',
        prepolovenie: 'Преполове́нїе ст҃ы́ѧ пѧтдесѧ́тницы',
        samaritan: 'Недѣ́лѧ ѡ҆ самарѧны́ни (є҃-ѧ по па́сцѣ)',
        blindman: 'Недѣ́лѧ ѡ҆ слѣпо́мъ (ѕ҃-ѧ по па́сцѣ)',
        apodosis: 'Ѿда́нїе пра́здника па́схи',
        ascension: 'Вознесе́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀',
        holyfathers: 'Недѣ́лѧ ті́-хъ ст҃ы́хъ ѻ҆тє́цъ пе́рвагѡ собо́ра нїке́йскагѡ (з҃-ѧ по па́сцѣ)',
        pentecostsaturday: 'Вселе́нскаѧ роди́тельскаѧ сꙋббѡ́та пре́жде пѧтдесѧ́тницы',
        pentecost: 'Недѣ́лѧ ст҃ы́ѧ пентико́стїи: соше́ствїе ст҃а́гѡ дх҃а (ст҃а́ѧ трⷪ҇ца)',
        holyspirit: 'Понедѣ́льникъ ст҃а́гѡ дх҃а',
        allsaints: 'Недѣ́лѧ всѣ́хъ ст҃ы́хъ (а҃-ѧ по пѧтдесѧ́тницѣ)',
        russiansaints: 'Собо́ръ всѣ́хъ ст҃ы́хъ, въ землѝ рѡссі́йстей просїѧ́вшихъ',
        firstweekmonday: 'Понедѣ́льникъ пе́рвыѧ седми́цы: все́й де́нь (ᲂу҆́тренѧ, часы̀, и҆зѡбрази́тельна, вече́рнѧ, вели́кое повече́рїе)',
        firstweektuesday: 'Вто́рникъ пе́рвыѧ седми́цы: все́й де́нь',
        firstweekwednesday: 'Сре́да пе́рвыѧ седми́цы: все́й де́нь',
        firstweekthursday: 'Четверто́къ пе́рвыѧ седми́цы: все́й де́нь',
        firstweekfriday: 'Пѧто́къ пе́рвыѧ седми́цы: все́й де́нь съ лїтꙋргі́ею преждеѡсщ҃е́нныхъ и҆ бл҃гослове́нїемъ коли́ва',
        firstweeksaturday: 'Сꙋббѡ́та пе́рвыѧ седми́цы: ᲂу҆́тренѧ съ кано́номъ вмч. ѳеѡ́дѡрꙋ тї́рѡнꙋ, часы̀ и҆ лїтꙋргі́ѧ',
        nativitytheotokos: 'Ржⷭ҇тво̀ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы (двꙋнадесѧ́тый пра́здникъ)',
        exaltation: 'Всемі́рное воздви́женїе честна́гѡ и҆ животворѧ́щагѡ крⷭ҇та̀ (двꙋнадесѧ́тый пра́здникъ)',
        vvedenie: 'Вхо́дъ во хра́мъ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы (двꙋнадесѧ́тый пра́здникъ)',
        nativityhours: 'Ца́рскїѧ часы̀ въ навече́рїе ржⷭ҇тва̀ хрⷭ҇то́ва',
        nativity: 'Е҆́же по пло́ти ржⷭ҇тво̀ гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀ (двꙋнадесѧ́тый пра́здникъ)',
        theophanyhours: 'Ца́рскїѧ часы̀ въ навече́рїе просвѣще́нїѧ',
        theophany: 'Ст҃о́е бг҃оѧвле́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀ (двꙋнадесѧ́тый пра́здникъ)',
        sretenie: 'Срѣ́тенїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀ (двꙋнадесѧ́тый пра́здникъ)',
        annunciation: 'Бл҃говѣ́щенїе прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы (двꙋнадесѧ́тый пра́здникъ)',
        forerunnerbirth: 'Рождество̀ честна́гѡ сла́внагѡ прⷪ҇ро́ка, предте́чи и҆ крести́телѧ і҆ѡа́нна (вели́кїй пра́здникъ)',
        peterpaul: 'Ст҃ы́хъ сла́вныхъ и҆ всехва́льныхъ первоверхѡ́вныхъ а҆пⷭ҇лъ петр҃а и҆ па́ѵла (вели́кїй пра́здникъ)',
        transfiguration: 'Ст҃о́е преѡбраже́нїе гдⷭ҇а бг҃а и҆ сп҃са на́шегѡ і҆и҃са хрⷭ҇та̀ (двꙋнадесѧ́тый пра́здникъ)',
        dormition: 'Оу҆спе́нїе прест҃ы́ѧ сла́вныѧ влⷣчцы на́шеѧ бцⷣы (двꙋнадесѧ́тый пра́здникъ)',
        forerunnerbeheading: 'Оу҆сѣкнове́нїе честны́ѧ главы̀ сла́внагѡ прⷪ҇ро́ка, предте́чи и҆ крести́телѧ і҆ѡа́нна (вели́кїй пра́здникъ)',
        sergius: 'Преставле́нїе прпⷣбнагѡ ѻ҆тца̀ на́шегѡ се́ргїа, и҆гꙋ́мена ра́донежскагѡ, чꙋдотво́рца',
        johntheologiansep: 'Преставле́нїе ст҃а́гѡ а҆пⷭ҇ла и҆ є҆ѵⷢ҇лі́ста і҆ѡа́нна бг҃осло́ва',
        pokrov: 'Покро́въ прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы и҆ приснодв҃ы мр҃і́и',
        ambrose: 'Преставле́нїе прпⷣбнагѡ ѻ҆тца̀ на́шегѡ а҆мвро́сїа, ста́рца ѻ҆́птинскагѡ',
        seventhcouncilefathers: 'Ст҃ы́хъ ѻ҆тє́цъ седма́гѡ вселе́нскагѡ собо́ра, и҆̀же въ нїке́и',
        kazan: 'Слꙋ́жба ꙗ҆вле́нїю і҆кѡ́ны прест҃ы́ѧ влⷣчцы на́шеѧ бцⷣы каза́нскїѧ',
        demetrius: 'Ст҃а́гѡ и҆ сла́внагѡ великомꙋ́ченика дими́трїа мѷрото́чца',
        michaelsynaxis: 'Собо́ръ ст҃а́гѡ а҆рхїстрати́га мїхаи́ла и҆ про́чихъ безпло́тныхъ си́лъ',
        nicholas: 'И҆́же во ст҃ы́хъ ѻ҆тца̀ на́шегѡ нїкола́а, а҆рхїепі́скопа мѷрлѷкі́йскагѡ, чꙋдотво́рца',
        circumcision: 'Е҆́же по пло́ти ѡ҆брѣ́занїе гдⷭ҇а на́шегѡ і҆и҃са хрⷭ҇та̀ и҆ ст҃а́гѡ васі́лїѧ вели́кагѡ',
        findinghead1st: 'Пе́рвое и҆ второ́е ѡ҆брѣ́тенїе честны́ѧ главы̀ прⷣте́чевы',
        fortymartyrs: 'Ст҃ы́хъ м҃ мч҃никъ, въ севасті́йстѣмъ є҆́зерѣ мꙋ́чившихсѧ',
        johntheologianmay: 'Ст҃а́гѡ сла́внагѡ а҆пⷭ҇ла и҆ є҆ѵⷢ҇лі́ста і҆ѡа́нна бг҃осло́ва (ма́їа и҃-го)',
        nicholastranslation: 'Пренесе́нїе честны́хъ моще́й и҆́же во ст҃ы́хъ ѻ҆тца̀ на́шегѡ нїкола́а',
        findinghead3rd: 'Тре́тїе ѡ҆брѣ́тенїе честны́ѧ главы̀ свѧта́гѡ сла́внагѡ прⷪ҇ро́ка, предте́чи',
        vladimir: 'Ст҃а́гѡ равноапⷭ҇ла вели́кагѡ кнѧ́зѧ влади́мїра, нарече́ннагѡ во ст҃ѣ́мъ кр҃щенїи васи́лїа',
        sixcouncilfathers: 'Па́мѧть соверша́емъ ст҃ы́хъ ѻ҆тє́цъ вселе́нскихъ шестѝ собо́рѡвъ',
        elijah: 'Ст҃а́гѡ сла́внагѡ прⷪ҇ро́ка и҆лїѝ',
        panteleimon: 'Ст҃а́гѡ великомч҃ника и҆ цѣли́телѧ пантелеи́мона',
        processioncross: 'Происхожде́нїе честны́хъ дре́въ, честна́гѡ и҆ животворѧ́щагѡ крⷭ҇та̀',
        forefatherssunday: 'Недѣ́лѧ ст҃ы́хъ пра́ѻтєцъ (в҃-ѧ пред̾ ржⷭ҇тво́мъ)',
        holyfathersnativity: 'Недѣ́лѧ пред̾ ржⷭ҇тво́мъ хрⷭ҇то́вымъ ст҃ы́хъ ѻ҆ц҃ъ',
        sundayafternativity: 'Недѣ́лѧ по ржⷭ҇твѣ̀ хрⷭ҇то́вѣ',
        matins: 'Оу҆́треннее богослуженiе (Оу҆́тренѧ)',
        menaionDay: 'Слꙋ́жба днѧ̀ и҆з̾ мїне́и (стїхи̑ры, тропа́рь, кано́нъ па́мѧти)',
        triodion: 'Слꙋ́жба днѧ̀ и҆з̾ трїѡ́ди по́стныѧ',
      },
    },

    bible: {
      selectBook: 'Изберете книгу',
      selectChapter: 'Изберете главу',
      read: 'Читати',
      loading: 'Загрузка...',
      noTextFound: 'Текстъ не найденъ для сего отрывка.',
      notAvailableOffline: 'Текстъ недоступенъ для просмотра въ автономномъ режиме.',
      ensureDataConverted: 'Файлы библейскаго текста загружаются по требованiю. Убедитесь, что данные сконвертированы и доступны.',
    },

    settings: {
      title: 'Настройки',
      language: 'Языкъ интерфейса',
      fontSettings: 'Шрифтъ церковнославянскаго',
      usePonomarFont: 'Использовать шрифтъ Понома́рь для церковнославянскихъ текстовъ',
      usePonomarFontDesc: 'Использовать шрифтъ Понома́рь для церковнославянскихъ текстовъ',
      fontPreview: 'Предпросмотръ:',
      fontPreviewNoteActive: 'Шрифтъ Понома́рь активенъ — иконы чинѣвъ будутъ отображатися правильно',
      fontPreviewNoteInactive: 'Системный шрифтъ активенъ — иконы чинѣвъ будутъ использовать Понома́рь въ любомъ случаи',
      fontSize: 'Размеръ литургическаго текста: ',
      systemFont: 'Системный шрифтъ',
      theme: 'Цвѣтова́ѧ схе́ма',
      themeDefault: 'Станда́ртнаѧ',
      themeDark: 'Тёмнаѧ',
      themeSepia: 'Се́пїѧ',
      themeHC: 'Высо́каѧ контра́стность',
      bibleSettings: 'Библия',
      defaultTranslation: 'Переводъ по умолчанiю',
      showVerseNumbers: 'Показывать номера стиховъ',
      verseNewLine: 'Каждый стихъ съ новыя строки',
      bibleComments: {
        fullBible: 'Полная Библія',
        ntOnly: 'Новый Завѣтъ',
        otOnly: 'Ветхій Завѣтъ',
        otProphets: 'Пророцы',
      },
      calendarType: 'Календарь по умолчанию',
      julian: 'Юліанскій',
      gregorian: 'Григоріанскій',
      about: 'О Понома́ри',
      aboutText: ' — приложенiе православнаго календаря, предоставляющее литургическiю информацию, тексты службъ и библейскія чтения на нескольких языкахъ.',
      aboutAppName: 'Пономарь',
      aboutLicense: 'Основано на Java-приложенiи Понома́рь отъ Александра Андреева и Юрия Шардт. Лицензия GPL v3.',
      installPwa: 'Оустановити Понома́рь',
      offlineOfferTitle: 'Офлайн-данныѧ',
      offlineOfferText: 'А҆́ще плани́рꙋете и҆спо́льзовати приложе́нїе без̾ и҆нтернета, предзагризите да́нныѧ длѧ офлайн-потребле́нїѧ.',
      offlineOfferPreloadAll: 'Загризи́ти всѧ̑',
      offlineOfferChoose: 'И҆збра́ти да́нныѧ',
      offlineOfferSkip: 'Не загрꙋжа́ти',
      offlineContent: 'Офлайн-контентъ',
      offlineLangs: 'Языки для кеширования',
      offlineDataTypes: 'Типы данныхъ',
      offlineLives: 'Житїя',
      offlineCalendar: 'Календарь и службы',
      offlineMenaion: 'Минїа',
      offlineBible: 'Би́блїа',
      offlinePreload: 'Загрузити',
      offlineClearCache: 'Очистити кешъ',
      offlineCalculating: 'Расчётъ размѣра...',
      offlineDone: 'Готово! Данныя закешированы для офлайн-потребленїя.',
      offlineFailed: 'фа́йловъ не загружено (повтори́те для повторной попытки)',
      offlineSelectLang: 'Пожалуйста, изберите хотя бы единъ языкъ.',
      offlineSelectAll: 'И҆збра́ти всѧ̑',
      offlineCleared: 'Кешъ очищенъ.',
      offlineCacheInfo: '{0}, {2} фа́йловъ',
      locationTitle: 'Мѣстоположе́нїе',
      latitude: 'Широта̀',
      longitude: 'Долгота̀',
      requestLocation: 'Запроси́ти мѣстоположе́нїе',
      locationNote: 'И҆спо́льзꙋетсѧ длѧ ра́счета восхо́да / зака́та',
    },

    common: {
      priest: 'Свящ.',
      reader: 'Чтецъ',
      deacon: 'Диаконъ',
      choir: 'Хоръ',
      all: 'Все',
    },
  },
};

/**
 * Get translations for a specific language.
 * Falls back to English if language not found.
 */
export function getTranslations(lang: LanguageCode): Translations {
  return translations[lang] || translations.en;
}

/**
 * Get a specific translation key with fallback.
 */
export function t(lang: LanguageCode, key: string, ...args: string[]): string {
  const tr = getTranslations(lang);
  const keys = key.split('.');
  let value: unknown = tr;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = (value as Record<string, unknown>)[k2];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  if (typeof value === 'string') {
    return args.length > 0 ? value.replace(/{(\d+)}/g, (_, i) => args[i] ?? '') : value;
  }

  return key;
}