"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTimeline = void 0;
class SessionTimeline {
    /**
     * Appends a new chronological event to the session's timeline.
     */
    addEvent(session, type, metadata) {
        const event = {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type,
            timestamp: new Date(),
            metadata
        };
        session.timeline.push(event);
    }
    /**
     * Reconstructs the duration of the evaluation phase.
     */
    getEvaluationDurationMs(session) {
        const events = session.timeline;
        let start = null;
        let end = null;
        for (let i = events.length - 1; i >= 0; i--) {
            if (events[i].type === 'EVALUATION_FINISHED' && !end)
                end = events[i].timestamp;
            if (events[i].type === 'EVALUATION_STARTED' && !start)
                start = events[i].timestamp;
            if (start && end)
                break;
        }
        if (start && end) {
            return end.getTime() - start.getTime();
        }
        return 0;
    }
}
exports.SessionTimeline = SessionTimeline;
