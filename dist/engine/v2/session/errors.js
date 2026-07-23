"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionValidationError = exports.OptimisticLockError = exports.InvalidStateTransitionError = exports.EngineError = void 0;
class EngineError extends Error {
    message;
    code;
    isRecoverable;
    details;
    constructor(message, code, isRecoverable = false, details) {
        super(message);
        this.message = message;
        this.code = code;
        this.isRecoverable = isRecoverable;
        this.details = details;
        this.name = 'EngineError';
    }
}
exports.EngineError = EngineError;
class InvalidStateTransitionError extends EngineError {
    constructor(fromState, toState) {
        super(`Cannot transition session from ${fromState} to ${toState}.`, 'INVALID_STATE_TRANSITION', false);
        this.name = 'InvalidStateTransitionError';
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
class OptimisticLockError extends EngineError {
    constructor(sessionId) {
        super(`Session ${sessionId} was updated by another process. Please reload.`, 'OPTIMISTIC_LOCK_FAILED', true);
        this.name = 'OptimisticLockError';
    }
}
exports.OptimisticLockError = OptimisticLockError;
class SessionValidationError extends EngineError {
    constructor(message, details) {
        super(message, 'SESSION_VALIDATION_FAILED', false, details);
        this.name = 'SessionValidationError';
    }
}
exports.SessionValidationError = SessionValidationError;
