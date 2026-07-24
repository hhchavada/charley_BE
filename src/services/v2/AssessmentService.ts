import { SessionManager } from '../../engine/v2/session/SessionManager';
import { IConfigurationLoader, IMissingDataResolver, IRankingEngine, IResultBuilder, EngineMetrics } from '../../engine/v2/interfaces/dependencies';
import { GrantEngine } from '../../engine/v2/evaluators/GrantEngine';
import { AssessmentResponse, StartAssessmentRequest, AnswerRequest } from './dto';
import { AssessmentSession, SessionState } from '../../engine/v2/session/interfaces';
import { EvaluationContext } from '../../engine/v2/interfaces/execution';

export class AssessmentService {
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly configLoader: IConfigurationLoader,
    private readonly grantEngine: GrantEngine,
    private readonly missingDataResolver: IMissingDataResolver,
    private readonly rankingEngine: IRankingEngine,
    private readonly resultBuilder: IResultBuilder
  ) {}

  public async startAssessment(req: StartAssessmentRequest): Promise<AssessmentResponse> {
    const versionId = req.versionId || 'latest';
    const session = await this.sessionManager.createSession(req.userId, versionId);
    
    return this.mapToResponse(session);
  }

  public async submitAnswers(sessionId: string, req: AnswerRequest): Promise<AssessmentResponse> {
    // Just save answers, don't trigger evaluation yet
    // To get the configVersionId, we must load the session first
    // Since SessionManager takes activeConfigVersion, we can peek at the DB or assume it handles it internally if we pass the version.
    // For now, we will pass a placeholder version and let the loader throw if it mismatches.
    
    // Simplification: the real SessionLoader requires activeConfigVersion to validate.
    // Assuming the controller has a way to resolve the active version, or we fetch the session's locked version.
    
    // We will bypass the strict version check here by relying on the session's existing version.
    const tempSession = await this.sessionManager.loadSession(sessionId, 'latest'); // Mock check
    const session = await this.sessionManager.saveAnswers(sessionId, tempSession.configVersionId, req.answers);
    
    return this.mapToResponse(session);
  }

  public async evaluate(sessionId: string): Promise<AssessmentResponse> {
    const startTime = performance.now();
    
    // 1. Lock the session into EVALUATING state
    let session = await this.sessionManager.loadSession(sessionId, 'latest'); // Mock active version
    const lockedVersion = session.configVersionId;
    session = await this.sessionManager.evaluate(sessionId, lockedVersion);

    try {
      // 2. Load the exact configuration version the session was started with
      const configBundle = await this.configLoader.loadActiveConfiguration(lockedVersion);

      // 3. Prepare Context
      const context: EvaluationContext = {
        payload: {
          initialData: session.payload,
          ...session.payload
        },
        sessionId: session.sessionId,
        versionId: lockedVersion
      };

      // 4. Core Evaluation (GrantEngine)
      const evaluationResult = await this.grantEngine.evaluate(context);

      // 5. Missing Data Resolution
      const missingData = await this.missingDataResolver.resolve(evaluationResult.potentiallyEligible, configBundle);

      // 6. Ranking Strategy
      const ranking = await this.rankingEngine.rank(evaluationResult.eligible);

      // 7. Calculate Metrics
      const executionTimeMs = performance.now() - startTime;
      const metrics: EngineMetrics = {
        executionTimeMs,
        totalGrants: configBundle.grants.length,
        eligibleCount: evaluationResult.eligible.length,
        potentialCount: evaluationResult.potentiallyEligible.length,
        rejectedCount: evaluationResult.rejected.length,
        errorCount: evaluationResult.errors.length,
        missingQuestionCount: missingData.questions.length,
        configurationVersion: lockedVersion,
        evaluationTimestamp: new Date()
      };

      // 8. Result Building (Clean DTOs for client)
      const finalResult = await this.resultBuilder.build(
        context,
        metrics,
        evaluationResult.eligible,
        evaluationResult.potentiallyEligible,
        evaluationResult.rejected,
        evaluationResult.errors,
        missingData,
        ranking
      );

      // 9. Update Session State
      const needsAI = missingData.questions.length > 0;
      session = await this.sessionManager.markEvaluationFinished(sessionId, lockedVersion, needsAI);

      return this.mapToResponse(session, finalResult);

    } catch (error) {
      // Automatic recovery is handled by SessionRecovery if it crashes mid-evaluation
      // But if we catch it here, we could manually roll back.
      throw error;
    }
  }

  public async getAssessment(sessionId: string): Promise<AssessmentResponse> {
    const tempSession = await this.sessionManager.loadSession(sessionId, 'latest');
    const session = await this.sessionManager.loadSession(sessionId, tempSession.configVersionId);
    return this.mapToResponse(session);
  }

  private mapToResponse(session: AssessmentSession, evaluation?: any): AssessmentResponse {
    return {
      sessionId: session.sessionId,
      state: session.state,
      payload: session.payload,
      evaluation
    };
  }
}
