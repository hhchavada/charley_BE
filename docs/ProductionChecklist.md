# Production Readiness Checklist

Before deploying Grant Engine V2 to production environments (AWS, GCP, Azure), the DevOps and Backend teams must ensure the following configurations are complete.

## 1. Environment & Secrets
- [ ] `NODE_ENV` is strictly set to `production`.
- [ ] MongoDB URI is using `mongodb+srv://` with TLS enabled.
- [ ] Redis URL is configured and secured with a password.
- [ ] Admin Super-User secrets (or JWT signing keys) are injected via secure vaults (e.g., AWS Secrets Manager), NOT `.env` files.

## 2. Observability & Logging
- [ ] Winston or Pino logger is injected into the application.
- [ ] `console.log` and `console.error` are completely disabled or piped to the structured logger.
- [ ] Datadog / OpenTelemetry adapter is attached to `EventCollector`.
- [ ] API Request/Response logging middleware (e.g., Morgan) is enabled for 4xx and 5xx errors.

## 3. Resilience & Self-Healing
- [ ] MongoDB driver is configured with `autoReconnect: true` and `serverSelectionTimeoutMS` tuned to 5000ms.
- [ ] Redis client handles `error` events and attempts graceful reconnection with exponential backoff.
- [ ] Graceful Shutdown is implemented: Node listens for `SIGINT` and `SIGTERM`, stops accepting new API requests, flushes pending `EventCollector` logs, closes MongoDB connections, and exits cleanly.

## 4. Health & Readiness Probes
- [ ] `GET /health` endpoint confirms Node is responsive.
- [ ] `GET /ready` endpoint confirms MongoDB and Redis connections are established.
- [ ] Kubernetes Liveness and Readiness probes point to the above endpoints.

## 5. Caching & Memory Limits
- [ ] Node.js memory limit is configured properly (e.g., `--max-old-space-size=2048`).
- [ ] `MemoryCacheProvider` has an LRU (Least Recently Used) eviction policy enabled to prevent Out Of Memory (OOM) crashes if dozens of config versions are generated rapidly.

## 6. Security
- [ ] Zod schema validation middleware is strictly enforcing HTTP body shapes.
- [ ] Rate limiting is applied, particularly to `/v2/assessment/start` and `/v2/admin/simulate`.
- [ ] CORS (Cross-Origin Resource Sharing) is restricted to the specific Frontend domain.
- [ ] Helmet middleware is enabled to set secure HTTP headers.
