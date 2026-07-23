import { EventCollector } from './EventCollector';
import { DashboardBuilder } from './DashboardBuilder';
import { AnalyticsEvent } from './Interfaces/IEventRepository';

export class AnalyticsEngine {
  constructor(
    private readonly collector: EventCollector,
    private readonly dashboard: DashboardBuilder
  ) {}

  /**
   * Dispatches an event without blocking the main engine evaluation thread.
   */
  public logEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): void {
    // Fire and forget
    this.collector.dispatch(event).catch(err => {
      console.error('Analytics dispatch failed statelessly', err);
    });
  }

  /**
   * Retrieves the aggregated dashboard for the frontend admin panel.
   */
  public async getDashboard(versionId: string): Promise<any> {
    return this.dashboard.buildAdminDashboard(versionId);
  }
}
