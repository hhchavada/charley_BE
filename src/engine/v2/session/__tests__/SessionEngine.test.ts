import { SessionStateMachine } from '../SessionStateMachine';
import { SessionState, AssessmentSession, ISessionRepository } from '../interfaces';
import { SessionMerger } from '../SessionMerger';
import { SessionManager } from '../SessionManager';
import { SessionLoader } from '../SessionLoader';
import { SessionSaver } from '../SessionSaver';
import { SessionTimeline } from '../SessionTimeline';
import { SessionValidator } from '../SessionValidator';
import { SessionRecovery } from '../SessionRecovery';
import { SessionProgress } from '../SessionProgress';
import { OptimisticLockError, InvalidStateTransitionError, SessionValidationError } from '../errors';

describe('Assessment Session Engine', () => {

  describe('SessionStateMachine', () => {
    const fsm = new SessionStateMachine();

    it('allows valid transitions', () => {
      expect(fsm.transition(SessionState.NEW, SessionState.IN_PROGRESS)).toBe(SessionState.IN_PROGRESS);
      expect(fsm.transition(SessionState.EVALUATING, SessionState.AI_REQUIRED)).toBe(SessionState.AI_REQUIRED);
    });

    it('throws InvalidStateTransitionError on illegal transitions', () => {
      expect(() => {
        fsm.transition(SessionState.NEW, SessionState.COMPLETED);
      }).toThrow(InvalidStateTransitionError);
    });
  });

  describe('SessionMerger', () => {
    const merger = new SessionMerger();

    it('deep merges nested objects', () => {
      const existing = { company: { name: 'A', id: 1 } };
      const incoming = { company: { name: 'B', uen: '123' }, revenue: 100 };
      const result = merger.merge(existing, incoming);
      expect(result).toEqual({ company: { name: 'B', id: 1, uen: '123' }, revenue: 100 });
    });

    it('replaces arrays entirely', () => {
      const existing = { tags: ['a', 'b'] };
      const incoming = { tags: ['c'] }; // Unchecking 'a' and 'b', checking 'c'
      const result = merger.merge(existing, incoming);
      expect(result).toEqual({ tags: ['c'] });
    });
  });

  describe('SessionManager & Persistence', () => {
    let mockRepo: jest.Mocked<ISessionRepository>;
    let manager: SessionManager;
    let mockSession: AssessmentSession;

    beforeEach(() => {
      mockSession = {
        sessionId: 'test-123',
        userId: 'u1',
        state: SessionState.IN_PROGRESS,
        payload: {},
        configVersionId: 'v1',
        timeline: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepo = {
        findById: jest.fn().mockResolvedValue(mockSession),
        save: jest.fn().mockImplementation((s, updatedAt) => {
          if (s.updatedAt === updatedAt) throw new Error('Lock Error Mock');
          return Promise.resolve(s);
        })
      };

      const validator = new SessionValidator();
      const loader = new SessionLoader(mockRepo, validator);
      const saver = new SessionSaver(mockRepo);
      const merger = new SessionMerger();
      const progress = new SessionProgress();
      const timeline = new SessionTimeline();
      const fsm = new SessionStateMachine();
      const recovery = new SessionRecovery(fsm, timeline);

      manager = new SessionManager(loader, saver, merger, progress, timeline, fsm, recovery);
    });

    it('loads session successfully if config matches', async () => {
      const session = await manager.loadSession('test-123', 'v1');
      expect(session.sessionId).toBe('test-123');
    });

    it('throws SessionValidationError if config version mismatches', async () => {
      await expect(manager.loadSession('test-123', 'v2')).rejects.toThrow(SessionValidationError);
    });

    it('saves answers and updates timeline and state', async () => {
      const result = await manager.saveAnswers('test-123', 'v1', { a: 1 });
      expect(result.payload.a).toBe(1);
      expect(result.state).toBe(SessionState.PARTIALLY_COMPLETED);
      expect(result.timeline.some(e => e.type === 'ANSWER_SUBMITTED')).toBe(true);
    });

    it('throws OptimisticLockError if save rejects with specific error shape', async () => {
      mockRepo.save.mockRejectedValue(Object.assign(new Error(), { name: 'OptimisticLockError' }));
      await expect(manager.saveAnswers('test-123', 'v1', { a: 1 })).rejects.toThrow(OptimisticLockError);
    });
  });

  describe('SessionRecovery', () => {
    it('rolls back stale EVALUATING sessions', () => {
      const recovery = new SessionRecovery(new SessionStateMachine(), new SessionTimeline());
      const staleDate = new Date();
      staleDate.setMinutes(staleDate.getMinutes() - 10); // 10 minutes ago
      
      const session = {
        state: SessionState.EVALUATING,
        updatedAt: staleDate,
        timeline: []
      } as unknown as AssessmentSession;

      const recovered = recovery.recoverIfNeeded(session);
      expect(recovered.state).toBe(SessionState.WAITING_FOR_USER);
      expect(recovered.timeline.length).toBe(1);
      expect(recovered.timeline[0].type).toBe('STATE_CHANGED');
    });

    it('ignores fresh EVALUATING sessions', () => {
      const recovery = new SessionRecovery(new SessionStateMachine(), new SessionTimeline());
      
      const session = {
        state: SessionState.EVALUATING,
        updatedAt: new Date(), // Just now
        timeline: []
      } as unknown as AssessmentSession;

      const recovered = recovery.recoverIfNeeded(session);
      expect(recovered.state).toBe(SessionState.EVALUATING);
      expect(recovered.timeline.length).toBe(0);
    });
  });
});
