"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GrantEvaluator_1 = require("../GrantEvaluator");
const RuleGroupEvaluator_1 = require("../RuleGroupEvaluator");
const interfaces_1 = require("../../interfaces");
describe('GrantEvaluator', () => {
    const createMockGrant = (id, name) => ({
        grantId: id,
        name,
        description: '',
        agency: '',
        category: '',
        priority: 1,
        status: 'ACTIVE',
        version: 1,
        ruleGroup: {}
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
    const createGroupResult = (state, matched, failed, missing) => {
        const ruleResults = [];
        for (let i = 0; i < matched; i++)
            ruleResults.push({ ruleId: `m${i}`, state: interfaces_1.EvaluationState.PASS });
        for (let i = 0; i < failed; i++)
            ruleResults.push({ ruleId: `f${i}`, state: interfaces_1.EvaluationState.FAIL });
        for (let i = 0; i < missing; i++)
            ruleResults.push({ ruleId: `x${i}`, state: interfaces_1.EvaluationState.MISSING });
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
        const groupResult = createGroupResult(interfaces_1.EvaluationState.PASS, 3, 0, 0); // 3 passed
        jest.spyOn(RuleGroupEvaluator_1.RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);
        const result = GrantEvaluator_1.GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator_1.RuleGroupEvaluator);
        expect(result.state).toBe(interfaces_1.GrantState.ELIGIBLE);
        expect(result.completionPercentage).toBe(100);
        expect(result.ruleCoverage).toBe(100);
        expect(result.matchedRulesCount).toBe(3);
        expect(result.explanation.reasonSummary).toContain('fully eligible');
    });
    it('maps FAIL to NOT_ELIGIBLE', () => {
        const grant = createMockGrant('g1', 'Startup Grant');
        const groupResult = createGroupResult(interfaces_1.EvaluationState.FAIL, 2, 1, 0); // 2 passed, 1 failed
        jest.spyOn(RuleGroupEvaluator_1.RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);
        const result = GrantEvaluator_1.GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator_1.RuleGroupEvaluator);
        expect(result.state).toBe(interfaces_1.GrantState.NOT_ELIGIBLE);
        expect(result.failedRulesCount).toBe(1);
        expect(result.explanation.failureSummary).toContain('failed 1 criteria');
    });
    it('maps MISSING to POTENTIALLY_ELIGIBLE and calculates correct coverage', () => {
        const grant = createMockGrant('g1', 'Startup Grant');
        const groupResult = createGroupResult(interfaces_1.EvaluationState.MISSING, 1, 0, 1); // 1 passed, 1 missing
        jest.spyOn(RuleGroupEvaluator_1.RuleGroupEvaluator, 'evaluate').mockReturnValue(groupResult);
        const result = GrantEvaluator_1.GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator_1.RuleGroupEvaluator);
        expect(result.state).toBe(interfaces_1.GrantState.POTENTIALLY_ELIGIBLE);
        expect(result.missingRulesCount).toBe(1);
        expect(result.completionPercentage).toBe(50); // 1/2 complete
        expect(result.explanation.missingSummary).toContain('Missing data for 1 rules');
        expect(result.explanation.reasonSummary).toContain('might be eligible');
    });
    it('collects metrics correctly from nested group results', () => {
        const grant = createMockGrant('g1', 'Nested Grant');
        const nestedResult = {
            groupId: 'g2',
            state: interfaces_1.EvaluationState.MISSING,
            ruleResults: [
                { ruleId: 'r1', state: interfaces_1.EvaluationState.MISSING },
                { ruleId: 'r2', state: interfaces_1.EvaluationState.PASS }
            ],
            nestedGroupResults: []
        };
        const rootResult = {
            groupId: 'g1',
            state: interfaces_1.EvaluationState.MISSING,
            ruleResults: [
                { ruleId: 'r3', state: interfaces_1.EvaluationState.PASS }
            ],
            nestedGroupResults: [nestedResult]
        };
        jest.spyOn(RuleGroupEvaluator_1.RuleGroupEvaluator, 'evaluate').mockReturnValue(rootResult);
        const result = GrantEvaluator_1.GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator_1.RuleGroupEvaluator);
        expect(result.matchedRulesCount).toBe(2);
        expect(result.missingRulesCount).toBe(1);
        expect(result.failedRulesCount).toBe(0);
        // Total rules = 3 (2 passed, 1 missing)
        expect(result.completionPercentage).toBeCloseTo(66.67, 1);
    });
    it('tracks execution time', () => {
        const grant = createMockGrant('g1', 'Timing Grant');
        jest.spyOn(RuleGroupEvaluator_1.RuleGroupEvaluator, 'evaluate').mockReturnValue(createGroupResult(interfaces_1.EvaluationState.PASS, 1, 0, 0));
        const result = GrantEvaluator_1.GrantEvaluator.evaluate(grant, createContext(), createCache(), RuleGroupEvaluator_1.RuleGroupEvaluator);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
});
