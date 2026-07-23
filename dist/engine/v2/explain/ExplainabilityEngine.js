"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplainabilityEngine = void 0;
class ExplainabilityEngine {
    grantExplainer;
    traceBuilder;
    constructor(grantExplainer, traceBuilder) {
        this.grantExplainer = grantExplainer;
        this.traceBuilder = traceBuilder;
    }
    explainGrant(grantResult, configBundle) {
        const grantConfig = configBundle.grants.find((g) => g.grantId === grantResult.grant.grantId);
        return this.grantExplainer.build(grantResult, grantConfig);
    }
    generateTrace(grantResult) {
        return this.traceBuilder.build(grantResult);
    }
    explainRanking(rankingResult) {
        const explanations = {};
        rankingResult.readyNow.forEach((r, index) => {
            explanations[r.grantResult.grant.grantId] = `Ranked #${index + 1} with score ${r.recommendationScore}. ${r.isMergedCard ? 'Combined stream for clarity.' : ''}`;
        });
        rankingResult.prepareNext.forEach((r) => {
            explanations[r.grantResult.grant.grantId] = 'Pushed to Prepare Next because the application window is currently closed.';
        });
        return explanations;
    }
}
exports.ExplainabilityEngine = ExplainabilityEngine;
