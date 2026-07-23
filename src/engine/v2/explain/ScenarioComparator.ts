import { ScenarioDiff } from './interfaces';

export class ScenarioComparator {
  /**
   * Compares the output of two different simulation runs (Scenario A vs B).
   */
  public compare(scenarioA: any, scenarioB: any): ScenarioDiff {
    const aEligible = new Set(scenarioA.result.recommendations.readyNow.map((g: any) => g.grantId));
    const bEligible = new Set(scenarioB.result.recommendations.readyNow.map((g: any) => g.grantId));

    const newlyQualified = [...bEligible].filter(id => !aEligible.has(id));
    const lostGrants = [...aEligible].filter(id => !bEligible.has(id));

    const fundingA = scenarioA.result.summary.estimatedFunding || 0;
    const fundingB = scenarioB.result.summary.estimatedFunding || 0;

    const aQuestions = new Set(scenarioA.result.questions.map((q: any) => q.questionId));
    const bQuestions = new Set(scenarioB.result.questions.map((q: any) => q.questionId));
    const questionDifferences = [
      ...[...bQuestions].filter(id => !aQuestions.has(id)),
      ...[...aQuestions].filter(id => !bQuestions.has(id))
    ];

    return {
      newlyQualifiedGrants: newlyQualified,
      lostGrants,
      fundingDifference: fundingB - fundingA,
      ruleDifferences: {}, // Would require deep inspection of explanations
      questionDifferences
    };
  }
}
