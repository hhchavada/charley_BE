import { AssessmentSession, SessionState } from './interfaces';
import { SessionStateMachine } from './SessionStateMachine';
import { SessionTimeline } from './SessionTimeline';

export class SessionRecovery {
  constructor(
    private readonly stateMachine: SessionStateMachine,
    private readonly timeline: SessionTimeline
  ) {}

  /**
   * Recovers a session that might have crashed during evaluation.
   * If a session has been in EVALUATING for > 5 minutes, we roll it back.
   */
  public recoverIfNeeded(session: AssessmentSession): AssessmentSession {
    if (session.state === SessionState.EVALUATING || session.state === SessionState.AI_REQUIRED) {
      const now = new Date().getTime();
      const lastUpdate = session.updatedAt.getTime();
      const minutesSinceUpdate = (now - lastUpdate) / 60000;

      if (minutesSinceUpdate > 5) {
        // Rollback to WAITING_FOR_USER so they can re-trigger evaluation
        session.state = this.stateMachine.transition(session.state, SessionState.WAITING_FOR_USER);
        this.timeline.addEvent(session, 'STATE_CHANGED', { reason: 'System Recovery from stale evaluation state' });
      }
    }
    return session;
  }
}
