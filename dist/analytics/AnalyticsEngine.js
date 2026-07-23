"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsEngine = void 0;
class AnalyticsEngine {
    collector;
    dashboard;
    constructor(collector, dashboard) {
        this.collector = collector;
        this.dashboard = dashboard;
    }
    /**
     * Dispatches an event without blocking the main engine evaluation thread.
     */
    logEvent(event) {
        // Fire and forget
        this.collector.dispatch(event).catch(err => {
            console.error('Analytics dispatch failed statelessly', err);
        });
    }
    /**
     * Retrieves the aggregated dashboard for the frontend admin panel.
     */
    async getDashboard(versionId) {
        return this.dashboard.buildAdminDashboard(versionId);
    }
}
exports.AnalyticsEngine = AnalyticsEngine;
