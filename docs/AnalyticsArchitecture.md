# Analytics & Observability Architecture (Phase 14)

The Enterprise Analytics layer provides total visibility into Grant Engine V2 without altering any of its core execution logic. 

## The Event-Driven Ingestion Model
To ensure that `GrantEngine` and `AssessmentService` remain pure and highly performant, all analytics are collected asynchronously. 
The core Engine simply dispatches `AnalyticsEvent` payloads to the `EventCollector` (Fire-and-Forget). 
If the analytics database goes down, the evaluation engine **will not fail**, it will simply drop the event and continue, guaranteeing high availability for end users.

## Provider Agnosticism
While this layer aggregates historical metrics (Funnels, Drop-offs, Heatmaps) locally via `IEventRepository`, it is also built to stream real-time metrics to enterprise observability platforms. 
Interfaces like `IMetricsProvider` are prepared, meaning you can plug in **Datadog**, **Prometheus**, or **OpenTelemetry** with a single adapter class in the future.

## Key Analytic Aggregations
1. **Funnel Analytics**: Tracks the exact conversion rate from `SESSION_STARTED` -> `EVALUATION_FINISHED` -> `AI_STARTED` -> `ASSESSMENT_COMPLETED`. Helps identify where users drop off.
2. **Performance Analytics**: Tracks the raw execution time of the `GrantEngine`. Because evaluation must be instant, this tracks `P95` and `P99` latencies to guarantee SLAs (e.g., ensuring 99% of evaluations finish in `< 50ms`).
3. **Grant/Rule Analytics**: Helps administrators understand which rules are too strict (causing high failure rates) and which grants are most frequently recommended.

## Dashboard & Exports
The `DashboardBuilder` consumes these aggregated metrics and formats them into a clean JSON DTO (`AdminDashboardDTO`), which the Frontend Admin Panel consumes to render charts.
The `/analytics/export` endpoint allows business users to download these metrics natively in CSV/Excel formats.
