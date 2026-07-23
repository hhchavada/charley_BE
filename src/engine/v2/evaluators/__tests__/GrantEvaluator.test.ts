import { GrantEvaluator } from '../GrantEvaluator';
import { RuleGroupEvaluator } from '../RuleGroupEvaluator';
import { EvaluationState, GrantState, RuleGroupEvaluationResult } from '../../interfaces';
import { GrantGraph } from '../../../config/interfaces';

describe('GrantEvaluator', () => {
  const createMockGrant = (id: string, name: string): GrantGraph => ({
    grantId: id,
    name,
    description: '',
    agency: '',
    category: '',
    priority: 1,
    status: 'ACTIVE',
    version: 1,
    ruleGroup: {} as any
  });

  const createContext = () => ({
    payload: {},
    sessionId: 's1',
    versionId: 'v1'
  });

  const createCache = () => ({
    rules: new Map(),
    groups: new Map()
  });

  const createGroupResult = (
    state: EvaluationState, 
    matched: number, 
    failed: number, 
    missing: number
  ): RuleGroupEvaluationResult => {
    const ruleResults = [];
    for (let i = 0; i < matched; i++) ruleResults.push({ ruleId: `m${i}`, state: EvaluationState.PASS });
    for (let i = 0; i < failed; i++) ruleResults.push({ ruleId: `f${i}`, state: EvaluationState.FAIL });
    for (let i = 0; i < missing; i++) ruleResults.push({ ruleId: `x${i}`, state: EvaluationState.MISSING });
    
    return {
      groupId: 'g1',
      state,
      ruleResults,
      nestedGroupResults: []
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps PASS to ELIGIBLE and calculates 100% completion', () => {
    const grant = createMockGrant('g1', 'Startup Grant');
    const groupResult = createGroupResult(EvaluationState.PASS, 3, 0, 0); // 3 passed
    
    jest.spyOn(RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);

    const result = GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator);

    expect(result.state).toBe(GrantState.ELIGIBLE);
    expect(result.completionPercentage).toBe(100);
    expect(result.ruleCoverage).toBe(100);
    expect(result.matchedRulesCount).toBe(3);
    expect(result.explanation.reasonSummary).toContain('fully eligible');
  });

  it('maps FAIL to NOT_ELIGIBLE', () => {
    const grant = createMockGrant('g1', 'Startup Grant');
    const groupResult = createGroupResult(EvaluationState.FAIL, 2, 1, 0); // 2 passed, 1 failed
    
    jest.spyOn(RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);

    const result = GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator);

    expect(result.state).toBe(GrantState.NOT_ELIGIBLE);
    expect(result.failedRulesCount).toBe(1);
    expect(result.explanation.failureSummary).toContain('failed 1 criteria');
  });

  it('maps MISSING to POTENTIALLY_ELIGIBLE and calculates correct coverage', () => {
    const grant = createMockGrant('g1', 'Startup Grant');
    const groupResult = createGroupResult(EvaluationState.MISSING, 1, 0, 1); // 1 passed, 1 missing
    
    jest.spyOn(RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);

    const result = GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator);

    expect(result.state).toBe(GrantState.POTENTIALLY_ELIGIBLE);
    expect(result.missingRulesCount).toBe(1);
    expect(result.completionPercentage).toBe(50); // 1/2 complete
    expect(result.explanation.missingSummary).toContain('Missing data for 1 rules');
    expect(result.explanation.reasonSummary).toContain('might be eligible');
  });

  it('collects metrics correctly from nested group results', () => {
    const grant = createMockGrant('g1', 'Nested Grant');
    const nestedResult: RuleGroupEvaluationResult = {
      groupId: 'g2',
      state: EvaluationState.MISSING,
      ruleResults: [
        { ruleId: 'r1', state: EvaluationState.MISSING },
        { ruleId: 'r2', state: EvaluationState.PASS }
      ],
      nestedGroupResults: []
    };
    
    const rootResult: RuleGroupEvaluationResult = {
      groupId: 'g1',
      state: EvaluationState.MISSING,
      ruleResults: [
        { ruleId: 'r3', state: EvaluationState.PASS }
      ],
      nestedGroupResults: [nestedResult]
    };

    jest.spyOn(RuleGroupEvaluator, 'evaluate').mockReturnValue(rootResult);

    const result = GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator);

    expect(result.matchedRulesCount).toBe(2);
    expect(result.missingRulesCount).toBe(1);
    expect(result.failedRulesCount).toBe(0);
    // Total rules = 3 (2 passed, 1 missing)
    expect(result.completionPercentage).toBeCloseTo(66.67, 1); 
  });

  it('tracks execution time', () => {
    const grant = createMockGrant('g1', 'Timing Grant');
    jest.spyOn(RuleGroupEvaluator, 'evaluate').mockReturnValue(createGroupResult(EvaluationState.PASS, 1, 0, 0));

    const result = GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
