"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceAnalytics = void 0;
class PerformanceAnalytics {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getLatencyMetrics(versionId) {
        const events = await this.repo.findEvents({ eventType: 'EVALUATION_PERFORMANCE', versionId });
        const times = events.map(e => e.payload.executionTimeMs || 0).sort((a, b) => a - b);
        if (times.length === 0)
            return null;
        const sum = times.reduce((a, b) => a + b, 0);
        const avg = sum / times.length;
        const p95 = times[Math.floor(times.length * 0.95)];
        const p99 = times[Math.floor(times.length * 0.99)];
        return {
            totalEvaluations: times.length,
            averageLatencyMs: avg,
            p95LatencyMs: p95,
            p99LatencyMs: p99,
            fastest: times[0],
            slowest: times[times.length - 1]
        };
    }
}
exports.PerformanceAnalytics = PerformanceAnalytics;
