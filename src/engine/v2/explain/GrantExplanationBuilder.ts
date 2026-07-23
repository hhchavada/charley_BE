import { GrantExplanation } from './interfaces';
import { RuleExplanationBuilder } from './RuleExplanationBuilder';

export class GrantExplanationBuilder {
  constructor(private readonly ruleExplainer: RuleExplanationBuilder) {}

  public build(grantResult: any, grantConfig: any): GrantExplanation {
    const passed: any[] = [];
    const failed: any[] = [];
    const missing: any[] = [];

    // Traverse rootGroupResult to extract flat lists
    const extractRules = (node: any) => {
      if (node.ruleResults) {
        node.ruleResults.forEach((r: any) => {
          const ruleConfig = this.findRuleConfig(grantConfig, r.ruleId);
          const explanation = this.ruleExplainer.build(r, ruleConfig);
          if (r.state === 'PASS') passed.push(explanation);
          else if (r.state === 'FAIL') failed.push(explanation);
          else if (r.state === 'MISSING') missing.push(explanation);
        });
      }
      if (node.nestedGroupResults) {
        node.nestedGroupResults.forEach(extractRules);
      }
    };

    if (grantResult.rootGroupResult) {
      extractRules(grantResult.rootGroupResult);
    }

    let reasoning = '';
    if (grantResult.state === 'ELIGIBLE') {
      reasoning = `You qualify for ${grantConfig.name} because you meet all ${passed.length} requirements.`;
    } else if (grantResult.state === 'NOT_ELIGIBLE') {
      reasoning = `You do not qualify for ${grantConfig.name} because you failed ${failed.length} requirements.`;
    } else {
      reasoning = `You might qualify for ${grantConfig.name}, but we need answers for ${missing.length} missing requirements.`;
    }

    return {
      grantId: grantResult.grant.grantId,
      status: grantResult.state,
      passedRules: passed,
      failedRules: failed,
      missingRules: missing,
      confidenceScore: grantResult.ruleCoverage,
      coveragePercentage: grantResult.completionPercentage,
      reasoning
    };
  }

  private findRuleConfig(grantConfig: any, ruleId: string): any {
    // Simplified lookup
    let found = null;
    const traverse = (node: any) => {
      if (node.rules) {
        const r = node.rules.find((x: any) => x.ruleId === ruleId);
        if (r) found = r;
      }
      if (node.nestedGroups) node.nestedGroups.forEach(traverse);
    };
    traverse(grantConfig.ruleGroup);
    return found || { ruleId, field: 'unknown', operator: 'EQUALS', expectedValue: '?' };
  }
}
