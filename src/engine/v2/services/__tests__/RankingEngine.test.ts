import { RankingEngine } from '../RankingEngine';
import { GrantEvaluationResult, GrantState } from '../../interfaces/execution';

describe('RankingEngine', () => {
  const engine = new RankingEngine();

  const createResult = (
    id: string,
    state: GrantState,
    priority: number = 0,
    metadata: Record<string, any> = {},
    estimatedFunding: string = ''
  ): GrantEvaluationResult => {
    return {
      grant: {
        grantId: id,
        name: `Grant ${id}`,
        priority,
        estimatedFunding,
        metadata,
      } as any,
      state,
      score: 10,
      matchedRulesCount: 1,
      failedRulesCount: 0,
      missingRulesCount: 0,
      completionPercentage: 100,
      ruleCoverage: 100,
      explanation: {} as any,
      executionTimeMs: 1,
      rootGroupResult: {} as any
    };
  };

  it('sorts grants by global priority and recommendation score', async () => {
    const results = [
      createResult('g1', GrantState.ELIGIBLE, 10),
      createResult('g2', GrantState.ELIGIBLE, 50),
      createResult('g3', GrantState.ELIGIBLE, 5)
    ];

    const ranking = await engine.rank(results);
    expect(ranking.readyNow.length).toBe(3);
    // Highest priority first
    expect(ranking.readyNow[0].grantResult.grant.grantId).toBe('g2');
    expect(ranking.readyNow[1].grantResult.grant.grantId).toBe('g1');
    expect(ranking.readyNow[2].grantResult.grant.grantId).toBe('g3');
  });

  it('merges EDG streams and takes highest streamPriority as recommended', async () => {
    const results = [
      createResult('edg-marketing', GrantState.ELIGIBLE, 10, { mergeGroup: 'EDG', streamPriority: 50 }),
      createResult('edg-strategy', GrantState.ELIGIBLE, 10, { mergeGroup: 'EDG', streamPriority: 100 }),
      createResult('edg-hr', GrantState.ELIGIBLE, 10, { mergeGroup: 'EDG', streamPriority: 20 })
    ];

    const ranking = await engine.rank(results);
    expect(ranking.readyNow.length).toBe(1); // Merged into 1
    const mergedCard = ranking.readyNow[0];
    
    expect(mergedCard.isMergedCard).toBe(true);
    expect(mergedCard.mergedStreams!.length).toBe(3);
    // Highest streamPriority (100) should be the recommended one
    expect(mergedCard.recommendedStream!.grant.grantId).toBe('edg-strategy');
    expect(ranking.statistics.mergedCardsCount).toBe(1);
  });

  it('maps POTENTIALLY_ELIGIBLE to needsInformation bucket', async () => {
    const results = [createResult('g1', GrantState.POTENTIALLY_ELIGIBLE, 10)];
    const ranking = await engine.rank(results);
    
    expect(ranking.readyNow.length).toBe(0);
    expect(ranking.needsInformation.length).toBe(1);
  });

  it('maps NOT_ELIGIBLE to hidden bucket', async () => {
    const results = [createResult('g1', GrantState.NOT_ELIGIBLE, 10)];
    const ranking = await engine.rank(results);
    
    expect(ranking.hidden.length).toBe(1);
    expect(ranking.hidden[0].whyHidden).toContain('Does not meet eligibility');
  });

  it('moves prepareNext grants to prepareNext bucket (CTC rule)', async () => {
    const results = [createResult('ctc', GrantState.ELIGIBLE, 10, { isPrepareNext: true })];
    const ranking = await engine.rank(results);
    
    expect(ranking.readyNow.length).toBe(0);
    expect(ranking.prepareNext.length).toBe(1);
  });

  it('moves closed grants to windowClosed bucket', async () => {
    const results = [createResult('g1', GrantState.ELIGIBLE, 10, { windowStatus: 'CLOSED' })];
    const ranking = await engine.rank(results);
    
    expect(ranking.readyNow.length).toBe(0);
    expect(ranking.windowClosed.length).toBe(1);
  });

  it('calculates total funding while obeying EIS stacking rule', async () => {
    const results = [
      createResult('g1', GrantState.ELIGIBLE, 10, {}, '$30,000'),
      // EIS grant which stacks but does not increase headline total
      createResult('eis', GrantState.ELIGIBLE, 10, { stacksWithOtherGrants: true }, '$50,000') 
    ];
    
    const ranking = await engine.rank(results);
    // Should only sum g1 ($30,000), ignoring EIS
    expect(ranking.fundingSummary.estimatedFunding).toBe(30000);
    expect(ranking.readyNow.length).toBe(2); // Both are in ready now
  });

  it('preserves configuration badges', async () => {
    const results = [createResult('g1', GrantState.ELIGIBLE, 10, { badges: ['Popular', 'AI Recommended'] })];
    const ranking = await engine.rank(results);
    
    expect(ranking.readyNow[0].badges).toContain('Popular');
    expect(ranking.readyNow[0].badges).toContain('AI Recommended');
  });

  it('calculates recommendation score based on weights', async () => {
    // Score = (priority * 10) + (completion * 0.5) + (coverage * 0.5) + (aiConfidence * 2)
    // For this result: (10 * 10) + (100 * 0.5) + (100 * 0.5) + (8 * 2) = 100 + 50 + 50 + 16 = 216
    const result = createResult('g1', GrantState.ELIGIBLE, 10, { aiConfidence: 8 });
    const ranking = await engine.rank([result]);
    
    expect(ranking.readyNow[0].recommendationScore).toBe(216);
  });
});
