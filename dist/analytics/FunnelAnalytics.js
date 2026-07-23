"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunnelAnalytics = void 0;
class FunnelAnalytics {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getFunnelMetrics(versionId) {
        const events = await this.repo.findEvents({ versionId });
        let started = 0, evaluated = 0, aiStarted = 0, completed = 0, dropped = 0;
        events.forEach(e => {
            switch (e.eventType) {
                case 'SESSION_STARTED':
                    started++;
                    break;
                case 'EVALUATION_FINISHED':
                    evaluated++;
                    break;
                case 'AI_STARTED':
                    aiStarted++;
                    break;
                case 'ASSESSMENT_COMPLETED':
                    completed++;
                    break;
                case 'ASSESSMENT_DROPPED':
                    dropped++;
                    break;
            }
        });
        return {
            sessionStarted: started,
            evaluationReached: evaluated,
            aiEngaged: aiStarted,
            completed,
            dropped,
            completionRate: started ? (completed / started) * 100 : 0,
            dropRate: started ? (dropped / started) * 100 : 0
        };
    }
}
exports.FunnelAnalytics = FunnelAnalytics;
