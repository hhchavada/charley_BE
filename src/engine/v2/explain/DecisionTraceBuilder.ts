import { DecisionTraceNode } from './interfaces';

export class DecisionTraceBuilder {
  /**
   * Translates the highly nested internal Result graphs into a serializable,
   * frontend-friendly execution trace tree.
   */
  public build(grantResult: any): DecisionTraceNode {
    return {
      type: 'GRANT',
      id: grantResult.grant.grantId,
      result: grantResult.state,
      details: grantResult.explanation,
      children: grantResult.rootGroupResult 
        ? [this.buildGroup(grantResult.rootGroupResult)] 
        : []
    };
  }

  private buildGroup(groupResult: any): DecisionTraceNode {
    const children: DecisionTraceNode[] = [];

    if (groupResult.nestedGroupResults) {
      groupResult.nestedGroupResults.forEach((g: any) => children.push(this.buildGroup(g)));
    }

    if (groupResult.ruleResults) {
      groupResult.ruleResults.forEach((r: any) => children.push(this.buildRule(r)));
    }

    return {
      type: 'GROUP',
      id: groupResult.groupId,
      operator: groupResult.operator || 'AND',
      result: groupResult.state,
      children
    };
  }

  private buildRule(ruleResult: any): DecisionTraceNode {
    return {
      type: 'RULE',
      id: ruleResult.ruleId,
      result: ruleResult.state,
      details: `Expected: ${ruleResult.expectedValue}, Actual: ${ruleResult.actualValue}`
    };
  }
}
