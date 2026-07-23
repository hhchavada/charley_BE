import { RuleGroupEvaluator } from '../RuleGroupEvaluator';
import { RuleEvaluator } from '../RuleEvaluator';
import { EvaluationState } from '../../interfaces';
import { RuleGroupGraph, RuleGraph } from '../../config/interfaces';
import { EngineError } from '../../errors/EngineError';

describe('RuleGroupEvaluator', () => {
  const createRule = (id: string, operator: any, value: any): RuleGraph => ({
    ruleId: id,
    name: 'Test Rule',
    fieldPath: id,
    operator,
    value,
    severity: 'BLOCKING',
    weight: 1
  });

  const createGroup = (id: string, logic: 'AND' | 'OR', rules: RuleGraph[], nestedGroups: RuleGroupGraph[] = []): RuleGroupGraph => ({
    groupId: id,
    logic,
    rules,
    nestedGroups
  });

  let cache: { rules: Map<string, EvaluationState>; groups: Map<string, EvaluationState> };
  let evaluateSpy: jest.SpyInstance;

  beforeEach(() => {
    cache = {
      rules: new Map(),
      groups: new Map()
    };
    evaluateSpy = jest.spyOn(RuleEvaluator, 'evaluate');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AND Logic Aggregation', () => {
    it('returns PASS if all rules PASS', () => {
      evaluateSpy.mockReturnValue(EvaluationState.PASS);
      const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.PASS);
    });

    it('returns FAIL if any rule FAILs (and short-circuits)', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.PASS).mockReturnValueOnce(EvaluationState.FAIL).mockReturnValueOnce(EvaluationState.PASS);
      const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2), createRule('r3', 'equals', 3)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.FAIL);
      expect(evaluateSpy).toHaveBeenCalledTimes(2); // Short-circuited on r2
      expect(result.ruleResults.length).toBe(2);
    });

    it('returns MISSING if PASS + MISSING', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.PASS).mockReturnValueOnce(EvaluationState.MISSING);
      const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.MISSING);
    });

    it('returns FAIL if FAIL + MISSING (FAIL priority)', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.MISSING).mockReturnValueOnce(EvaluationState.FAIL);
      const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.FAIL);
    });
  });

  describe('OR Logic Aggregation', () => {
    it('returns FAIL if all rules FAIL', () => {
      evaluateSpy.mockReturnValue(EvaluationState.FAIL);
      const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.FAIL);
    });

    it('returns PASS if any rule PASSes (and short-circuits)', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.FAIL).mockReturnValueOnce(EvaluationState.PASS).mockReturnValueOnce(EvaluationState.FAIL);
      const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2), createRule('r3', 'equals', 3)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.PASS);
      expect(evaluateSpy).toHaveBeenCalledTimes(2); // Short-circuited on r2
    });

    it('returns MISSING if FAIL + MISSING', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.FAIL).mockReturnValueOnce(EvaluationState.MISSING);
      const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
      
      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.MISSING);
    });
  });

  describe('Nested RuleGroups', () => {
    it('evaluates nested groups correctly (AND containing OR)', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.PASS).mockReturnValueOnce(EvaluationState.PASS); // outer rule, inner rule
      
      const nestedGroup = createGroup('g2', 'OR', [createRule('r2', 'equals', 2)]);
      const outerGroup = createGroup('g1', 'AND', [createRule('r1', 'equals', 1)], [nestedGroup]);

      const result = RuleGroupEvaluator.evaluate(outerGroup, {}, cache);
      expect(result.state).toBe(EvaluationState.PASS);
      expect(result.nestedGroupResults[0].state).toBe(EvaluationState.PASS);
    });

    it('short-circuits nested groups on AND failure', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.FAIL); // Outer rule fails, shouldn't evaluate inner group
      
      const nestedGroup = createGroup('g2', 'OR', [createRule('r2', 'equals', 2)]);
      const outerGroup = createGroup('g1', 'AND', [createRule('r1', 'equals', 1)], [nestedGroup]);

      const result = RuleGroupEvaluator.evaluate(outerGroup, {}, cache);
      expect(result.state).toBe(EvaluationState.FAIL);
      expect(result.nestedGroupResults.length).toBe(0); // Nested group skipped
    });
  });

  describe('Memoization', () => {
    it('uses cached rule result without calling RuleEvaluator again', () => {
      evaluateSpy.mockReturnValueOnce(EvaluationState.PASS);
      
      const rule = createRule('r1', 'equals', 1);
      const group = createGroup('g1', 'AND', [rule, rule]); // Same rule twice

      const result = RuleGroupEvaluator.evaluate(group, {}, cache);
      expect(result.state).toBe(EvaluationState.PASS);
      expect(evaluateSpy).toHaveBeenCalledTimes(1); // Second call came from cache
    });
  });

  describe('Depth Protection (Circular References)', () => {
    it('throws EngineError when max depth is exceeded', () => {
      const g1: any = createGroup('g1', 'AND', []);
      const g2: any = createGroup('g2', 'AND', [], [g1]);
      g1.nestedGroups.push(g2); // Circular reference created

      expect(() => RuleGroupEvaluator.evaluate(g1, {}, cache)).toThrow(EngineError);
    });
  });
});
