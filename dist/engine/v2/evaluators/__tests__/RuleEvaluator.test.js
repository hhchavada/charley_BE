"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleEvaluator_1 = require("../RuleEvaluator");
const EngineError_1 = require("../../errors/EngineError");
describe('RuleEvaluator', () => {
    const createRule = (operator, value, fieldPath = 'field') => ({
        ruleId: 'r1',
        name: 'Test Rule',
        fieldPath,
        operator: operator,
        value,
        severity: 'BLOCKING',
        weight: 1
    });
    describe('Missing Data Handling', () => {
        it('returns MISSING if field is undefined', () => {
            const rule = createRule('equals', 'abc');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, {})).toBe("MISSING");
        });
        it('returns MISSING if field is null', () => {
            const rule = createRule('equals', 'abc');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: null })).toBe("MISSING");
        });
        it('returns MISSING if field is empty string', () => {
            const rule = createRule('equals', 'abc');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: '' })).toBe("MISSING");
        });
    });
    describe('exists and not_exists Operators', () => {
        it('exists returns PASS if value is present', () => {
            const rule = createRule('exists', null);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'value' })).toBe("PASS");
        });
        it('exists returns FAIL if value is missing', () => {
            const rule = createRule('exists', null);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, {})).toBe("FAIL");
        });
        it('not_exists returns PASS if value is missing', () => {
            const rule = createRule('not_exists', null);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, {})).toBe("PASS");
        });
        it('not_exists returns FAIL if value is present', () => {
            const rule = createRule('not_exists', null);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'value' })).toBe("FAIL");
        });
    });
    describe('equals Operator', () => {
        it('passes for matching strings', () => {
            const rule = createRule('equals', 'hello');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'hello' })).toBe("PASS");
        });
        it('fails for different strings', () => {
            const rule = createRule('equals', 'hello');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'world' })).toBe("FAIL");
        });
        it('passes for matching numbers', () => {
            const rule = createRule('equals', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 100 })).toBe("PASS");
        });
        it('passes for matching booleans', () => {
            const rule = createRule('equals', true);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: true })).toBe("PASS");
        });
        it('passes for matching dates (Date objects/strings)', () => {
            const rule = createRule('equals', '2023-01-01T00:00:00.000Z');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: new Date('2023-01-01T00:00:00.000Z') })).toBe("PASS");
        });
        it('passes for matching arrays', () => {
            const rule = createRule('equals', [1, 2, 3]);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: [1, 2, 3] })).toBe("PASS");
        });
        it('fails for arrays with different lengths or items', () => {
            const rule = createRule('equals', [1, 2, 3]);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: [1, 2] })).toBe("FAIL");
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: [1, 3, 2] })).toBe("FAIL");
        });
    });
    describe('not_equals Operator', () => {
        it('passes for different values', () => {
            const rule = createRule('not_equals', 'hello');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'world' })).toBe("PASS");
        });
        it('fails for identical values', () => {
            const rule = createRule('not_equals', 'hello');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'hello' })).toBe("FAIL");
        });
    });
    describe('Numeric Comparisons', () => {
        it('greater_than passes', () => {
            const rule = createRule('greater_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 150 })).toBe("PASS");
        });
        it('greater_than fails', () => {
            const rule = createRule('greater_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 50 })).toBe("FAIL");
        });
        it('greater_than fails on equal', () => {
            const rule = createRule('greater_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 100 })).toBe("FAIL");
        });
        it('less_than passes', () => {
            const rule = createRule('less_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 50 })).toBe("PASS");
        });
        it('less_than fails', () => {
            const rule = createRule('less_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 150 })).toBe("FAIL");
        });
        it('returns ERROR if values cannot be parsed to float', () => {
            const rule = createRule('greater_than', 100);
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'not_a_number' })).toBe("ERROR");
        });
    });
    describe('contains and not_contains', () => {
        it('contains passes if array includes value', () => {
            const rule = createRule('contains', 'tech');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: ['agri', 'tech', 'retail'] })).toBe("PASS");
        });
        it('contains fails if array does not include value', () => {
            const rule = createRule('contains', 'tech');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: ['agri', 'retail'] })).toBe("FAIL");
        });
        it('contains passes if string includes substring', () => {
            const rule = createRule('contains', 'hello');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'say hello world' })).toBe("PASS");
        });
        it('not_contains passes if array excludes value', () => {
            const rule = createRule('not_contains', 'tech');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: ['agri', 'retail'] })).toBe("PASS");
        });
        it('returns FAIL if contains is used on a number (not array/string)', () => {
            const rule = createRule('contains', 'tech');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 12345 })).toBe("FAIL");
        });
    });
    describe('regex Operator', () => {
        it('passes on match', () => {
            const rule = createRule('regex', '^SME-');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'SME-123' })).toBe("PASS");
        });
        it('fails on no match', () => {
            const rule = createRule('regex', '^SME-');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'CORP-123' })).toBe("FAIL");
        });
        it('fails gracefully on invalid regex pattern provided as expected value', () => {
            const rule = createRule('regex', '['); // Invalid regex syntax
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 'anything' })).toBe("FAIL");
        });
        it('fails if field is not a string', () => {
            const rule = createRule('regex', '^1');
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 123 })).toBe("FAIL");
        });
    });
    describe('Nested Paths & Edge Cases', () => {
        it('evaluates nested paths correctly', () => {
            const rule = createRule('equals', 50, 'company.financials.revenue');
            const payload = { company: { financials: { revenue: 50 } } };
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, payload)).toBe("PASS");
        });
        it('returns MISSING if nested path does not exist', () => {
            const rule = createRule('equals', 50, 'company.financials.profit');
            const payload = { company: { financials: { revenue: 50 } } };
            expect(RuleEvaluator_1.RuleEvaluator.evaluate(rule, payload)).toBe("MISSING");
        });
        it('throws EngineError for unknown operators', () => {
            const rule = createRule('magic_operator', 50);
            expect(() => RuleEvaluator_1.RuleEvaluator.evaluate(rule, { field: 50 })).toThrow(EngineError_1.EngineError);
        });
    });
});
