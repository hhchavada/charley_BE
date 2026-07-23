"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RuleExplanationBuilder_1 = require("../RuleExplanationBuilder");
const DecisionTraceBuilder_1 = require("../DecisionTraceBuilder");
const ScenarioComparator_1 = require("../ScenarioComparator");
describe('Enterprise Explainability & Simulation Engine', () => {
    describe('RuleExplanationBuilder', () => {
        const builder = new RuleExplanationBuilder_1.RuleExplanationBuilder();
        it('generates english explanation for PASS', () => {
            const explanation = builder.build({ state: 'PASS', actualValue: 500 }, { field: 'revenue', operator: 'GREATER_THAN', expectedValue: 100 });
            expect(explanation.humanReadable).toContain('Your revenue is 500');
            expect(explanation.humanReadable).toContain('more than 100');
        });
        it('generates english explanation for MISSING', () => {
            const explanation = builder.build({ state: 'MISSING', actualValue: undefined }, { field: 'employees', operator: 'LESS_THAN', expectedValue: 50 });
            expect(explanation.humanReadable).toContain("We don't know your employees yet");
        });
    });
    describe('DecisionTraceBuilder', () => {
        it('serializes deeply nested rule graph into trace tree', () => {
            const builder = new DecisionTraceBuilder_1.DecisionTraceBuilder();
            const mockResult = {
                grant: { grantId: 'g1' },
                state: 'ELIGIBLE',
                rootGroupResult: {
                    groupId: 'root',
                    state: 'PASS',
                    ruleResults: [{ ruleId: 'r1', state: 'PASS', expectedValue: 1, actualValue: 1 }]
                }
            };
            const trace = builder.build(mockResult);
            expect(trace.type).toBe('GRANT');
            expect(trace.children[0].type).toBe('GROUP');
            expect(trace.children[0].children[0].type).toBe('RULE');
            expect(trace.children[0].children[0].details).toContain('Actual: 1');
        });
    });
    describe('ScenarioComparator', () => {
        it('diffs newly qualified and lost grants correctly', () => {
            const comparator = new ScenarioComparator_1.ScenarioComparator();
            const scenarioA = { result: { recommendations: { readyNow: [{ grantId: 'g1' }] }, summary: { estimatedFunding: 500 }, questions: [] } };
            const scenarioB = { result: { recommendations: { readyNow: [{ grantId: 'g2' }] }, summary: { estimatedFunding: 1000 }, questions: [] } };
            const diff = comparator.compare(scenarioA, scenarioB);
            expect(diff.lostGrants).toContain('g1');
            expect(diff.newlyQualifiedGrants).toContain('g2');
            expect(diff.fundingDifference).toBe(500);
        });
    });
});
