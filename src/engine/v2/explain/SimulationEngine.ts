import { EvaluationContext } from '../interfaces/execution';
import { IConfigurationLoader, IMissingDataResolver, IRankingEngine, IResultBuilder, EngineMetrics } from '../interfaces/dependencies';
import { GrantEngine } from '../evaluators/GrantEngine';
import { ExplainabilityEngine } from './ExplainabilityEngine';

export class SimulationEngine {
  constructor(
    private readonly configLoader: IConfigurationLoader,
    private readonly grantEngine: GrantEngine,
    private readonly missingDataResolver: IMissingDataResolver,
    private readonly rankingEngine: IRankingEngine,
    private readonly resultBuilder: IResultBuilder,
    private readonly explainer: ExplainabilityEngine
  ) {}

  /**
   * Executes a completely stateless simulation run.
   * This does NOT create a Session, nor does it write to the DB.
   */
  public async simulate(payload: Record<string, any>, configVersionId: string): Promise<any> {
    const startTime = performance.now();
    const configBundle = await this.configLoader.loadActiveConfiguration(configVersionId);

    const context: EvaluationContext = {
      payload,
      sessionId: 'sim_' + Date.now(),
      versionId: configVersionId
    };

    const evaluationResult = await this.grantEngine.evaluate(context as any);
    const missingData = await this.missingDataResolver.resolve(evaluationResult.potentiallyEligible, configBundle);
    const ranking = await this.rankingEngine.rank(evaluationResult.eligible);

    const metrics: EngineMetrics = {
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

    const resultDto = await this.resultBuilder.build(
      context, metrics, evaluationResult.eligible, evaluationResult.potentiallyEligible, 
      evaluationResult.rejected, evaluationResult.errors, missingData, ranking
    );

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
