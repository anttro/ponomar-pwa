/**
 * Fasting rules engine.
 * Evaluates Fasting.xml rules against dayInfo to determine fasting level for a given day.
 *
 * Fasting.java is part of the Ponomar program.
 * Copyright 2009 Yuri Shardt.
 * GPL v3 — see LICENSE.
 */

import { evalBool } from './evaluator';
import type { EvalContext } from './types';

/** 7-bit fasting case string. Each bit: 1=permitted, 0=forbidden. */
export type FastingCase = string;

export interface FastingPeriod {
  cmd: string;
  rules: FastingRule[];
}

export interface FastingRule {
  case: FastingCase;
  cmd: string;
}

export interface FastingResult {
  case: FastingCase;
  level: number; // 0-6
  description: string;
  allowed: string[];
  forbidden: string[];
}

const FOOD_NAMES_LOCALIZED: Record<string, string[]> = {
  en: ['meat', 'dairy products', 'fish', 'caviar', 'oil', 'wine', 'dry food'],
  ru: ['мясо', 'молочные продукты', 'рыба', 'рыбная икра', 'растительное масло', 'вино', 'сухоядение'],
  cu: ['мѧ́со', 'мла҆чные продꙋ́кты', 'ры́ба', 'ры́бнаѧ и҆́кра', 'є҆ле́й', 'ві́но̀', 'сухоѧденїе'],
  fr: ['le viande', 'les produits lactières', 'le poisson', 'le caviar', "l'huile", 'le vin', 'des nourritures secs'],
  el: ['meat', 'dairy products', 'fish', 'caviar', 'oil', 'wine', 'dry food'],
  zh: ['肉类和动物制品', '乳制品', '鱼', '鱼子', '油', '酒', '干食'],
  'zh-Hant': ['肉類和動物製品', '乳製品', '魚', '魚子', '油', '酒', '幹食'],
};

/**
 * Parse fasting XML data. The XML is pre-converted to JSON at build time.
 */
export function parseFastingData(data: FastingPeriod[]): FastingPeriod[] {
  return data;
}

/**
 * Evaluate fasting rules for a given day.
 * Returns the fasting case (7-bit string) based on matching rules.
 */
export function evaluateFasting(
  periods: FastingPeriod[],
  ctx: EvalContext,
  lang: string = 'en'
): FastingResult {
  let currentCase: FastingCase = '1111111'; // Default: no fast

  // Process periods in order; later periods can override earlier ones
  for (const period of periods) {
    // Check if this period applies to today
    if (period.cmd && !evalBool(period.cmd, ctx)) {
      continue;
    }

    // Evaluate rules within this period
    for (const rule of period.rules) {
      if (rule.cmd && !evalBool(rule.cmd, ctx)) {
        continue;
      }
      // This rule matches — apply it
      currentCase = rule.case;
    }
  }

  return formatFastingResult(currentCase, lang);
}

/**
 * Format a fasting case into a human-readable result.
 */
function formatFastingResult(fastCase: FastingCase, lang: string = 'en'): FastingResult {
  const names = FOOD_NAMES_LOCALIZED[lang] || FOOD_NAMES_LOCALIZED.en;
  const allowed: string[] = [];
  const forbidden: string[] = [];

  // Case format: meat,cheese,fish,caviar,oil,wine,dryFood
  // Index 0 = meat, 6 = dry food (leftmost = highest food, rightmost = lowest)
  for (let i = 0; i < 7; i++) {
    const permitted = fastCase[i] === '1';
    if (permitted) {
      allowed.push(names[i]);
    } else {
      forbidden.push(names[i]);
    }
  }

  // Determine fasting level
  let level = 0;
  switch (fastCase) {
    case '1111111': level = 0; break; // No fast
    case '0111111': level = 1; break; // Meat excluded
    case '0011111': level = 2; break; // Fish permitted
    case '0001111': level = 3; break; // Caviar permitted
    case '0000111': level = 4; break; // Wine and oil
    case '0000011': level = 5; break; // Without oil
    case '0000001': level = 6; break; // Dry food only (xerophagy)
    case '0000000': level = 7; break; // Complete fast
    default: level = 0;
  }

  // Generate description
  const description = generateDescription(fastCase, allowed, forbidden, lang);

  return {
    case: fastCase,
    level,
    description,
    allowed,
    forbidden,
  };
}

function generateDescription(
  fastCase: FastingCase,
  allowed: string[],
  forbidden: string[],
  lang: string
): string {
  if (fastCase === '1111111') {
    return lang === 'ru' ? 'Поста нет' : lang === 'cu' ? 'Поста нѣтъ' : 'No fast';
  }
  if (fastCase === '0000000') {
    return lang === 'ru' ? 'Полное воздержание от пищи' : lang === 'cu' ? 'Полное воздержаніе отъ пищи' : 'Complete fast (no food)';
  }

  const labels: Record<string, { permitted: string; forbidden: string; is: string; are: string }> = {
    en: { permitted: 'Permitted', forbidden: 'Forbidden', is: 'is', are: 'are' },
    ru: { permitted: 'Разрешено', forbidden: 'Запрещено', is: '', are: '' },
    cu: { permitted: 'Позволено', forbidden: 'Запрещено', is: '', are: '' },
  };
  const L = labels[lang] || labels.en;

  if (allowed.length === 0) {
    return `${L.forbidden}: ${forbidden.join(', ')}`;
  }
  if (forbidden.length === 0) {
    return `${L.permitted}: ${allowed.join(', ')}`;
  }
  const verb = allowed.length === 1 ? L.is : L.are;
  const verbF = forbidden.length === 1 ? L.is : L.are;
  return `${L.permitted} ${verb} ${allowed.join(', ')}. ${L.forbidden} ${verbF} ${forbidden.join(', ')}`;
}
