export interface AnalyticsEvent {
  eventId: string;
  timestamp: Date;
  eventType: 'SESSION_STARTED' | 'QUESTION_ANSWERED' | 'EVALUATION_FINISHED' | 'AI_STARTED' | 'ASSESSMENT_COMPLETED' | 'ASSESSMENT_DROPPED' | 'CONFIGURATION_PUBLISHED' | 'EVALUATION_PERFORMANCE';
  sessionId?: string;
  versionId: string;
  payload: any;
}

export interface IEventRepository {
  save(event: AnalyticsEvent): Promise<void>;
  findEvents(filters: { eventType?: string, versionId?: string, startDate?: Date, endDate?: Date }): Promise<AnalyticsEvent[]>;
}

export interface IMetricsProvider {
  sendMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
}

// Future implementations for OpenTelemetry, Datadog, Grafana, etc.
export interface IDatadogProvider extends IMetricsProvider {}
export interface IPrometheusProvider extends IMetricsProvider {}
export interface IOpenTelemetryProvider extends IMetricsProvider {}
