"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRecovery = void 0;
const interfaces_1 = require("./interfaces");
class SessionRecovery {
    stateMachine;
    timeline;
    constructor(stateMachine, timeline) {
        this.stateMachine = stateMachine;
        this.timeline = timeline;
    }
    /**
     * Recovers a session that might have crashed during evaluation.
     * If a session has been in EVALUATING for > 5 minutes, we roll it back.
     */
    recoverIfNeeded(session) {
        if (session.state === interfaces_1.SessionState.EVALUATING || session.state === interfaces_1.SessionState.AI_REQUIRED) {
            const now = new Date().getTime();
            const lastUpdate = session.updatedAt.getTime();
            const minutesSinceUpdate = (now - lastUpdate) / 60000;
            if (minutesSinceUpdate > 5) {
                // Rollback to WAITING_FOR_USER so they can re-trigger evaluation
                session.state = this.stateMachine.transition(session.state, interfaces_1.SessionState.WAITING_FOR_USER);
                this.timeline.addEvent(session, 'STATE_CHANGED', { reason: 'System Recovery from stale evaluation state' });
            }
        }
        return session;
    }
}
exports.SessionRecovery = SessionRecovery;
