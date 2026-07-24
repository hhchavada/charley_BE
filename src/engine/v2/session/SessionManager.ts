import { AssessmentSession, SessionState, ISessionRepository } from './interfaces';
import { SessionStateMachine } from './SessionStateMachine';
import { SessionMerger } from './SessionMerger';
import { SessionProgress, ProgressMetrics } from './SessionProgress';
import { SessionTimeline } from './SessionTimeline';
import { SessionLoader } from './SessionLoader';
import { SessionSaver } from './SessionSaver';
import { SessionRecovery } from './SessionRecovery';

export class SessionManager {
  constructor(
    private readonly loader: SessionLoader,
    private readonly saver: SessionSaver,
    private readonly merger: SessionMerger,
    private readonly progress: SessionProgress,
    private readonly timeline: SessionTimeline,
    private readonly stateMachine: SessionStateMachine,
    private readonly recovery: SessionRecovery
  ) {}

  public async createSession(userId: string, configVersionId: string): Promise<AssessmentSession> {
    const session: AssessmentSession = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      state: SessionState.NEW,
      payload: {},
      configVersionId,
      timeline: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.timeline.addEvent(session, 'CREATED', { configVersionId });
    session.state = this.stateMachine.transition(session.state, SessionState.IN_PROGRESS);
    this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });

    return await this.saver.save(session);
  }

  public async loadSession(sessionId: string, activeConfigVersion: string): Promise<AssessmentSession> {
    const session = await this.loader.load(sessionId, activeConfigVersion);
    return this.recovery.recoverIfNeeded(session);
  }

  public async saveAnswers(
    sessionId: string, 
    activeConfigVersion: string, 
    answers: Record<string, any>
  ): Promise<AssessmentSession> {
    let session = await this.loadSession(sessionId, activeConfigVersion);

    // Only allow answers in allowed states
    if (session.state === SessionState.NEW || session.state === SessionState.ARCHIVED) {
      throw new Error('Cannot save answers to session in current state.');
    }

    session.payload = this.merger.merge(session.payload, answers);
    
    this.timeline.addEvent(session, 'ANSWER_SUBMITTED', { updatedKeys: Object.keys(answers) });

    const targetState = (session.state === SessionState.AI_REQUIRED || session.state === SessionState.WAITING_FOR_USER)
      ? SessionState.READY_FOR_EVALUATION
      : SessionState.PARTIALLY_COMPLETED;

    session.state = this.stateMachine.transition(session.state, targetState);
    this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });

    return await this.saver.save(session);
  }

  public async evaluate(sessionId: string, activeConfigVersion: string): Promise<AssessmentSession> {
    let session = await this.loadSession(sessionId, activeConfigVersion);

    if (session.state === SessionState.COMPLETED) {
      return session;
    }

    // Transition to READY then EVALUATING
    if (session.state !== SessionState.READY_FOR_EVALUATION) {
      session.state = this.stateMachine.transition(session.state, SessionState.READY_FOR_EVALUATION);
    }
    
    session.state = this.stateMachine.transition(session.state, SessionState.EVALUATING);
    this.timeline.addEvent(session, 'EVALUATION_STARTED');

    return await this.saver.save(session);
  }

  public async markEvaluationFinished(sessionId: string, activeConfigVersion: string, needsAI: boolean): Promise<AssessmentSession> {
    let session = await this.loadSession(sessionId, activeConfigVersion);

    if (session.state === SessionState.COMPLETED && !needsAI) {
      return session;
    }

    this.timeline.addEvent(session, 'EVALUATION_FINISHED');
    const nextState = needsAI ? SessionState.AI_REQUIRED : SessionState.COMPLETED;
    
    session.state = this.stateMachine.transition(session.state, nextState);
    this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });

    return await this.saver.save(session);
  }

  public async archive(sessionId: string, activeConfigVersion: string): Promise<AssessmentSession> {
    let session = await this.loadSession(sessionId, activeConfigVersion);
    
    // Can only archive COMPLETED sessions
    session.state = this.stateMachine.transition(session.state, SessionState.ARCHIVED);
    this.timeline.addEvent(session, 'STATE_CHANGED', { state: session.state });

    return await this.saver.save(session);
  }

  public getProgress(session: AssessmentSession, missingRulesCount: number, totalExpectedRules: number): ProgressMetrics {
    return this.progress.calculate(session, missingRulesCount, totalExpectedRules);
  }
}
