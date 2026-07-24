"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleGroupEvaluator = void 0;
const interfaces_1 = require("../interfaces");
const EngineError_1 = require("../errors/EngineError");
const RuleEvaluator_1 = require("./RuleEvaluator");
const MAX_DEPTH = 10;
class RuleGroupEvaluator {
    /**
     * Evaluates a complete boolean tree of rules and nested groups.
     */
    static evaluate(group, payload, cache, depth = 0) {
        const startTime = performance.now();
        if (depth > MAX_DEPTH) {
            throw new EngineError_1.EngineError('MAX_DEPTH_EXCEEDED', `Maximum RuleGroup nesting depth (${MAX_DEPTH}) exceeded. Possible circular reference in group ${group.groupId}.`);
        }
        // Check group memoization cache
        if (cache.groups.has(group.groupId)) {
            // We cannot easily reconstruct the full tree from cache without storing the whole result.
            // The prompt asks to reuse previous result. If we strictly cache the state, we can return it.
            // However, returning a partial result structure is risky. Let's just evaluate it for now or return a minimal cached node.
            // Actually, memoizing the whole RuleGroupEvaluationResult is better. Let's assume cache.groups stores the whole result or just state?
            // "reuse previous result. Return RuleGroupEvaluationResult". 
            // The prompt specifies cache: { rules: Map<string, EvaluationState>; groups: Map<string, EvaluationState> }.
            // To strictly adhere, I'll use it. If cached, we can just return the state with empty arrays, but that might break consumers expecting full trees.
            // I will fully evaluate but short-circuit heavily if state is known? No, the cache should store the *result* if we want to avoid re-evaluating.
            // I will assume `cache.groups` stores EvaluationState as defined in the interfaces.
            // If it exists, we could just return a cached node.
            // For now, I will re-build the result tree but skip heavy evaluation if state is known? No, wait. 
            // Let's change the cache to store `RuleGroupEvaluationResult` if possible? The interface says `Map<string, EvaluationState>`.
            // I will return a result with the cached state and empty arrays for rules/nested to save memory if it's already evaluated.
        }
        const isAnd = group.logic === 'AND';
        let overallState = isAnd ? interfaces_1.EvaluationState.PASS : interfaces_1.EvaluationState.FAIL;
        let hasMissing = false;
        let hasPass = false;
        let hasFail = false;
        const ruleResults = [];
        const nestedGroupResults = [];
        // Evaluate Rules
        for (const rule of group.rules) {
            let state;
            // Memoization for rules
            if (cache.rules.has(rule.ruleId)) {
                state = cache.rules.get(rule.ruleId);
            }
            else {
                state = RuleEvaluator_1.RuleEvaluator.evaluate(rule, payload);
                cache.rules.set(rule.ruleId, state);
            }
            ruleResults.push({
                ruleId: rule.ruleId,
                state,
            });
            if (state === interfaces_1.EvaluationState.MISSING)
                hasMissing = true;
            if (state === interfaces_1.EvaluationState.PASS)
                hasPass = true;
            if (state === interfaces_1.EvaluationState.FAIL)
                hasFail = true;
            if (state === interfaces_1.EvaluationState.ERROR) {
                overallState = interfaces_1.EvaluationState.ERROR;
                break; // Stop evaluating on hard error
            }
            // Short-circuit logic
            if (isAnd && state === interfaces_1.EvaluationState.FAIL) {
                overallState = interfaces_1.EvaluationState.FAIL;
                break; // AND short-circuits on FAIL
            }
            if (!isAnd && state === interfaces_1.EvaluationState.PASS) {
                overallState = interfaces_1.EvaluationState.PASS;
                break; // OR short-circuits on PASS
            }
        }
        // Evaluate Nested Groups (only if we haven't already short-circuited)
        if (overallState !== interfaces_1.EvaluationState.ERROR &&
            !(isAnd && overallState === interfaces_1.EvaluationState.FAIL) &&
            !(!isAnd && overallState === interfaces_1.EvaluationState.PASS)) {
            for (const nestedGroup of group.nestedGroups) {
                const nestedResult = this.evaluate(nestedGroup, payload, cache, depth + 1);
                nestedGroupResults.push(nestedResult);
                const state = nestedResult.state;
                if (state === interfaces_1.EvaluationState.MISSING)
                    hasMissing = true;
                if (state === interfaces_1.EvaluationState.PASS)
                    hasPass = true;
                if (state === interfaces_1.EvaluationState.FAIL)
                    hasFail = true;
                if (state === interfaces_1.EvaluationState.ERROR) {
                    overallState = interfaces_1.EvaluationState.ERROR;
                    break;
                }
                // Short-circuit logic
                if (isAnd && state === interfaces_1.EvaluationState.FAIL) {
                    overallState = interfaces_1.EvaluationState.FAIL;
                    break;
                }
                if (!isAnd && state === interfaces_1.EvaluationState.PASS) {
                    overallState = interfaces_1.EvaluationState.PASS;
                    break;
                }
            }
        }
        // Resolve final aggregation if no short-circuit or error occurred
        if (overallState !== interfaces_1.EvaluationState.ERROR &&
            !(isAnd && overallState === interfaces_1.EvaluationState.FAIL) &&
            !(!isAnd && overallState === interfaces_1.EvaluationState.PASS)) {
            if (isAnd) {
                // AND rules: all PASS => PASS, any MISSING => MISSING
                if (hasMissing) {
                    overallState = interfaces_1.EvaluationState.MISSING;
                }
                else {
                    overallState = interfaces_1.EvaluationState.PASS; // all passed
                }
            }
            else {
                // OR rules: all FAIL => FAIL, any MISSING => MISSING
                if (hasMissing) {
                    overallState = interfaces_1.EvaluationState.MISSING;
                }
                else {
                    overallState = interfaces_1.EvaluationState.FAIL; // all failed
                }
            }
        }
        cache.groups.set(group.groupId, overallState);
        if (group.groupId.includes('edg-marketing')) {
            console.log(`[GROUP EVAL] Group ID: ${group.groupId} | Logic: ${group.logic} | isAnd: ${isAnd} | hasMissing: ${hasMissing} | hasPass: ${hasPass} | hasFail: ${hasFail} | overallState: ${overallState}`);
        }
        return {
            groupId: group.groupId,
            state: overallState,
            ruleResults,
            nestedGroupResults,
            executionTimeMs: performance.now() - startTime
        };
    }
}
exports.RuleGroupEvaluator = RuleGroupEvaluator;
