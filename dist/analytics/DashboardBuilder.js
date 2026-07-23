"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardBuilder = void 0;
class DashboardBuilder {
    funnel;
    performance;
    constructor(funnel, performance) {
        this.funnel = funnel;
        this.performance = performance;
    }
    async buildAdminDashboard(versionId) {
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
exports.DashboardBuilder = DashboardBuilder;
