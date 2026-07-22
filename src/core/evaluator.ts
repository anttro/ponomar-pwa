/**
 * Expression evaluator — recursive descent parser.
 * Faithful port of Ponomar/StringOp.java to TypeScript.
 * Supports: ||, &&, ==, !=, <, >, <=, >=, +, -, *, /, %, unary !, unary -, true/false, variables.
 *
 * StringOp.java is part of the Ponomar program.
 * Copyright 2007 Aleksandr Andreev and Yuri Shardt.
 * See LICENSE for redistribution terms.
 */

import type { EvalContext } from './types';

function bool2double(expr: boolean): number {
  return expr ? 1.0 : 0.0;
}

/**
 * Evaluate a boolean expression using dayInfo variable context.
 * Returns true if the expression evaluates to a non-zero number.
 */
export function evalBool(expression: string, ctx: EvalContext): boolean {
  return evalNum(expression, ctx) !== 0;
}

/**
 * Evaluate a numeric expression.
 * Fully obeys correct order of operations (recursive descent).
 */
export function evalNum(expression: string, ctx: EvalContext): number {
  const parser = new ExprParser(expression.trim(), ctx);
  return parser.parseOr();
}

class ExprParser {
  private pos = 0;
  private readonly src: string;
  private readonly ctx: EvalContext;

  constructor(expression: string, ctx: EvalContext) {
    // Strip all spaces for tokenization (matches Java behavior)
    this.src = expression.replace(/\s/g, '');
    this.ctx = ctx;
  }

  private peek(): string {
    return this.pos < this.src.length ? this.src[this.pos] : '';
  }

  private advance(): string {
    const ch = this.src[this.pos];
    this.pos++;
    return ch;
  }

  private peekTwo(): string {
    return this.src.substring(this.pos, this.pos + 2);
  }

  /**
   * Read a token: number, variable name, or keyword (true/false).
   */
  private readToken(): string {
    // Number
    if (/[0-9.]/.test(this.peek())) {
      let num = '';
      while (this.pos < this.src.length && /[0-9.eE+\-]/.test(this.peek())) {
        num += this.advance();
      }
      return num;
    }
    // Variable or keyword
    if (/[a-zA-Z_]/.test(this.peek())) {
      let name = '';
      while (this.pos < this.src.length && /[a-zA-Z_0-9]/.test(this.peek())) {
        name += this.advance();
      }
      return name;
    }
    return '';
  }

  /**
   * OR operator: lowest precedence.
   * expr || expr
   */
  parseOr(): number {
    let left = this.parseAnd();
    while (this.pos < this.src.length && this.peekTwo() === '||') {
      this.pos += 2;
      const right = this.parseAnd();
      left = bool2double(evalBool(String(left !== 0), this.ctx) || evalBool(String(right !== 0), this.ctx));
    }
    return left;
  }

  /**
   * AND operator.
   */
  parseAnd(): number {
    let left = this.parseEquality();
    while (this.pos < this.src.length && this.peekTwo() === '&&') {
      this.pos += 2;
      const right = this.parseEquality();
      left = bool2double(evalBool(String(left !== 0), this.ctx) && evalBool(String(right !== 0), this.ctx));
    }
    return left;
  }

  /**
   * Equality: == and !=
   */
  parseEquality(): number {
    let left = this.parseComparison();
    while (this.pos < this.src.length) {
      if (this.peekTwo() === '==') {
        this.pos += 2;
        const right = this.parseComparison();
        left = bool2double(left === right);
      } else if (this.peekTwo() === '!=') {
        this.pos += 2;
        const right = this.parseComparison();
        left = bool2double(left !== right);
      } else {
        break;
      }
    }
    return left;
  }

  /**
   * Comparison: <, >, <=, >=
   */
  parseComparison(): number {
    let left = this.parseAddSub();
    while (this.pos < this.src.length) {
      const ch = this.peek();
      if (ch === '<' || ch === '>') {
        const next = this.pos + 1 < this.src.length ? this.src[this.pos + 1] : '';
        if (next === '=') {
          // <= or >=
          if (ch === '<') {
            this.pos += 2;
            const right = this.parseAddSub();
            left = bool2double(left <= right);
          } else {
            this.pos += 2;
            const right = this.parseAddSub();
            left = bool2double(left >= right);
          }
        } else {
          // < or >
          if (ch === '<') {
            this.pos += 1;
            const right = this.parseAddSub();
            left = bool2double(left < right);
          } else {
            this.pos += 1;
            const right = this.parseAddSub();
            left = bool2double(left > right);
          }
        }
      } else {
        break;
      }
    }
    return left;
  }

  /**
   * Addition and subtraction.
   * Must distinguish binary + from unary +/-.
   */
  parseAddSub(): number {
    let left = this.parseMulDiv();

    while (this.pos < this.src.length) {
      const ch = this.peek();
      if (ch === '+') {
        this.pos += 1;
        const right = this.parseMulDiv();
        left = left + right;
      } else if (ch === '-') {
        // Check if this is a binary minus (preceded by a value) or unary
        // If preceded by operator or start, it's unary — handled by parseMulDiv → parseUnary
        // Here we need to check if this is a binary minus
        // A minus is binary if preceded by: number, ), variable, true, false
        if (this.pos > 0) {
          const prevCh = this.src[this.pos - 1];
          if (/[0-9)TrueFals]/.test(prevCh) || prevCh === 'e' || prevCh === 'E') {
            this.pos += 1;
            const right = this.parseMulDiv();
            left = left - right;
          } else {
            break;
          }
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return left;
  }

  /**
   * Multiplication, division, modulus.
   */
  parseMulDiv(): number {
    let left = this.parseUnary();

    while (this.pos < this.src.length) {
      const ch = this.peek();
      if (ch === '*') {
        this.pos += 1;
        const right = this.parseUnary();
        left = left * right;
      } else if (ch === '/') {
        this.pos += 1;
        const right = this.parseUnary();
        left = left / right;
      } else if (ch === '%') {
        this.pos += 1;
        const right = this.parseUnary();
        left = left % right;
      } else {
        break;
      }
    }
    return left;
  }

  /**
   * Unary operators: !, -
   */
  parseUnary(): number {
    // Handle repeated unary operators (e.g., "!!", "---")
    while (this.pos < this.src.length) {
      const ch = this.peek();
      if (ch === '!') {
        this.pos += 1;
        const val = this.parseUnary();
        return bool2double(val === 0);
      } else if (ch === '-') {
        this.pos += 1;
        const val = this.parseUnary();
        return -val;
      } else if (ch === '+') {
        this.pos += 1;
        continue;
      } else {
        break;
      }
    }
    return this.parsePrimary();
  }

  /**
   * Primary: number, variable, parenthesized expression, true/false.
   */
  parsePrimary(): number {
    // Parenthesized expression
    if (this.peek() === '(') {
      this.pos++; // skip (
      const val = this.parseOr();
      if (this.peek() === ')') {
        this.pos++; // skip )
      }
      return val;
    }

    const token = this.readToken();

    if (token === 'true' || token === 'True') {
      return 1.0;
    }
    if (token === 'false' || token === 'False') {
      return 0.0;
    }

    // Try as number
    const num = Number(token);
    if (!isNaN(num)) {
      return num;
    }

    // Variable lookup
    if (token in this.ctx) {
      return Number(this.ctx[token]);
    }

    throw new Error(`Unknown variable: ${token}`);
  }
}
