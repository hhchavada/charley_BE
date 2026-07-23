import { SessionState } from './interfaces';
import { InvalidStateTransitionError } from './errors';

export class SessionStateMachine {
  // Define allowed transitions from each state
  private static readonly transitions: Record<SessionState, Set<SessionState>> = {
    [SessionState.NEW]: new Set([SessionState.IN_PROGRESS]),
    [SessionState.IN_PROGRESS]: new Set([SessionState.PARTIALLY_COMPLETED, SessionState.WAITING_FOR_USER, SessionState.READY_FOR_EVALUATION]),
    [SessionState.PARTIALLY_COMPLETED]: new Set([SessionState.IN_PROGRESS, SessionState.WAITING_FOR_USER, SessionState.READY_FOR_EVALUATION]),
    [SessionState.WAITING_FOR_USER]: new Set([SessionState.IN_PROGRESS, SessionState.READY_FOR_EVALUATION]),
    [SessionState.READY_FOR_EVALUATION]: new Set([SessionState.EVALUATING]),
    [SessionState.EVALUATING]: new Set([SessionState.AI_REQUIRED, SessionState.COMPLETED, SessionState.WAITING_FOR_USER]),
    [SessionState.AI_REQUIRED]: new Set([SessionState.WAITING_FOR_USER, SessionState.IN_PROGRESS, SessionState.READY_FOR_EVALUATION]),
    [SessionState.COMPLETED]: new Set([SessionState.ARCHIVED]),
    [SessionState.ARCHIVED]: new Set()
  };

  /**
   * Validates if a transition is legal. Throws InvalidStateTransitionError if not.
   */
  public transition(currentState: SessionState, targetState: SessionState): SessionState {
    const allowed = SessionStateMachine.transitions[currentState];
    if (!allowed || !allowed.has(targetState)) {
      throw new InvalidStateTransitionError(currentState, targetState);
    }
    return targetState;
  }
}
