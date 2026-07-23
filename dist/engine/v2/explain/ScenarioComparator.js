"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioComparator = void 0;
class ScenarioComparator {
    /**
     * Compares the output of two different simulation runs (Scenario A vs B).
     */
    compare(scenarioA, scenarioB) {
        const aEligible = new Set(scenarioA.result.recommendations.readyNow.map((g) => g.grantId));
        const bEligible = new Set(scenarioB.result.recommendations.readyNow.map((g) => g.grantId));
        const newlyQualified = [...bEligible].filter(id => !aEligible.has(id));
        const lostGrants = [...aEligible].filter(id => !bEligible.has(id));
        const fundingA = scenarioA.result.summary.estimatedFunding || 0;
        const fundingB = scenarioB.result.summary.estimatedFunding || 0;
        const aQuestions = new Set(scenarioA.result.questions.map((q) => q.questionId));
        const bQuestions = new Set(scenarioB.result.questions.map((q) => q.questionId));
        const questionDifferences = [
            ...[...bQuestions].filter((id) => !aQuestions.has(id)),
            ...[...aQuestions].filter((id) => !bQuestions.has(id))
        ];
        return {
            newlyQualifiedGrants: newlyQualified,
            lostGrants: lostGrants,
            fundingDifference: fundingB - fundingA,
            ruleDifferences: {}, // Would require deep inspection of explanations
            questionDifferences: questionDifferences
        };
    }
}
exports.ScenarioComparator = ScenarioComparator;
