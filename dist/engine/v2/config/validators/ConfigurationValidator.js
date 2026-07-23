"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationValidator = void 0;
class ConfigurationValidator {
    static validate(bundle) {
        const errors = [];
        const warnings = [];
        const grantIds = new Set();
        const priorities = new Set();
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
    static validateRuleGroup(group, errors, visitedGroups) {
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
            }
            else {
                this.validateRule(rule, errors);
            }
        });
        group.nestedGroups.forEach(nested => {
            this.validateRuleGroup(nested, errors, new Set(visitedGroups));
        });
    }
    static validateRule(rule, errors) {
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
exports.ConfigurationValidator = ConfigurationValidator;
