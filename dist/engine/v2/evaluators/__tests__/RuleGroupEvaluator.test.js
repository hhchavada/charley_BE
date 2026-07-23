"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleGroupEvaluator_1 = require("../RuleGroupEvaluator");
const RuleEvaluator_1 = require("../RuleEvaluator");
const interfaces_1 = require("../../interfaces");
const EngineError_1 = require("../../errors/EngineError");
describe('RuleGroupEvaluator', () => {
    const createRule = (id, operator, value) => ({
        ruleId: id,
        name: 'Test Rule',
        fieldPath: id,
        operator,
        value,
        severity: 'BLOCKING',
        weight: 1
    });
    const createGroup = (id, logic, rules, nestedGroups = []) => ({
        groupId: id,
        logic,
        rules,
        nestedGroups
    });
    let cache;
    let evaluateSpy;
    beforeEach(() => {
        cache = {
            rules: new Map(),
            groups: new Map()
        };
        evaluateSpy = jest.spyOn(RuleEvaluator_1.RuleEvaluator, 'evaluate');
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('AND Logic Aggregation', () => {
        it('returns PASS if all rules PASS', () => {
            evaluateSpy.mockReturnValue(interfaces_1.EvaluationState.PASS);
            const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.PASS);
        });
        it('returns FAIL if any rule FAILs (and short-circuits)', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.PASS).mockReturnValueOnce(interfaces_1.EvaluationState.FAIL).mockReturnValueOnce(interfaces_1.EvaluationState.PASS);
            const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2), createRule('r3', 'equals', 3)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.FAIL);
            expect(evaluateSpy).toHaveBeenCalledTimes(2); // Short-circuited on r2
            expect(result.ruleResults.length).toBe(2);
        });
        it('returns MISSING if PASS + MISSING', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.PASS).mockReturnValueOnce(interfaces_1.EvaluationState.MISSING);
            const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.MISSING);
        });
        it('returns FAIL if FAIL + MISSING (FAIL priority)', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.MISSING).mockReturnValueOnce(interfaces_1.EvaluationState.FAIL);
            const group = createGroup('g1', 'AND', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.FAIL);
        });
    });
    describe('OR Logic Aggregation', () => {
        it('returns FAIL if all rules FAIL', () => {
            evaluateSpy.mockReturnValue(interfaces_1.EvaluationState.FAIL);
            const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.FAIL);
        });
        it('returns PASS if any rule PASSes (and short-circuits)', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.FAIL).mockReturnValueOnce(interfaces_1.EvaluationState.PASS).mockReturnValueOnce(interfaces_1.EvaluationState.FAIL);
            const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2), createRule('r3', 'equals', 3)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.PASS);
            expect(evaluateSpy).toHaveBeenCalledTimes(2); // Short-circuited on r2
        });
        it('returns MISSING if FAIL + MISSING', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.FAIL).mockReturnValueOnce(interfaces_1.EvaluationState.MISSING);
            const group = createGroup('g1', 'OR', [createRule('r1', 'equals', 1), createRule('r2', 'equals', 2)]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.MISSING);
        });
    });
    describe('Nested RuleGroups', () => {
        it('evaluates nested groups correctly (AND containing OR)', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.PASS).mockReturnValueOnce(interfaces_1.EvaluationState.PASS); // outer rule, inner rule
            const nestedGroup = createGroup('g2', 'OR', [createRule('r2', 'equals', 2)]);
            const outerGroup = createGroup('g1', 'AND', [createRule('r1', 'equals', 1)], [nestedGroup]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(outerGroup, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.PASS);
            expect(result.nestedGroupResults[0].state).toBe(interfaces_1.EvaluationState.PASS);
        });
        it('short-circuits nested groups on AND failure', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.FAIL); // Outer rule fails, shouldn't evaluate inner group
            const nestedGroup = createGroup('g2', 'OR', [createRule('r2', 'equals', 2)]);
            const outerGroup = createGroup('g1', 'AND', [createRule('r1', 'equals', 1)], [nestedGroup]);
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(outerGroup, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.FAIL);
            expect(result.nestedGroupResults.length).toBe(0); // Nested group skipped
        });
    });
    describe('Memoization', () => {
        it('uses cached rule result without calling RuleEvaluator again', () => {
            evaluateSpy.mockReturnValueOnce(interfaces_1.EvaluationState.PASS);
            const rule = createRule('r1', 'equals', 1);
            const group = createGroup('g1', 'AND', [rule, rule]); // Same rule twice
            const result = RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(group, {}, cache);
            expect(result.state).toBe(interfaces_1.EvaluationState.PASS);
            expect(evaluateSpy).toHaveBeenCalledTimes(1); // Second call came from cache
        });
    });
    describe('Depth Protection (Circular References)', () => {
        it('throws EngineError when max depth is exceeded', () => {
            const g1 = createGroup('g1', 'AND', []);
            const g2 = createGroup('g2', 'AND', [], [g1]);
            g1.nestedGroups.push(g2); // Circular reference created
            expect(() => RuleGroupEvaluator_1.RuleGroupEvaluator.evaluate(g1, {}, cache)).toThrow(EngineError_1.EngineError);
        });
    });
});
