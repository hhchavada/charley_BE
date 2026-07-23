import { IResultBuilder } from '../interfaces/dependencies';
import { 
  EvaluationContext, 
  GrantEvaluationResult, 
  MissingDataBundle, 
  RankingResult 
} from '../interfaces/execution';
import { EngineMetrics } from '../interfaces/dependencies';
import { 
  AssessmentResultDTO, 
  RecommendationDTO,
  PresentationQuestionDTO,
  FundingSummaryDTO
} from '../interfaces/presentation';

export class ResultBuilder implements IResultBuilder {
  
  public async build(
    context: EvaluationContext,
    metrics: EngineMetrics,
    eligible: GrantEvaluationResult[], 
    potentiallyEligible: GrantEvaluationResult[], 
    rejected: GrantEvaluationResult[], 
    errors: GrantEvaluationResult[],
    missingData?: MissingDataBundle,
    ranking?: RankingResult
  ): Promise<AssessmentResultDTO> {
    const startTime = performance.now();

    const isDebugMode = context.payload?._debugMode === true;

    // 1. Map Questions
    const questions: PresentationQuestionDTO[] = (missingData?.questions || []).map(q => ({
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
    const mapRecommendation = (r: any): RecommendationDTO => ({
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
      matchedStreams: r.mergedStreams ? r.mergedStreams.map((s: any) => s.grant.name) : undefined,
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
    const funding: FundingSummaryDTO = {
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
      rulesEvaluated: 0, // Placeholder, engine would need to pass this up
      passedRules: 0, 
      failedRules: 0,
      missingRules: missingData?.statistics?.totalMissingRules || 0,
      executionTime: metrics.executionTimeMs,
      rankingTime: 0, // Passed from RankingEngine later if needed
      resultBuildTime: performance.now() - startTime
    };

    // 5. Assemble DTO
    const result: AssessmentResultDTO = {
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
        totalEligible: eligible.length,
        totalPotential: potentiallyEligible.length,
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
