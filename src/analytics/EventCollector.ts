import { AnalyticsEvent, IEventRepository, IMetricsProvider } from './Interfaces/IEventRepository';

export class EventCollector {
  constructor(
    private readonly repo: IEventRepository,
    private readonly providers: IMetricsProvider[] = []
  ) {}

  /**
   * Asynchronously collects events from the engine.
   * This method must never block the main execution thread.
   */
  public async dispatch(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
    const fullEvent: AnalyticsEvent = {
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
