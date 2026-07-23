# Assessment Session Engine

The Assessment Session Engine acts as the definitive Single Source of Truth for a user's entire grant matching journey. It sits exactly between the Frontend UI, the AI Orchestration layer, and the core Grant Evaluators.

## Architecture & Responsibilities

The engine relies on 9 decoupled, stateless modules interacting via Dependency Injection:
1. **`SessionManager`**: The orchestration facade. Exposes public API methods (`loadSession`, `saveAnswers`, `evaluate`, `resume`).
2. **`SessionStateMachine`**: A strict Finite State Machine that prevents illegal jumps (e.g., jumping from `NEW` to `COMPLETED`).
3. **`SessionSaver`**: Wraps the repository layer and enforces **Optimistic Locking**.
4. **`SessionLoader`**: Fetches the session and ensures the configuration versions match.
5. **`SessionMerger`**: Deep merges nested JSON payloads and carefully overwrites array inputs.
6. **`SessionProgress`**: Calculates runtime metrics like completion percentage.
7. **`SessionRecovery`**: A self-healing module that rolls back sessions stuck in processing states.
8. **`SessionTimeline`**: Appends chronological system events for audibility.
9. **`SessionValidator`**: Checks the physical integrity of the session object.

## Concurrency Strategy (Optimistic Locking)

Because users can resume sessions from multiple devices, and because the AI layer might try to patch answers while the user is typing, we must prevent race conditions.

When `SessionSaver` attempts to save to the database, it performs a conditional update:
```sql
UPDATE sessions SET payload = ?, updatedAt = NOW() WHERE sessionId = ? AND updatedAt = <memoryUpdatedAt>
```
If the database `updatedAt` has changed since we loaded the session into memory, the transaction fails and the engine throws an `OptimisticLockError`. The client must then fetch the latest state and retry the merge.

## State Transitions

> [!IMPORTANT]
> The engine strictly enforces the following linear flow:

- `NEW` -> `IN_PROGRESS`
- `IN_PROGRESS` <-> `PARTIALLY_COMPLETED` (User answering questions)
- `PARTIALLY_COMPLETED` -> `READY_FOR_EVALUATION` (Form submission)
- `READY_FOR_EVALUATION` -> `EVALUATING` (Engine locks session)
- `EVALUATING` -> `AI_REQUIRED` (Missing rules detected)
- `AI_REQUIRED` -> `WAITING_FOR_USER` (AI stops, waits for human input)
- `WAITING_FOR_USER` -> `READY_FOR_EVALUATION`
- `EVALUATING` -> `COMPLETED` (No missing data, all grants scored)
- `COMPLETED` -> `ARCHIVED`

## Recovery Flow

If the Node server crashes while a session is in `EVALUATING`, the session would historically be "stuck". 
The `SessionRecovery` module intercepts every `loadSession()` request. If it detects a session stuck in `EVALUATING` for more than 5 minutes, it automatically rolls the state back to `WAITING_FOR_USER` and appends a `STATE_CHANGED` recovery event to the timeline, allowing the user to seamlessly click "Evaluate" again.
