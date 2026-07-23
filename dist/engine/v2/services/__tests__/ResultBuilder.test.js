"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResultBuilder_1 = require("../ResultBuilder");
const execution_1 = require("../../interfaces/execution");
describe('ResultBuilder', () => {
    const builder = new ResultBuilder_1.ResultBuilder();
    const mockContext = {
        payload: {},
        sessionId: 'sess-123',
        versionId: 'v1'
    };
    const mockMetrics = {
        executionTimeMs: 50,
        totalGrants: 5,
        eligibleCount: 2,
        potentialCount: 1,
        rejectedCount: 1,
        errorCount: 1,
        missingQuestionCount: 1,
        configurationVersion: 'v1',
        evaluationTimestamp: new Date('2026-01-01T00:00:00Z')
    };
    const createMockGrantResult = (id, state) => ({
        grant: { grantId: id, name: `Grant ${id}` },
        state,
        score: 10,
        matchedRulesCount: 0,
        failedRulesCount: 0,
        missingRulesCount: 0,
        completionPercentage: 100,
        ruleCoverage: 100,
        explanation: {},
        executionTimeMs: 1,
        rootGroupResult: {}
    });
    const mockRanking = {
        readyNow: [{
                grantResult: createMockGrantResult('g1', execution_1.GrantState.ELIGIBLE),
                recommendationScore: 100,
                badges: ['Popular'],
                isMergedCard: false,
            }],
        needsInformation: [],
        prepareNext: [],
        windowClosed: [],
        hidden: [],
        statistics: { totalRanked: 1, mergedCardsCount: 0, totalEstimatedFunding: 50000 },
        fundingSummary: {
            estimatedFunding: 50000,
            maximumFunding: 60000,
            fundingRange: '$50k',
            supportPercentage: '70%',
            fundingType: 'Cash',
            grantCategory: 'Growth',
            processingTime: '4 weeks'
        },
        diagnostics: { duplicatePriority: [], missingConfiguration: [], invalidStream: [], brokenMergeRule: [], windowConflict: [] }
    };
    it('generates completely structured AssessmentResultDTO', async () => {
        const result = await builder.build(mockContext, mockMetrics, [createMockGrantResult('g1', execution_1.GrantState.ELIGIBLE)], [], [], [], undefined, mockRanking);
        // Summary validation
        expect(result.summary.totalEligible).toBe(1);
        expect(result.summary.estimatedFunding).toBe(50000);
        // Recommendations validation
        expect(result.recommendations.readyNow.length).toBe(1);
        expect(result.recommendations.readyNow[0].grantId).toBe('g1');
        expect(result.recommendations.readyNow[0].badges).toContain('Popular');
        // Security check: internal fields should not exist
        const strResult = JSON.stringify(result);
        expect(strResult).not.toContain('rootGroupResult');
        expect(strResult).not.toContain('matchedRulesCount');
        // Versioning
        expect(result.metadata.configurationVersion).toBe('v1');
    });
    it('exposes diagnostics ONLY when debugMode=true', async () => {
        const debugContext = { ...mockContext, payload: { _debugMode: true } };
        // Normal context -> no diagnostics
        let result = await builder.build(mockContext, mockMetrics, [], [], [], [], undefined, mockRanking);
        expect(result.diagnostics).toBeUndefined();
        // Debug context -> diagnostics present
        result = await builder.build(debugContext, mockMetrics, [], [], [], [], undefined, mockRanking);
        expect(result.diagnostics).toBeDefined();
        expect(result.diagnostics?.performanceMetrics).toBeDefined();
    });
    it('maps questions cleanly without exposing rule graphs', async () => {
        const mockMissingData = {
            questions: [
                {
                    questionId: 'q1',
                    fieldPath: 'revenue',
                    priority: 10,
                    affectedGrantCount: 1,
                    affectedGrantIds: ['g2'],
                    affectedRuleIds: ['r1'],
                    importance: 'HIGH',
                    completionImpact: 10,
                    estimatedFundingImpact: 0,
                    semanticCategory: 'Financials'
                }
            ],
            groups: [],
            statistics: {},
            diagnostics: {},
            completionPercentage: 50,
            estimatedUnlockableGrants: 1,
            estimatedUnlockableFunding: 0
        };
        const result = await builder.build(mockContext, mockMetrics, [], [], [], [], mockMissingData, mockRanking);
        expect(result.questions.length).toBe(1);
        expect(result.questions[0].questionId).toBe('q1');
        expect(result.questions[0].group).toBe('Financials');
        // Security check: Should not leak rule dependencies in frontend question DTO
        const strQuestion = JSON.stringify(result.questions[0]);
        expect(strQuestion).not.toContain('affectedRuleIds');
    });
    it('handles completely empty results safely', async () => {
        const result = await builder.build(mockContext, mockMetrics, [], [], [], [], undefined, undefined);
        expect(result.summary.totalEligible).toBe(0);
        expect(result.recommendations.readyNow.length).toBe(0);
        expect(result.questions.length).toBe(0);
    });
});
