/**
 * Service Rules — determines which service template to use for a given day.
 * Port of Ponomar/ServiceInfo.java.
 */

import { evalBool } from './evaluator';
import type { EvalContext } from './types';

export interface ServiceRuleEntry {
  type: string;
  troparion?: string;
  pickT?: number;
  kontakion?: string;
  pickK?: number;
  lentenk?: number;
  [key: string]: string | number | undefined;
}

export interface ServiceRulesData {
  periods: {
    cmd: string;
    rules: {
      type: string;
      attrs: Record<string, string>;
    }[];
  }[];
}

/**
 * Evaluate service rules for a given day.
 * Returns the matching service configuration.
 */
export function evaluateServiceRules(
  data: ServiceRulesData,
  serviceType: string, // e.g., "VESPERS", "LITURGY", "MATINS"
  ctx: EvalContext
): ServiceRuleEntry | null {
  let result: ServiceRuleEntry | null = null;

  for (const period of data.periods) {
    if (period.cmd && !evalBool(period.cmd, ctx)) {
      continue;
    }

    for (const rule of period.rules) {
      if (rule.type === serviceType) {
        result = { type: rule.type, ...rule.attrs };
      }
    }
  }

  return result;
}
