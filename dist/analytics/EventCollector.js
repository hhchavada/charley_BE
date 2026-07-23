"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCollector = void 0;
class EventCollector {
    repo;
    providers;
    constructor(repo, providers = []) {
        this.repo = repo;
        this.providers = providers;
    }
    /**
     * Asynchronously collects events from the engine.
     * This method must never block the main execution thread.
     */
    async dispatch(event) {
        const fullEvent = {
            ...event,
            eventId: 'evt_' + Date.now() + Math.random().toString(36).substring(7),
            timestamp: new Date()
        };
        // 1. Save to historical repository (MongoDB/ClickHouse)
        await this.repo.save(fullEvent).catch(err => {
            console.error('Failed to save analytics event', err);
        });
        // 2. Broadcast to real-time telemetry providers (Datadog, Prometheus)
        for (const provider of this.providers) {
            provider.sendMetric(`grant_engine.${event.eventType.toLowerCase()}`, 1, { versionId: event.versionId })
                .catch(err => console.error(`Provider error`, err));
        }
    }
}
exports.EventCollector = EventCollector;
