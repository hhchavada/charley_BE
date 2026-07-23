"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantEvaluator = void 0;
const interfaces_1 = require("../interfaces");
class GrantEvaluator {
    /**
     * Pure evaluator for a single Grant.
     * Maps rule states to grant statuses and calculates completion metrics.
     */
    static evaluate(grant, context, cache, groupEvaluator) {
        const startTime = performance.now();
        // 1. Evaluate Root Group
        const rootGroupResult = groupEvaluator.evaluate(grant.ruleGroup, context.payload, cache);
        // 2. Map State
        let grantState;
        if (rootGroupResult.state === interfaces_1.EvaluationState.PASS) {
            grantState = interfaces_1.GrantState.ELIGIBLE;
        }
        else if (rootGroupResult.state === interfaces_1.EvaluationState.FAIL) {
            grantState = interfaces_1.GrantState.NOT_ELIGIBLE;
        }
        else if (rootGroupResult.state === interfaces_1.EvaluationState.MISSING) {
            grantState = interfaces_1.GrantState.POTENTIALLY_ELIGIBLE;
        }
        else {
            grantState = interfaces_1.GrantState.ERROR;
        }
        // 3. Collect metrics
        const metrics = this.collectMetrics(rootGroupResult);
        const totalRules = metrics.matchedCount + metrics.failedCount + metrics.missingCount;
        const ruleCoverage = totalRules > 0 ? ((metrics.matchedCount + metrics.failedCount) / totalRules) * 100 : 100;
        // Completion is rules evaluated / total rules * 100
        const completionPercentage = totalRules > 0 ? (1 - (metrics.missingCount / totalRules)) * 100 : 100;
        // Base score logic for now (can be expanded later)
        const score = metrics.matchedCount * 10;
        // 4. Generate Explanations
        const explanation = this.generateExplanations(grant, grantState, metrics);
        return {
            grant,
            state: grantState,
            score,
            rootGroupResult,
            matchedRulesCount: metrics.matchedCount,
            failedRulesCount: metrics.failedCount,
            missingRulesCount: metrics.missingCount,
            matchedRuleIds: Array.from(metrics.matchedRuleIds),
            failedRuleIds: Array.from(metrics.failedRuleIds),
            missingRuleIds: Array.from(metrics.missingRuleIds),
            completionPercentage: parseFloat(completionPercentage.toFixed(2)),
            ruleCoverage: parseFloat(ruleCoverage.toFixed(2)),
            explanation,
            executionTimeMs: performance.now() - startTime
        };
    }
    static collectMetrics(groupResult) {
        let matchedCount = 0;
        let failedCount = 0;
        let missingCount = 0;
        const matchedRuleIds = new Set();
        const failedRuleIds = new Set();
        const missingRuleIds = new Set();
        const traverse = (node) => {
            node.ruleResults.forEach(r => {
                if (r.state === interfaces_1.EvaluationState.PASS) {
                    matchedCount++;
                    matchedRuleIds.add(r.ruleId);
                }
                else if (r.state === interfaces_1.EvaluationState.FAIL) {
                    failedCount++;
                    failedRuleIds.add(r.ruleId);
                }
                else if (r.state === interfaces_1.EvaluationState.MISSING) {
                    missingCount++;
                    missingRuleIds.add(r.ruleId);
                }
            });
            node.nestedGroupResults.forEach(g => traverse(g));
        };
        traverse(groupResult);
        return { matchedCount, failedCount, missingCount, matchedRuleIds, failedRuleIds, missingRuleIds };
    }
    static generateExplanations(grant, state, metrics) {
        let reasonSummary = '';
        let failureSummary = '';
        let missingSummary = '';
        if (state === interfaces_1.GrantState.ELIGIBLE) {
            reasonSummary = `You are fully eligible for the ${grant.name}. You met all ${metrics.matchedCount} criteria.`;
        }
        else if (state === interfaces_1.GrantState.POTENTIALLY_ELIGIBLE) {
            reasonSummary = `You might be eligible for the ${grant.name}, but we need more information.`;
            missingSummary = `Missing data for ${metrics.missingCount} rules.`;
        }
        else if (state === interfaces_1.GrantState.NOT_ELIGIBLE) {
            reasonSummary = `Unfortunately, you do not qualify for the ${grant.name}.`;
            failureSummary = `You failed ${metrics.failedCount} criteria.`;
        }
        else {
            reasonSummary = 'An error occurred while assessing this grant.';
        }
        return { reasonSummary, failureSummary, missingSummary };
    }
}
exports.GrantEvaluator = GrantEvaluator;
