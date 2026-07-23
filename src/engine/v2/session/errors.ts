export class EngineError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly isRecoverable: boolean = false,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

export class InvalidStateTransitionError extends EngineError {
  constructor(fromState: string, toState: string) {
    super(`Cannot transition session from ${fromState} to ${toState}.`, 'INVALID_STATE_TRANSITION', false);
    this.name = 'InvalidStateTransitionError';
  }
}

export class OptimisticLockError extends EngineError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} was updated by another process. Please reload.`, 'OPTIMISTIC_LOCK_FAILED', true);
    this.name = 'OptimisticLockError';
  }
}

export class SessionValidationError extends EngineError {
  constructor(message: string, details?: any) {
    super(message, 'SESSION_VALIDATION_FAILED', false, details);
    this.name = 'SessionValidationError';
  }
}
