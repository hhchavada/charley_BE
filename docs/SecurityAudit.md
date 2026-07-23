# Security & Data Integrity Audit: Grant Engine V2

## Overview
This audit evaluates how the engine protects internal data structures from external tampering, mass assignment, and data races.

## Security Score: 90/100

### Strengths
1. **Optimistic Locking**: The `SessionManager` perfectly defends against concurrent overwrites (data races). If a user rapidly taps "Submit" twice, the second request fails with `409 Conflict`, preventing state corruption.
2. **Immutable Configurations**: By freezing published configurations into snapshots (`SystemVersion`), the system is immune to "live logic modification." No admin can accidentally change the rules while users are mid-assessment.
3. **Anti-Corruption Layer (ACL)**: `ResultBuilder` rigorously cleans the engine output. Internal MongoDB `ObjectIds` or raw evaluation trace payloads are stripped before hitting the HTTP response, preventing internal structure leakage.

### Security Issues Identified

> [!CAUTION]
> **Issue 1: Missing DTO Schema Validation Middleware**
> - **Severity**: HIGH
> - **Reason**: While `StartAssessmentRequest` and `AnswerRequest` are defined as TypeScript interfaces, there is no runtime validation (e.g., Zod or Joi middleware) attached to the Express controller routes.
> - **Impact**: A malicious user could submit a payload with a 50MB string or injected MongoDB operators (`$where`), potentially triggering ReDoS (Regex Denial of Service) or NoSQL Injection if the underlying models aren't properly sanitized.
> - **Suggested Solution**: Implement Zod schema validation middleware in `AssessmentController` for all incoming `req.body`.
> - **Estimated Effort**: 4 hours.

> [!WARNING]
> **Issue 2: Admin Endpoint Authorization**
> - **Severity**: HIGH
> - **Reason**: The routes under `/admin/publish`, `/admin/rollback`, and `/admin/impact` currently lack RBAC (Role-Based Access Control) middleware.
> - **Impact**: Any authenticated user could potentially trigger a rollback or publish a draft.
> - **Suggested Solution**: Attach a `requireRole('SUPER_ADMIN')` middleware to the router.
> - **Estimated Effort**: 1 hour.

> [!NOTE]
> **Issue 3: Rate Limiting Omissions**
> - **Severity**: LOW
> - **Reason**: The `simulate` endpoints are computationally intensive. They lack rate limiting.
> - **Impact**: API abuse could cause CPU spikes.
> - **Suggested Solution**: Attach `express-rate-limit` to `/simulate` routes.
> - **Estimated Effort**: 1 hour.
