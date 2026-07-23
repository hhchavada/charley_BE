"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantExplanationBuilder = void 0;
class GrantExplanationBuilder {
    ruleExplainer;
    constructor(ruleExplainer) {
        this.ruleExplainer = ruleExplainer;
    }
    build(grantResult, grantConfig) {
        const passed = [];
        const failed = [];
        const missing = [];
        // Traverse rootGroupResult to extract flat lists
        const extractRules = (node) => {
            if (node.ruleResults) {
                node.ruleResults.forEach((r) => {
                    const ruleConfig = this.findRuleConfig(grantConfig, r.ruleId);
                    const explanation = this.ruleExplainer.build(r, ruleConfig);
                    if (r.state === 'PASS')
                        passed.push(explanation);
                    else if (r.state === 'FAIL')
                        failed.push(explanation);
                    else if (r.state === 'MISSING')
                        missing.push(explanation);
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
        }
        else if (grantResult.state === 'NOT_ELIGIBLE') {
            reasoning = `You do not qualify for ${grantConfig.name} because you failed ${failed.length} requirements.`;
        }
        else {
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
    findRuleConfig(grantConfig, ruleId) {
        // Simplified lookup
        let found = null;
        const traverse = (node) => {
            if (node.rules) {
                const r = node.rules.find((x) => x.ruleId === ruleId);
                if (r)
                    found = r;
            }
            if (node.nestedGroups)
                node.nestedGroups.forEach(traverse);
        };
        traverse(grantConfig.ruleGroup);
        return found || { ruleId, field: 'unknown', operator: 'EQUALS', expectedValue: '?' };
    }
}
exports.GrantExplanationBuilder = GrantExplanationBuilder;
