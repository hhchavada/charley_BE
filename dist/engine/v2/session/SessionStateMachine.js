"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStateMachine = void 0;
const interfaces_1 = require("./interfaces");
const errors_1 = require("./errors");
class SessionStateMachine {
    // Define allowed transitions from each state
    static transitions = {
        [interfaces_1.SessionState.NEW]: new Set([interfaces_1.SessionState.IN_PROGRESS]),
        [interfaces_1.SessionState.IN_PROGRESS]: new Set([interfaces_1.SessionState.PARTIALLY_COMPLETED, interfaces_1.SessionState.WAITING_FOR_USER, interfaces_1.SessionState.READY_FOR_EVALUATION]),
        [interfaces_1.SessionState.PARTIALLY_COMPLETED]: new Set([interfaces_1.SessionState.IN_PROGRESS, interfaces_1.SessionState.WAITING_FOR_USER, interfaces_1.SessionState.READY_FOR_EVALUATION]),
        [interfaces_1.SessionState.WAITING_FOR_USER]: new Set([interfaces_1.SessionState.IN_PROGRESS, interfaces_1.SessionState.READY_FOR_EVALUATION]),
        [interfaces_1.SessionState.READY_FOR_EVALUATION]: new Set([interfaces_1.SessionState.EVALUATING]),
        [interfaces_1.SessionState.EVALUATING]: new Set([interfaces_1.SessionState.AI_REQUIRED, interfaces_1.SessionState.COMPLETED, interfaces_1.SessionState.WAITING_FOR_USER]),
        [interfaces_1.SessionState.AI_REQUIRED]: new Set([interfaces_1.SessionState.WAITING_FOR_USER, interfaces_1.SessionState.IN_PROGRESS, interfaces_1.SessionState.READY_FOR_EVALUATION]),
        [interfaces_1.SessionState.COMPLETED]: new Set([interfaces_1.SessionState.ARCHIVED]),
        [interfaces_1.SessionState.ARCHIVED]: new Set()
    };
    /**
     * Validates if a transition is legal. Throws InvalidStateTransitionError if not.
     */
    transition(currentState, targetState) {
        const allowed = SessionStateMachine.transitions[currentState];
        if (!allowed || !allowed.has(targetState)) {
            throw new errors_1.InvalidStateTransitionError(currentState, targetState);
        }
        return targetState;
    }
}
exports.SessionStateMachine = SessionStateMachine;
