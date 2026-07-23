import { FunnelAnalytics } from './FunnelAnalytics';
import { PerformanceAnalytics } from './PerformanceAnalytics';

export class DashboardBuilder {
  constructor(
    private readonly funnel: FunnelAnalytics,
    private readonly performance: PerformanceAnalytics
  ) {}

  public async buildAdminDashboard(versionId: string): Promise<any> {
    const [funnelMetrics, performanceMetrics] = await Promise.all([
      this.funnel.getFunnelMetrics(versionId),
      this.performance.getLatencyMetrics(versionId)
    ]);

    return {
      overview: {
        versionId,
        reportGeneratedAt: new Date(),
        activeUsers: funnelMetrics.sessionStarted
      },
      funnel: funnelMetrics,
      performance: performanceMetrics || 'No data',
      charts: {
        dropOffRate: funnelMetrics.dropRate,
        latencyTrend: [performanceMetrics?.averageLatencyMs || 0]
      }
    };
  }
}
