"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const interfaces_1 = require("./interfaces");
class SessionManager {
    loader;
    saver;
    merger;
    progress;
    timeline;
    stateMachine;
    recovery;
    constructor(loader, saver, merger, progress, timeline, stateMachine, recovery) {
        this.loader = loader;
        this.saver = saver;
        this.merger = merger;
        this.progress = progress;
        this.timeline = timeline;
        this.stateMachine = stateMachine;
        this.recovery = recovery;
    }
    async createSession(userId, configVersionId) {
        const session = {
            sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            state: interfaces_1.SessionState.NEW,
            payload: {},
            configVersionId,
            timeline: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.timeline.addEvent(session, 'CREATED', { configVersionId });
        session.state = this.stateMachine.transition(session.state, interfaces_1.SessionState.IN_PROGRESS);
        this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });
        return await this.saver.save(session);
    }
    async loadSession(sessionId, activeConfigVersion) {
        const session = await this.loader.load(sessionId, activeConfigVersion);
        return this.recovery.recoverIfNeeded(session);
    }
    async saveAnswers(sessionId, activeConfigVersion, answers) {
        let session = await this.loadSession(sessionId, activeConfigVersion);
        // Only allow answers in allowed states
        if (session.state === interfaces_1.SessionState.NEW || session.state === interfaces_1.SessionState.ARCHIVED) {
            throw new Error('Cannot save answers to session in current state.');
        }
        console.log('3. existing session.payload:', JSON.stringify(session.payload, null, 2));
        session.payload = this.merger.merge(session.payload, answers);
        console.log('4. merged payload AFTER SessionMerger.merge():', JSON.stringify(session.payload, null, 2));
        this.timeline.addEvent(session, 'ANSWER_SUBMITTED', { updatedKeys: Object.keys(answers) });
        const targetState = (session.state === interfaces_1.SessionState.AI_REQUIRED || session.state === interfaces_1.SessionState.WAITING_FOR_USER)
            ? interfaces_1.SessionState.READY_FOR_EVALUATION
            : interfaces_1.SessionState.PARTIALLY_COMPLETED;
        session.state = this.stateMachine.transition(session.state, targetState);
        this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });
        return await this.saver.save(session);
    }
    async evaluate(sessionId, activeConfigVersion) {
        let session = await this.loadSession(sessionId, activeConfigVersion);
        if (session.state === interfaces_1.SessionState.COMPLETED) {
            return session;
        }
        // Transition to READY then EVALUATING
        if (session.state !== interfaces_1.SessionState.READY_FOR_EVALUATION) {
            session.state = this.stateMachine.transition(session.state, interfaces_1.SessionState.READY_FOR_EVALUATION);
        }
        session.state = this.stateMachine.transition(session.state, interfaces_1.SessionState.EVALUATING);
        this.timeline.addEvent(session, 'EVALUATION_STARTED');
        return await this.saver.save(session);
    }
    async markEvaluationFinished(sessionId, activeConfigVersion, needsAI) {
        let session = await this.loadSession(sessionId, activeConfigVersion);
        if (session.state === interfaces_1.SessionState.COMPLETED && !needsAI) {
            return session;
        }
        this.timeline.addEvent(session, 'EVALUATION_FINISHED');
        const nextState = needsAI ? interfaces_1.SessionState.AI_REQUIRED : interfaces_1.SessionState.COMPLETED;
        session.state = this.stateMachine.transition(session.state, nextState);
        this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });
        return await this.saver.save(session);
    }
    async archive(sessionId, activeConfigVersion) {
        let session = await this.loadSession(sessionId, activeConfigVersion);
        // Can only archive COMPLETED sessions
        session.state = this.stateMachine.transition(session.state, interfaces_1.SessionState.ARCHIVED);
        this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });
        return await this.saver.save(session);
    }
    getProgress(session, missingRulesCount, totalExpectedRules) {
        return this.progress.calculate(session, missingRulesCount, totalExpectedRules);
    }
}
exports.SessionManager = SessionManager;
