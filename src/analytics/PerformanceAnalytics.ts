import { IEventRepository } from './Interfaces/IEventRepository';

export class PerformanceAnalytics {
  constructor(private readonly repo: IEventRepository) {}

  public async getLatencyMetrics(versionId: string) {
    const events = await this.repo.findEvents({ eventType: 'EVALUATION_PERFORMANCE', versionId });
    
    const times = events.map(e => e.payload.executionTimeMs || 0).sort((a, b) => a - b);
    
    if (times.length === 0) return null;

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
