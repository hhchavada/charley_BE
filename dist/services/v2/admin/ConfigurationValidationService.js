"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationValidationService = void 0;
class ConfigurationValidationService {
    /**
     * Pre-flight checks before allowing a Draft configuration to be published.
     */
    async validateDraft(grants, rules, ruleGroups, questions) {
        const report = [];
        const questionMap = new Set(questions.map(q => q.id));
        const ruleMap = new Set(rules.map(r => r.id));
        // 1. Missing Questions
        rules.forEach(rule => {
            if (rule.questionId && !questionMap.has(rule.questionId)) {
                report.push(`Rule ${rule.id} references missing Question ${rule.questionId}`);
            }
        });
        // 2. Broken Rule References in Groups
        ruleGroups.forEach(group => {
            group.ruleIds?.forEach((ruleId) => {
                if (!ruleMap.has(ruleId)) {
                    report.push(`Group ${group.id} references missing Rule ${ruleId}`);
                }
            });
        });
        // 3. Circular Reference Detection (Simplistic depth check)
        const validateGroupNesting = (group, depth) => {
            if (depth > 10)
                report.push(`Group ${group.id} exceeds max nesting depth (Circular Reference?)`);
            group.nestedGroupIds?.forEach((childId) => {
                const child = ruleGroups.find(g => g.id === childId);
                if (child)
                    validateGroupNesting(child, depth + 1);
            });
        };
        ruleGroups.forEach(group => validateGroupNesting(group, 0));
        return {
            isValid: report.length === 0,
            report
        };
    }
}
exports.ConfigurationValidationService = ConfigurationValidationService;
