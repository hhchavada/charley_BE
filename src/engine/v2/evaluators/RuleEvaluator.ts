import { EvaluationState, RuleGraph } from '../interfaces';
import { EngineError } from '../errors/EngineError';

export class RuleEvaluator {
  /**
   * Evaluates a single rule statelessly against an immutable payload.
   */
  static evaluate(rule: RuleGraph, payload: Readonly<Record<string, any>>): EvaluationState {
    try {
      const fieldValue = this.getNestedValue(payload, rule.fieldPath);
      const isMissing = fieldValue === undefined || fieldValue === null || fieldValue === '';

      // The exists/not_exists operators are the only ones that handle missing data internally.
      if (rule.operator === 'exists') {
        return !isMissing ? EvaluationState.PASS : EvaluationState.FAIL;
      }
      if (rule.operator === 'not_exists') {
        return isMissing ? EvaluationState.PASS : EvaluationState.FAIL;
      }

      // For all other operators, missing data triggers a MISSING state
      if (isMissing) {
        return EvaluationState.MISSING;
      }

      // Perform operator evaluation
      switch (rule.operator) {
        case 'equals':
          return this.isEqual(fieldValue, rule.value) ? EvaluationState.PASS : EvaluationState.FAIL;
        case 'not_equals':
          return !this.isEqual(fieldValue, rule.value) ? EvaluationState.PASS : EvaluationState.FAIL;
        case 'greater_than':
          return this.compareNumeric(fieldValue, rule.value, (a, b) => a > b);
        case 'greater_than_or_equals':
          return this.compareNumeric(fieldValue, rule.value, (a, b) => a >= b);
        case 'less_than':
          return this.compareNumeric(fieldValue, rule.value, (a, b) => a < b);
        case 'less_than_or_equals':
          return this.compareNumeric(fieldValue, rule.value, (a, b) => a <= b);
        case 'contains':
          return this.checkContains(fieldValue, rule.value) ? EvaluationState.PASS : EvaluationState.FAIL;
        case 'not_contains':
          return !this.checkContains(fieldValue, rule.value) ? EvaluationState.PASS : EvaluationState.FAIL;
        case 'regex':
          return this.checkRegex(fieldValue, rule.value) ? EvaluationState.PASS : EvaluationState.FAIL;
        default:
          throw new EngineError('UNKNOWN_OPERATOR', `Unknown operator: ${rule.operator}`);
      }
    } catch (err: any) {
      if (err instanceof EngineError) throw err;
      return EvaluationState.ERROR;
    }
  }

  /**
   * Retrieves a nested value from an object using a dot-notation path (e.g., 'company.revenue').
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    if (obj[path] !== undefined) return obj[path];
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  /**
   * Performs a loose but safe equality check. Handles Date strings properly.
   */
  private static isEqual(actual: any, expected: any): boolean {
    if (actual instanceof Date || expected instanceof Date) {
      return new Date(actual).getTime() === new Date(expected).getTime();
    }
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((val, index) => this.isEqual(val, expected[index]));
    }
    return actual === expected;
  }

  /**
   * Safely parses values to floats and compares them.
   */
  private static compareNumeric(actual: any, expected: any, comparator: (a: number, b: number) => boolean): EvaluationState {
    const a = parseFloat(actual);
    const b = parseFloat(expected);
    if (isNaN(a) || isNaN(b)) {
      return EvaluationState.ERROR;
    }
    return comparator(a, b) ? EvaluationState.PASS : EvaluationState.FAIL;
  }

  /**
   * Checks if an array contains a value, or if a string contains a substring.
   */
  private static checkContains(actual: any, expected: any): boolean {
    if (Array.isArray(actual)) {
      return actual.some(item => this.isEqual(item, expected));
    }
    if (typeof actual === 'string') {
      return actual.includes(String(expected));
    }
    return false;
  }

  /**
   * Checks if a string matches a regex pattern.
   */
  private static checkRegex(actual: any, expected: any): boolean {
    try {
      if (typeof actual !== 'string') return false;
      const regex = new RegExp(expected);
      return regex.test(actual);
    } catch (e) {
      return false;
    }
  }
}
