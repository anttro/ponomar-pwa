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
    settings: string;
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
      matins: string;
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
      matins: string;
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
    aboutLicense: string;
    installPwa: string;
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
      bible: '☦ Bible',
      settings: '⚙ Settings',
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
        matins: 'Matins',
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
        matins: 'Morning service (Matins)',
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
      aboutText: 'Ponomar is an Orthodox Church calendar application providing liturgical information, service texts, and Bible readings in multiple languages.',
      aboutLicense: 'Based on the Ponomar Java desktop application by Aleksandr Andreev and Yuri Shardt. Licensed under GPL v3.',
      installPwa: 'Install Ponomar',
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
      bible: '☦ Библия',
      settings: '⚙ Настройки',
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
        matins: 'Утреня',
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
        matins: 'Утреннее богослужение (Утреня)',
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
      aboutText: 'Понома́рь — приложение православного календаря, предоставляющее литургическую информацию, тексты служб и библейские чтения на нескольких языках.',
      aboutLicense: 'Основано на Java-приложении Понома́рь от Александра Андреева и Юрия Шардт. Лицензия GPL v3.',
      installPwa: 'Установить Пономарь',
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
      bible: '☦ Библия',
      settings: '⚙ Настройки',
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
        matins: 'Оу҆́тренѧ',
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
        matins: 'Оу҆́треннее богослуженiе (Оу҆́тренѧ)',
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
      aboutText: 'Понома́рь — приложенiе православнаго календаря, предоставляющее литургическiю информацию, тексты службъ и библейскія чтения на нескольких языкахъ.',
      aboutLicense: 'Основано на Java-приложенiи Понома́рь отъ Александра Андреева и Юрия Шардт. Лицензия GPL v3.',
      installPwa: 'Оустановити Понома́рь',
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