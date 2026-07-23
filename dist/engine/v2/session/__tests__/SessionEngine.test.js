"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionStateMachine_1 = require("../SessionStateMachine");
const interfaces_1 = require("../interfaces");
const SessionMerger_1 = require("../SessionMerger");
const SessionManager_1 = require("../SessionManager");
const SessionLoader_1 = require("../SessionLoader");
const SessionSaver_1 = require("../SessionSaver");
const SessionTimeline_1 = require("../SessionTimeline");
const SessionValidator_1 = require("../SessionValidator");
const SessionRecovery_1 = require("../SessionRecovery");
const SessionProgress_1 = require("../SessionProgress");
const errors_1 = require("../errors");
describe('Assessment Session Engine', () => {
    describe('SessionStateMachine', () => {
        const fsm = new SessionStateMachine_1.SessionStateMachine();
        it('allows valid transitions', () => {
            expect(fsm.transition(interfaces_1.SessionState.NEW, interfaces_1.SessionState.IN_PROGRESS)).toBe(interfaces_1.SessionState.IN_PROGRESS);
            expect(fsm.transition(interfaces_1.SessionState.EVALUATING, interfaces_1.SessionState.AI_REQUIRED)).toBe(interfaces_1.SessionState.AI_REQUIRED);
        });
        it('throws InvalidStateTransitionError on illegal transitions', () => {
            expect(() => {
                fsm.transition(interfaces_1.SessionState.NEW, interfaces_1.SessionState.COMPLETED);
            }).toThrow(errors_1.InvalidStateTransitionError);
        });
    });
    describe('SessionMerger', () => {
        const merger = new SessionMerger_1.SessionMerger();
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
        let mockRepo;
        let manager;
        let mockSession;
        beforeEach(() => {
            mockSession = {
                sessionId: 'test-123',
                userId: 'u1',
                state: interfaces_1.SessionState.IN_PROGRESS,
                payload: {},
                configVersionId: 'v1',
                timeline: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockRepo = {
                findById: jest.fn().mockResolvedValue(mockSession),
                save: jest.fn().mockImplementation((s, updatedAt) => {
                    if (s.updatedAt === updatedAt)
                        throw new Error('Lock Error Mock');
                    return Promise.resolve(s);
                })
            };
            const validator = new SessionValidator_1.SessionValidator();
            const loader = new SessionLoader_1.SessionLoader(mockRepo, validator);
            const saver = new SessionSaver_1.SessionSaver(mockRepo);
            const merger = new SessionMerger_1.SessionMerger();
            const progress = new SessionProgress_1.SessionProgress();
            const timeline = new SessionTimeline_1.SessionTimeline();
            const fsm = new SessionStateMachine_1.SessionStateMachine();
            const recovery = new SessionRecovery_1.SessionRecovery(fsm, timeline);
            manager = new SessionManager_1.SessionManager(loader, saver, merger, progress, timeline, fsm, recovery);
        });
        it('loads session successfully if config matches', async () => {
            const session = await manager.loadSession('test-123', 'v1');
            expect(session.sessionId).toBe('test-123');
        });
        it('throws SessionValidationError if config version mismatches', async () => {
            await expect(manager.loadSession('test-123', 'v2')).rejects.toThrow(errors_1.SessionValidationError);
        });
        it('saves answers and updates timeline and state', async () => {
            const result = await manager.saveAnswers('test-123', 'v1', { a: 1 });
            expect(result.payload.a).toBe(1);
            expect(result.state).toBe(interfaces_1.SessionState.PARTIALLY_COMPLETED);
            expect(result.timeline.some(e => e.type === 'ANSWER_SUBMITTED')).toBe(true);
        });
        it('throws OptimisticLockError if save rejects with specific error shape', async () => {
            mockRepo.save.mockRejectedValue(Object.assign(new Error(), { name: 'OptimisticLockError' }));
            await expect(manager.saveAnswers('test-123', 'v1', { a: 1 })).rejects.toThrow(errors_1.OptimisticLockError);
        });
    });
    describe('SessionRecovery', () => {
        it('rolls back stale EVALUATING sessions', () => {
            const recovery = new SessionRecovery_1.SessionRecovery(new SessionStateMachine_1.SessionStateMachine(), new SessionTimeline_1.SessionTimeline());
            const staleDate = new Date();
            staleDate.setMinutes(staleDate.getMinutes() - 10); // 10 minutes ago
            const session = {
                state: interfaces_1.SessionState.EVALUATING,
                updatedAt: staleDate,
                timeline: []
            };
            const recovered = recovery.recoverIfNeeded(session);
            expect(recovered.state).toBe(interfaces_1.SessionState.WAITING_FOR_USER);
            expect(recovered.timeline.length).toBe(1);
            expect(recovered.timeline[0].type).toBe('STATE_CHANGED');
        });
        it('ignores fresh EVALUATING sessions', () => {
            const recovery = new SessionRecovery_1.SessionRecovery(new SessionStateMachine_1.SessionStateMachine(), new SessionTimeline_1.SessionTimeline());
            const session = {
                state: interfaces_1.SessionState.EVALUATING,
                updatedAt: new Date(), // Just now
                timeline: []
            };
            const recovered = recovery.recoverIfNeeded(session);
            expect(recovered.state).toBe(interfaces_1.SessionState.EVALUATING);
            expect(recovered.timeline.length).toBe(0);
        });
    });
});
