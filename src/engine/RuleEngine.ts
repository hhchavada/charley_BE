import { Operator } from '../types';

export class RuleEngine {
  public static evaluate(operator: Operator, expected: any, actual: any): boolean {
    const sActual = String(actual).toLowerCase();
    const sExpected = String(expected).toLowerCase();
    const nActual = Number(actual);
    const nExpected = Number(expected);

    switch (operator) {
      case '==':
      case 'equals':
        return sActual === sExpected;
        
      case '!=':
      case 'not_equals':
        return sActual !== sExpected;
        
      case '>':
      case 'greater_than':
        return !isNaN(nActual) && !isNaN(nExpected) && nActual > nExpected;
        
      case '<':
      case 'less_than':
        return !isNaN(nActual) && !isNaN(nExpected) && nActual < nExpected;
        
      case '>=':
        return !isNaN(nActual) && !isNaN(nExpected) && nActual >= nExpected;
        
      case '<=':
        return !isNaN(nActual) && !isNaN(nExpected) && nActual <= nExpected;
        
      case 'contains':
        if (Array.isArray(actual)) {
          return actual.some(a => String(a).toLowerCase() === sExpected);
        }
        return sActual.includes(sExpected);
        
      case 'not_contains':
        if (Array.isArray(actual)) {
          return !actual.some(a => String(a).toLowerCase() === sExpected);
        }
        return !sActual.includes(sExpected);
        
      case 'starts_with':
        return sActual.startsWith(sExpected);
        
      case 'ends_with':
        return sActual.endsWith(sExpected);
        
      case 'in':
        if (Array.isArray(expected)) {
          return expected.some(e => String(e).toLowerCase() === sActual);
        }
        return false;
        
      case 'not_in':
        if (Array.isArray(expected)) {
          return !expected.some(e => String(e).toLowerCase() === sActual);
        }
        return true;
        
      case 'exists':
        return actual !== undefined && actual !== null && actual !== '';
        
      case 'not_exists':
        return actual === undefined || actual === null || actual === '';
        
      case 'is_true':
        return actual === true || sActual === 'true' || sActual === 'yes';
        
      case 'is_false':
        return actual === false || sActual === 'false' || sActual === 'no';
        
      default:
        return false;
    }
  }

  public static getFieldValue(data: Record<string, any>, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current: any = data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }
}
