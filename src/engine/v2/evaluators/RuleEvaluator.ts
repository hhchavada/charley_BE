import { RuleGraph } from '../config/interfaces';
import { EngineError } from '../errors/EngineError';

export class RuleEvaluator {
  /**
   * Evaluates a single rule statelessly against an immutable payload.
   */
  static evaluate(rule: RuleGraph, payload: Readonly<Record<string, any>>): any {
    if ((global as any).hasLoggedPayload === undefined) {
      console.log('EXACT PAYLOAD:', JSON.stringify(payload, null, 2));
      (global as any).hasLoggedPayload = true;
    }
    try {
      const fieldValue = this.getNestedValue(payload, rule.fieldPath);
      const isMissing = fieldValue === undefined || fieldValue === null || fieldValue === '';

      let resultState: any;

      // The exists/not_exists operators are the only ones that handle missing data internally.
      if (rule.operator === 'exists') {
        resultState = !isMissing ? "PASS" as any : "FAIL" as any;
      } else if (rule.operator === 'not_exists') {
        resultState = isMissing ? "PASS" as any : "FAIL" as any;
      } else if (isMissing) {
        // For all other operators, missing data triggers a MISSING state
        resultState = "MISSING" as any;
      } else {
        // Perform operator evaluation
        switch (rule.operator as string) {
          case 'equals':
            resultState = this.isEqual(fieldValue, rule.value) ? "PASS" as any : "FAIL" as any;
            break;
          case 'not_equals':
            resultState = !this.isEqual(fieldValue, rule.value) ? "PASS" as any : "FAIL" as any;
            break;
          case 'greater_than':
            resultState = this.compareNumeric(fieldValue, rule.value, (a, b) => a > b);
            break;
          case 'greater_than_or_equals':
            resultState = this.compareNumeric(fieldValue, rule.value, (a, b) => a >= b);
            break;
          case 'less_than':
            resultState = this.compareNumeric(fieldValue, rule.value, (a, b) => a < b);
            break;
          case 'less_than_or_equals':
            resultState = this.compareNumeric(fieldValue, rule.value, (a, b) => a <= b);
            break;
          case 'contains':
            resultState = this.checkContains(fieldValue, rule.value) ? "PASS" as any : "FAIL" as any;
            break;
          case 'not_contains':
            resultState = !this.checkContains(fieldValue, rule.value) ? "PASS" as any : "FAIL" as any;
            break;
          case 'in':
            resultState = this.checkContains(rule.value, fieldValue) ? "PASS" as any : "FAIL" as any;
            break;
          case 'not_in':
            resultState = !this.checkContains(rule.value, fieldValue) ? "PASS" as any : "FAIL" as any;
            break;
          case 'regex':
            resultState = this.checkRegex(fieldValue, rule.value) ? "PASS" as any : "FAIL" as any;
            break;
          default:
            throw new EngineError('UNKNOWN_OPERATOR', `Unknown operator: ${rule.operator}`);
        }
      }

      if ((rule as any).ruleId && (rule as any).ruleId.includes('edg-marketing')) {
        console.log(`[EVAL] Rule ID: ${(rule as any).ruleId} | fieldPath: ${rule.fieldPath} | runtime value: ${JSON.stringify(fieldValue)} | returned state: ${resultState}`);
      }
      return resultState;
    } catch (err: any) {
      if (err instanceof EngineError) throw err;
      return "ERROR" as any;
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
  private static compareNumeric(actual: any, expected: any, comparator: (a: number, b: number) => boolean): any {
    const a = parseFloat(actual);
    const b = parseFloat(expected);
    if (isNaN(a) || isNaN(b)) {
      return "ERROR" as any;
    }
    return comparator(a, b) ? "PASS" as any : "FAIL" as any;
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
