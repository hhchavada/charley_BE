import { GrantExplanationBuilder } from './GrantExplanationBuilder';
import { DecisionTraceBuilder } from './DecisionTraceBuilder';
import { GrantExplanation, DecisionTraceNode } from './interfaces';

export class ExplainabilityEngine {
  constructor(
    private readonly grantExplainer: GrantExplanationBuilder,
    private readonly traceBuilder: DecisionTraceBuilder
  ) {}

  public explainGrant(grantResult: any, configBundle: any): GrantExplanation {
    const grantConfig = configBundle.grants.find((g: any) => g.grantId === grantResult.grant.grantId);
    return this.grantExplainer.build(grantResult, grantConfig);
  }

  public generateTrace(grantResult: any): DecisionTraceNode {
    return this.traceBuilder.build(grantResult);
  }

  public explainRanking(rankingResult: any): Record<string, string> {
    const explanations: Record<string, string> = {};
    
    rankingResult.readyNow.forEach((r: any, index: number) => {
      explanations[r.grantResult.grant.grantId] = `Ranked #${index + 1} with score ${r.recommendationScore}. ${r.isMergedCard ? 'Combined stream for clarity.' : ''}`;
    });

    rankingResult.prepareNext.forEach((r: any) => {
      explanations[r.grantResult.grant.grantId] = 'Pushed to Prepare Next because the application window is currently closed.';
    });

    return explanations;
  }
}
