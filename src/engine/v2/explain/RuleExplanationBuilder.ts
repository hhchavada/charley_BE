import { RuleExplanation } from './interfaces';

export class RuleExplanationBuilder {
  public build(ruleResult: any, ruleConfig: any): RuleExplanation {
    const field = ruleConfig.field || 'unknown field';
    const operator = ruleConfig.operator || 'EQUALS';
    const expected = ruleConfig.expectedValue;
    const actual = ruleResult.actualValue;
    const result = ruleResult.state;

    let humanReadable = '';

    if (result === 'MISSING') {
      humanReadable = `We don't know your ${field} yet. We need it to be ${this.formatOp(operator)} ${expected}.`;
    } else if (result === 'PASS') {
      humanReadable = `Your ${field} is ${actual}, which matches our requirement of ${this.formatOp(operator)} ${expected}.`;
    } else {
      humanReadable = `Your ${field} is ${actual}, but it needs to be ${this.formatOp(operator)} ${expected}.`;
    }

    return {
      ruleId: ruleConfig.ruleId,
      field,
      operator,
      expectedValue: expected,
      actualValue: actual,
      result,
      humanReadable
    };
  }

  private formatOp(operator: string): string {
    switch(operator) {
      case 'GREATER_THAN': return 'more than';
      case 'LESS_THAN': return 'less than';
      case 'EQUALS': return 'exactly';
      case 'CONTAINS': return 'including';
      default: return operator.toLowerCase();
    }
  }
}
