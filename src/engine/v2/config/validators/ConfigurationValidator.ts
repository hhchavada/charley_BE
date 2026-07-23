import { ConfigurationBundle, GrantGraph, RuleGroupGraph, RuleGraph } from '../interfaces';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigurationValidator {
  static validate(bundle: ConfigurationBundle): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    const grantIds = new Set<string>();
    const priorities = new Set<number>();
    
    // Check grants
    bundle.grants.forEach(grant => {
      if (grantIds.has(grant.grantId)) {
        errors.push(`Duplicate grant ID found: ${grant.grantId}`);
      }
      grantIds.add(grant.grantId);

      // Check rule groups recursively
      this.validateRuleGroup(grant.ruleGroup, errors, new Set());
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateRuleGroup(group: RuleGroupGraph, errors: string[], visitedGroups: Set<string>) {
    if (!group) {
      errors.push('Missing rule group reference');
      return;
    }

    if (visitedGroups.has(group.groupId)) {
      errors.push(`Circular dependency detected in RuleGroup: ${group.groupId}`);
      return;
    }
    visitedGroups.add(group.groupId);

    if (group.rules.length === 0 && group.nestedGroups.length === 0) {
      errors.push(`RuleGroup ${group.groupId} is empty.`);
    }

    group.rules.forEach(rule => {
      if (!rule) {
        errors.push(`Missing rule reference in group ${group.groupId}`);
      } else {
        this.validateRule(rule, errors);
      }
    });

    group.nestedGroups.forEach(nested => {
      this.validateRuleGroup(nested, errors, new Set(visitedGroups));
    });
  }

  private static validateRule(rule: RuleGraph, errors: string[]) {
    const validOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains', 'exists', 'not_exists'];
    if (!validOperators.includes(rule.operator)) {
      errors.push(`Invalid operator '${rule.operator}' in rule ${rule.ruleId}`);
    }

    // Example logic: if operator needs value, ensure it exists
    if (!rule.operator.includes('exists') && rule.value === undefined) {
      errors.push(`Rule ${rule.ruleId} requires a value for operator ${rule.operator}`);
    }

    // Check if question exists if mapped
    if (!rule.question && rule.operator !== 'exists') {
      // Just a warning for missing question mapping, depends on business logic
      // warnings.push(`Rule ${rule.ruleId} has no mapped question.`);
    }
  }
}
