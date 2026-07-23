import { GrantEngine } from '../GrantEngine';
import { 
  AssessmentSessionState, 
  EvaluationContext, 
  GrantState, 
  EvaluationState 
} from '../../interfaces/execution';

describe('GrantEngine', () => {
  let mockConfigLoader: any;
  let mockVersionResolver: any;
  let mockValidationLayer: any;
  let mockGrantEvaluator: any;
  let mockMissingDataResolver: any;
  let mockRankingEngine: any;
  let mockResultBuilder: any;
  let engine: GrantEngine;

  const createContext = (): EvaluationContext => ({
    payload: { companyName: 'Test Corp' },
    sessionId: 'sess-123',
    versionId: 'v1'
  });

  const createMockGrantGraph = (id: string) => ({
    grantId: id,
    ruleGroup: { groupId: 'g1' }
  });

  beforeEach(() => {
    mockConfigLoader = {
      loadActiveConfiguration: jest.fn().mockResolvedValue({
        grants: [createMockGrantGraph('grant1'), createMockGrantGraph('grant2')]
      })
    };
    mockVersionResolver = { resolveVersion: jest.fn().mockResolvedValue('v1') };
    mockValidationLayer = { validate: jest.fn().mockResolvedValue(true) };
    
    mockGrantEvaluator = {
      evaluate: jest.fn().mockImplementation((grant) => ({
        grant,
        state: GrantState.ELIGIBLE,
        matchedRulesCount: 1,
        failedRulesCount: 0,
        missingRulesCount: 0,
        score: 10,
        rootGroupResult: { ruleResults: [], nestedGroupResults: [] }
      }))
    };

    mockMissingDataResolver = { resolve: jest.fn().mockResolvedValue({ missingQuestions: [] }) };
    mockRankingEngine = { rank: jest.fn().mockResolvedValue({ rankedGrants: [] }) };
    mockResultBuilder = { build: jest.fn().mockResolvedValue({ status: 'ok' }) };

    engine = new GrantEngine(
      mockConfigLoader,
      mockVersionResolver,
      mockValidationLayer,
      mockGrantEvaluator,
      mockMissingDataResolver,
      mockRankingEngine,
      mockResultBuilder
    );
  });

  it('evaluates successfully and collects metrics', async () => {
    const result = await engine.evaluate(createContext());

    expect(result.metrics.totalGrants).toBe(2);
    expect(result.metrics.eligibleCount).toBe(2);
    expect(result.sessionState).toBe(AssessmentSessionState.COMPLETED);
    expect(mockConfigLoader.loadActiveConfiguration).toHaveBeenCalledTimes(1);
    expect(mockGrantEvaluator.evaluate).toHaveBeenCalledTimes(2);
  });

  it('throws error if validation fails', async () => {
    mockValidationLayer.validate.mockResolvedValueOnce(false);
    await expect(engine.evaluate(createContext())).rejects.toThrow('Payload validation failed');
  });

  it('handles partial failures (one grant throws exception)', async () => {
    // First grant throws, second succeeds
    mockGrantEvaluator.evaluate.mockImplementationOnce(() => {
      throw new Error('Unexpected grant crash');
    }).mockImplementationOnce((grant: any) => ({
      grant,
      state: GrantState.ELIGIBLE,
      rootGroupResult: { ruleResults: [], nestedGroupResults: [] }
    }));

    const result = await engine.evaluate(createContext());

    expect(result.metrics.errorCount).toBe(1);
    expect(result.metrics.eligibleCount).toBe(1);
    expect(result.errors[0].explanation.failureSummary).toContain('Unexpected grant crash');
    expect(result.errors[0].state).toBe(GrantState.ERROR);
  });

  it('handles empty configuration seamlessly', async () => {
    mockConfigLoader.loadActiveConfiguration.mockResolvedValueOnce({ grants: [] });
    const result = await engine.evaluate(createContext());

    expect(result.metrics.totalGrants).toBe(0);
    expect(result.metrics.eligibleCount).toBe(0);
  });

  it('triggers MissingDataResolver and changes state to WAITING_FOR_AI if missing rules exist', async () => {
    mockGrantEvaluator.evaluate.mockImplementation((grant: any) => ({
      grant,
      state: GrantState.POTENTIALLY_ELIGIBLE,
      rootGroupResult: {
        ruleResults: [{ ruleId: 'r1', state: EvaluationState.MISSING }],
        nestedGroupResults: []
      }
    }));

    const result = await engine.evaluate(createContext());

    expect(result.metrics.potentialCount).toBe(2);
    expect(result.sessionState).toBe(AssessmentSessionState.WAITING_FOR_AI);
    expect(mockMissingDataResolver.resolve).toHaveBeenCalledTimes(1);
    // Both grants missing rule 'r1', should be passed deduplicated to resolver
    expect(mockMissingDataResolver.resolve).toHaveBeenCalledWith(['r1']);
  });

  it('ensures payload immutability', async () => {
    mockGrantEvaluator.evaluate.mockImplementation((grant: any, context: EvaluationContext) => {
      // Attempt mutation
      expect(Object.isFrozen(context.payload)).toBe(true);
      return { grant, state: GrantState.ELIGIBLE, rootGroupResult: { ruleResults: [], nestedGroupResults: [] } };
    });

    await engine.evaluate(createContext());
  });

});
