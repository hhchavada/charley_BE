"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEngine = void 0;
class SimulationEngine {
    configLoader;
    grantEngine;
    missingDataResolver;
    rankingEngine;
    resultBuilder;
    explainer;
    constructor(configLoader, grantEngine, missingDataResolver, rankingEngine, resultBuilder, explainer) {
        this.configLoader = configLoader;
        this.grantEngine = grantEngine;
        this.missingDataResolver = missingDataResolver;
        this.rankingEngine = rankingEngine;
        this.resultBuilder = resultBuilder;
        this.explainer = explainer;
    }
    /**
     * Executes a completely stateless simulation run.
     * This does NOT create a Session, nor does it write to the DB.
     */
    async simulate(payload, configVersionId) {
        const startTime = performance.now();
        const configBundle = await this.configLoader.loadActiveConfiguration(configVersionId);
        const context = {
            payload,
            sessionId: 'sim_' + Date.now(),
            versionId: configVersionId
        };
        const evaluationResult = await this.grantEngine.evaluate(context);
        const missingData = await this.missingDataResolver.resolve(evaluationResult.potentiallyEligible, configBundle);
        const ranking = await this.rankingEngine.rank(evaluationResult.eligible);
        const metrics = {
            executionTimeMs: performance.now() - startTime,
            totalGrants: configBundle.grants.length,
            eligibleCount: evaluationResult.eligible.length,
            potentialCount: evaluationResult.potentiallyEligible.length,
            rejectedCount: evaluationResult.rejected.length,
            errorCount: evaluationResult.errors.length,
            missingQuestionCount: missingData.questions.length,
            configurationVersion: configVersionId,
            evaluationTimestamp: new Date()
        };
        const resultDto = await this.resultBuilder.build(context, metrics, evaluationResult.eligible, evaluationResult.potentiallyEligible, evaluationResult.rejected, evaluationResult.errors, missingData, ranking);
        // Generate Explanations for all evaluated grants
        const explanations = [
            ...evaluationResult.eligible,
            ...evaluationResult.potentiallyEligible,
            ...evaluationResult.rejected
        ].map(g => ({
            grantId: g.grant.grantId,
            explanation: this.explainer.explainGrant(g, configBundle),
            trace: this.explainer.generateTrace(g)
        }));
        return {
            result: resultDto,
            explanations,
            rankingReasoning: this.explainer.explainRanking(ranking)
        };
    }
}
exports.SimulationEngine = SimulationEngine;
