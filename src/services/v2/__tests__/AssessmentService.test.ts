import { AssessmentService } from '../AssessmentService';
import { SessionManager } from '../../../engine/v2/session/SessionManager';
import { GrantEngine } from '../../../engine/v2/evaluators/GrantEngine';
import { SessionState, AssessmentSession } from '../../../engine/v2/session/interfaces';
import { StartAssessmentRequest } from '../dto';

describe('AssessmentService Integration Layer', () => {
  let sessionManagerMock: jest.Mocked<SessionManager>;
  let configLoaderMock: any;
  let grantEngineMock: jest.Mocked<GrantEngine>;
  let missingDataMock: any;
  let rankingEngineMock: any;
  let resultBuilderMock: any;
  let service: AssessmentService;

  const mockSession: AssessmentSession = {
    sessionId: 'sess-1',
    userId: 'u1',
    state: SessionState.IN_PROGRESS,
    payload: {},
    configVersionId: 'v1',
    timeline: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    sessionManagerMock = {
      createSession: jest.fn().mockResolvedValue(mockSession),
      loadSession: jest.fn().mockResolvedValue(mockSession),
      saveAnswers: jest.fn().mockResolvedValue({ ...mockSession, payload: { a: 1 } }),
      evaluate: jest.fn().mockResolvedValue({ ...mockSession, state: SessionState.EVALUATING }),
      markEvaluationFinished: jest.fn().mockImplementation((id, ver, needsAI) => {
        return Promise.resolve({ ...mockSession, state: needsAI ? SessionState.AI_REQUIRED : SessionState.COMPLETED });
      })
    } as any;

    configLoaderMock = { loadActiveConfiguration: jest.fn().mockResolvedValue({ grants: [] }) };
    
    grantEngineMock = {
      evaluate: jest.fn().mockReturnValue({ eligible: [], potentiallyEligible: [], rejected: [], errors: [] })
    } as any;

    missingDataMock = { resolve: jest.fn().mockResolvedValue({ questions: [{ id: 'q1' }] }) };
    rankingEngineMock = { rank: jest.fn().mockResolvedValue({ readyNow: [] }) };
    resultBuilderMock = { build: jest.fn().mockResolvedValue({ status: 'done' }) };

    service = new AssessmentService(
      sessionManagerMock, configLoaderMock, grantEngineMock, missingDataMock, rankingEngineMock, resultBuilderMock
    );
  });

  it('starts an assessment and returns sessionId', async () => {
    const req: StartAssessmentRequest = { userId: 'u1' };
    const res = await service.startAssessment(req);
    expect(res.sessionId).toBe('sess-1');
    expect(sessionManagerMock.createSession).toHaveBeenCalledWith('u1', 'latest');
  });

  it('submits answers and merges payload', async () => {
    const res = await service.submitAnswers('sess-1', { answers: { a: 1 } });
    expect(res.payload).toEqual({ a: 1 });
    expect(sessionManagerMock.saveAnswers).toHaveBeenCalledWith('sess-1', 'v1', { a: 1 });
  });

  it('evaluates the pipeline and transitions state to AI_REQUIRED when questions are missing', async () => {
    const res = await service.evaluate('sess-1');
    
    expect(configLoaderMock.loadActiveConfiguration).toHaveBeenCalledWith('v1');
    expect(grantEngineMock.evaluate).toHaveBeenCalled();
    expect(missingDataMock.resolve).toHaveBeenCalled();
    expect(rankingEngineMock.rank).toHaveBeenCalled();
    expect(resultBuilderMock.build).toHaveBeenCalled();
    
    // MissingDataMock returns 1 question, so it should transition to AI_REQUIRED
    expect(sessionManagerMock.markEvaluationFinished).toHaveBeenCalledWith('sess-1', 'v1', true);
    expect(res.state).toBe(SessionState.AI_REQUIRED);
  });
});
