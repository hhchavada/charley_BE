"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultBuilder = void 0;
class ResultBuilder {
    async build(context, metrics, eligible, potentiallyEligible, rejected, errors, missingData, ranking) {
        const startTime = performance.now();
        const isDebugMode = context.payload?._debugMode === true;
        // 1. Map Questions
        const questions = (missingData?.questions || []).map(q => ({
            questionId: q.questionId,
            title: q.title || 'Question Title Placeholder',
            description: q.systemHint,
            type: q.expectedAnswerType || 'text',
            placeholder: q.placeholder || 'Enter answer...',
            options: q.options || [],
            validation: q.validation || {},
            fieldName: q.fieldName,
            priority: q.priority,
            group: q.semanticCategory,
            section: q.semanticCategory,
            AIContext: q.aiContext
        }));
        // 2. Map Recommendations (Ready Now, Needs Info, etc.)
        const mapRecommendation = (r) => ({
            grantId: r.grantResult.grant.grantId,
            title: r.grantResult.grant.name,
            headline: r.grantResult.grant.estimatedFunding,
            subHeadline: r.grantResult.grant.category,
            typicalFunding: r.grantResult.grant.estimatedFunding,
            supportPercentage: r.grantResult.grant.supportPercentage || 'Up to 70%',
            processingTime: r.grantResult.grant.timeline || 'N/A',
            confidence: 100, // Placeholder
            recommendationScore: r.recommendationScore || 0,
            badges: r.badges || [],
            status: r.grantResult.state,
            recommendedActions: [],
            whyRecommended: r.whyRecommended,
            AIExplanation: r.AIExplanation,
            stream: r.recommendedStream ? r.recommendedStream.grant.name : undefined,
            matchedStreams: r.mergedStreams ? r.mergedStreams.map((s) => s.grant.name) : undefined,
            matchedRules: r.grantResult.matchedRuleIds || [],
            failedRules: r.grantResult.failedRuleIds || [],
            missingFields: r.grantResult.missingRuleIds || [],
            selectedStream: r.isMergedCard && r.recommendedStream ? r.recommendedStream.grant.name : undefined
        });
        const readyNow = (ranking?.readyNow || []).map(mapRecommendation);
        const needsInfo = (ranking?.needsInformation || []).map(mapRecommendation);
        const prepareNext = (ranking?.prepareNext || []).map(mapRecommendation);
        const windowClosed = (ranking?.windowClosed || []).map(mapRecommendation);
        const hidden = (ranking?.hidden || []).map(mapRecommendation);
        // 3. Map Funding Summary
        const funding = {
            EstimatedFunding: ranking?.fundingSummary?.estimatedFunding || 0,
            MaximumFunding: ranking?.fundingSummary?.maximumFunding || 0,
            FundingRange: ranking?.fundingSummary?.fundingRange || '$0',
            SupportPercentage: ranking?.fundingSummary?.supportPercentage || 'N/A',
            FundingBreakdown: {},
            GrantBreakdown: {},
            GrantCategories: []
        };
        // 4. Build Statistics
        const statistics = {
            grantsEvaluated: metrics.totalGrants,
            rulesEvaluated: metrics.rulesEvaluated || 0,
            passedRules: metrics.passedRules || 0,
            failedRules: metrics.failedRules || 0,
            missingRules: metrics.missingRules || (missingData?.statistics?.totalMissingRules || 0),
            executionTime: metrics.executionTimeMs,
            rankingTime: 0, // Passed from RankingEngine later if needed
            resultBuildTime: performance.now() - startTime
        };
        // 5. Assemble DTO
        const result = {
            assessment: {
                id: `assess_${Date.now()}`,
                version: '1.0',
                startedAt: metrics.evaluationTimestamp.toISOString(),
                completedAt: new Date().toISOString(),
                duration: metrics.executionTimeMs,
                status: 'COMPLETED'
            },
            session: {
                sessionId: context.sessionId || `sess_${Date.now()}`,
                resumeToken: 'token_xyz',
                conversationMode: 'AUTO',
                assessmentMode: 'STANDARD',
                version: context.versionId
            },
            summary: {
                totalEligible: readyNow.length + prepareNext.length,
                totalPotential: needsInfo.length,
                totalPrepareNext: prepareNext.length,
                totalHidden: hidden.length,
                totalRejected: rejected.length,
                overallConfidence: 85, // Placeholder
                overallCompletion: missingData?.completionPercentage || 100,
                estimatedFunding: funding.EstimatedFunding,
                maximumFunding: funding.MaximumFunding,
                fundingRange: funding.FundingRange
            },
            recommendations: {
                readyNow,
                needsInformation: needsInfo,
                prepareNext,
                windowClosed,
                hidden
            },
            funding,
            questions,
            statistics,
            metadata: {
                engineVersion: '2.0.0',
                configurationVersion: context.versionId,
                assessmentVersion: '1.0.0'
            }
        };
        // 6. Diagnostics (Only if debug mode is active)
        if (isDebugMode) {
            result.diagnostics = {
                warnings: missingData?.diagnostics?.warnings || [],
                configurationIssues: ranking?.diagnostics?.missingConfiguration || [],
                brokenReferences: missingData?.diagnostics?.brokenReferences || [],
                performanceMetrics: {
                    metrics,
                    rankingStats: ranking?.statistics
                }
            };
            if (errors.length > 0) {
                result.errors = errors.map(e => ({
                    code: 'GRANT_EVAL_ERROR',
                    message: e.explanation?.failureSummary || 'Unknown error during evaluation',
                    recoverable: true
                }));
            }
        }
        // 7. AI Support Context
        result.aiSupport = {
            conversationStarter: 'Hello! I noticed you are missing some information.',
            nextBestQuestion: questions.length > 0 ? questions[0].questionId : undefined,
            AIRecommendationSummary: 'You have some strong matches in the ready queue.',
            AIContextBundle: {}
        };
        return result;
    }
}
exports.ResultBuilder = ResultBuilder;
