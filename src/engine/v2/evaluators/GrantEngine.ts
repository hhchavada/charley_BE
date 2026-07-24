import { 
  EvaluationContext, 
  GrantEvaluationResult, 
  GrantState,
  AssessmentSessionState,
  EvaluationState
} from '../interfaces/execution';
import { 
  IConfigurationLoader,
  IVersionResolver,
  IValidationLayer,
  IMissingDataResolver,
  IRankingEngine,
  IResultBuilder,
  IGrantEvaluator,
  EngineResult
} from '../interfaces/dependencies';
import { RuleGroupEvaluator } from './RuleGroupEvaluator';

export class GrantEngine {
  constructor(
    private readonly configLoader: IConfigurationLoader,
    private readonly versionResolver: IVersionResolver,
    private readonly validationLayer: IValidationLayer,
    private readonly grantEvaluator: IGrantEvaluator,
    private readonly missingDataResolver: IMissingDataResolver,
    private readonly rankingEngine: IRankingEngine,
    private readonly resultBuilder: IResultBuilder
  ) {}

  /**
   * The sole public entry point for the V2 matching engine.
   */
  public async evaluate(context: EvaluationContext): Promise<EngineResult> {
    const startTime = performance.now();

    // 1. Freeze incoming payload to ensure immutability
    const frozenPayload = Object.freeze({ ...context.payload });
    const immutableContext: EvaluationContext = {
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
      rules: new Map<string, EvaluationState>(),
      groups: new Map<string, EvaluationState>()
    };

    // 6 & 7. Evaluate every grant in parallel
    const evaluationPromises = activeGrants.map(async (grant) => {
      try {
        // Evaluate the grant statelessly
        return this.grantEvaluator.evaluate(
          grant,
          immutableContext,
          engineCache,
          RuleGroupEvaluator
        );
      } catch (error: any) {
        // Partial Failure Handling: One grant crashing does not crash the engine
        return {
          grant,
          state: GrantState.ERROR,
          score: 0,
          rootGroupResult: {
            groupId: grant.ruleGroup?.groupId || 'UNKNOWN',
            state: EvaluationState.ERROR,
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
        } as GrantEvaluationResult;
      }
    });

    // 8. Collect every GrantEvaluationResult
    const evaluationResults = await Promise.all(evaluationPromises);

    // Categorize Results
    const eligible: GrantEvaluationResult[] = [];
    const potentiallyEligible: GrantEvaluationResult[] = [];
    const rejected: GrantEvaluationResult[] = [];
    const errors: GrantEvaluationResult[] = [];
    const missingRuleIds = new Set<string>();

    for (const result of evaluationResults) {
      if (result.state === GrantState.ELIGIBLE) eligible.push(result);
      else if (result.state === GrantState.POTENTIALLY_ELIGIBLE) {
        potentiallyEligible.push(result);
        
        // 9. Extract all missing rules
        const traverse = (node: any) => {
          node.ruleResults.forEach((r: any) => {
            if (r.state === EvaluationState.MISSING) missingRuleIds.add(r.ruleId);
          });
          node.nestedGroupResults.forEach(traverse);
        };
        traverse(result.rootGroupResult);
      }
      else if (result.state === GrantState.NOT_ELIGIBLE) rejected.push(result);
      else errors.push(result);
    }

    // 10. Call MissingDataResolver
    let missingData;
    let sessionState = AssessmentSessionState.COMPLETED;
    
    if (missingRuleIds.size > 0) {
      missingData = await this.missingDataResolver.resolve(potentiallyEligible, configBundle);
      sessionState = AssessmentSessionState.WAITING_FOR_AI;
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

    console.log('DEBUG METRICS:', totalMatched, totalFailed, totalMissing);

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
    const finalPayload = await this.resultBuilder.build(
      immutableContext,
      metrics,
      eligible,
      potentiallyEligible,
      rejected,
      errors,
      missingData,
      rankingResult
    );

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
