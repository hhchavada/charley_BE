"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantEngine = void 0;
const execution_1 = require("../interfaces/execution");
const RuleGroupEvaluator_1 = require("./RuleGroupEvaluator");
class GrantEngine {
    configLoader;
    versionResolver;
    validationLayer;
    grantEvaluator;
    missingDataResolver;
    rankingEngine;
    resultBuilder;
    constructor(configLoader, versionResolver, validationLayer, grantEvaluator, missingDataResolver, rankingEngine, resultBuilder) {
        this.configLoader = configLoader;
        this.versionResolver = versionResolver;
        this.validationLayer = validationLayer;
        this.grantEvaluator = grantEvaluator;
        this.missingDataResolver = missingDataResolver;
        this.rankingEngine = rankingEngine;
        this.resultBuilder = resultBuilder;
    }
    /**
     * The sole public entry point for the V2 matching engine.
     */
    async evaluate(context) {
        const startTime = performance.now();
        // 1. Freeze incoming payload to ensure immutability
        const frozenPayload = Object.freeze({ ...context.payload });
        const immutableContext = {
            ...context,
            payload: frozenPayload
        };
        // 2. Resolve configuration version
        const versionId = await this.versionResolver.resolveVersion(immutableContext);
        // 3. Load active configuration graph
        const configBundle = await this.configLoader.loadActiveConfiguration(versionId);
        // 4. Validate payload
        const isValid = await this.validationLayer.validate(frozenPayload);
        if (!isValid) {
            throw new Error('Payload validation failed');
        }
        // 5. Get all active GrantGraphs
        const activeGrants = configBundle.grants;
        // Set up shared cache for the entire engine execution cycle
        const engineCache = {
            rules: new Map(),
            groups: new Map()
        };
        // 6 & 7. Evaluate every grant in parallel
        const evaluationPromises = activeGrants.map(async (grant) => {
            try {
                // Evaluate the grant statelessly
                return this.grantEvaluator.evaluate(grant, immutableContext, engineCache, RuleGroupEvaluator_1.RuleGroupEvaluator);
            }
            catch (error) {
                // Partial Failure Handling: One grant crashing does not crash the engine
                return {
                    grant,
                    state: execution_1.GrantState.ERROR,
                    score: 0,
                    rootGroupResult: {
                        groupId: grant.ruleGroup?.groupId || 'UNKNOWN',
                        state: execution_1.EvaluationState.ERROR,
                        ruleResults: [],
                        nestedGroupResults: []
                    },
                    matchedRulesCount: 0,
                    failedRulesCount: 0,
                    missingRulesCount: 0,
                    completionPercentage: 0,
                    ruleCoverage: 0,
                    explanation: {
                        reasonSummary: 'An unexpected error occurred while evaluating this grant.',
                        failureSummary: error.message,
                        missingSummary: ''
                    },
                    executionTimeMs: 0
                };
            }
        });
        // 8. Collect every GrantEvaluationResult
        const evaluationResults = await Promise.all(evaluationPromises);
        // Categorize Results
        const eligible = [];
        const potentiallyEligible = [];
        const rejected = [];
        const errors = [];
        const missingRuleIds = new Set();
        for (const result of evaluationResults) {
            if (result.state === execution_1.GrantState.ELIGIBLE)
                eligible.push(result);
            else if (result.state === execution_1.GrantState.POTENTIALLY_ELIGIBLE) {
                potentiallyEligible.push(result);
                // 9. Extract all missing rules
                const traverse = (node) => {
                    node.ruleResults.forEach((r) => {
                        if (r.state === execution_1.EvaluationState.MISSING)
                            missingRuleIds.add(r.ruleId);
                    });
                    node.nestedGroupResults.forEach(traverse);
                };
                traverse(result.rootGroupResult);
            }
            else if (result.state === execution_1.GrantState.NOT_ELIGIBLE)
                rejected.push(result);
            else
                errors.push(result);
        }
        // 10. Call MissingDataResolver
        let missingData;
        let sessionState = execution_1.AssessmentSessionState.COMPLETED;
        if (missingRuleIds.size > 0) {
            missingData = await this.missingDataResolver.resolve(potentiallyEligible, configBundle);
            sessionState = execution_1.AssessmentSessionState.WAITING_FOR_AI;
        }
        // 11. Call RankingEngine
        const rankingResult = await this.rankingEngine.rank([...eligible, ...potentiallyEligible]);
        let totalMatched = 0;
        let totalFailed = 0;
        let totalMissing = 0;
        for (const result of evaluationResults) {
            totalMatched += result.matchedRulesCount || 0;
            totalFailed += result.failedRulesCount || 0;
            totalMissing += result.missingRulesCount || 0;
        }
        const metrics = {
            executionTimeMs: performance.now() - startTime,
            totalGrants: activeGrants.length,
            eligibleCount: eligible.length,
            potentialCount: potentiallyEligible.length,
            rejectedCount: rejected.length,
            errorCount: errors.length,
            missingQuestionCount: missingData?.questions?.length || 0,
            configurationVersion: versionId,
            evaluationTimestamp: new Date(),
            rulesEvaluated: totalMatched + totalFailed + totalMissing,
            passedRules: totalMatched,
            failedRules: totalFailed,
            missingRules: totalMissing
        };
        // 12. Call ResultBuilder
        const finalPayload = await this.resultBuilder.build(immutableContext, metrics, eligible, potentiallyEligible, rejected, errors, missingData, rankingResult);
        // 13. Return EngineResult
        return {
            eligible,
            potentiallyEligible,
            rejected,
            errors,
            missingData,
            ranking: rankingResult,
            metrics,
            sessionState,
            finalPayload
        };
    }
}
exports.GrantEngine = GrantEngine;
