# Grant Engine V2: Execution Contracts & Architecture

This document defines the frozen architectural contracts for the Grant Engine V2 execution layer. These interfaces and lifecycles must be strictly adhered to during implementation to ensure modularity and scalability.

---

## 1. Request Lifecycle Pipeline
The execution of a Grant Evaluation follows a strict 11-step pipeline. 

```mermaid
sequenceDiagram
    participant Client as Frontend / AI
    participant Engine as GrantEngine
    participant Validator as ValidationLayer
    participant Config as ConfigurationLoader
    participant Evaluator as RuleGroupEvaluator
    participant Missing as MissingDataResolver
    participant AI as AIHandoffService

    Client->>Engine: EvaluationRequest(payload)
    Engine->>Validator: sanitize(payload)
    Engine->>Config: loadActiveConfiguration(versionContext)
    Config-->>Engine: ConfigurationBundle (Graphs)
    
    loop For each Grant
        Engine->>Evaluator: evaluate(ruleGroup, payload, cache)
        Evaluator-->>Engine: GrantEvaluationResult
    end
    
    Engine->>Missing: resolve(MISSING results)
    Missing-->>Engine: MissingDataBundle
    
    alt If MissingDataBundle is not empty
        Engine->>AI: buildPrompt(MissingDataBundle)
        AI-->>Engine: AIContext
        Engine-->>Client: EvaluationResponse(WAITING_FOR_AI)
    else If All Data Present
        Engine->>Engine: Rank Grants
        Engine-->>Client: EvaluationResponse(COMPLETED)
    end
```

---

## 2. Assessment Session State Machine
The `AssessmentSession` tracks user progress. It transitions predictably and prevents duplicate or out-of-order evaluations.

```mermaid
stateDiagram-v2
    [*] --> NEW: Initialize Session
    NEW --> IN_PROGRESS: Submit Initial Form
    IN_PROGRESS --> WAITING_FOR_AI: Missing fields detected
    WAITING_FOR_AI --> RE_EVALUATING: AI submits extracted JSON
    RE_EVALUATING --> WAITING_FOR_USER: More forms required
    WAITING_FOR_USER --> RE_EVALUATING: User submits form
    RE_EVALUATING --> COMPLETED: All grants evaluated
    RE_EVALUATING --> WAITING_FOR_AI: Still missing fields
    COMPLETED --> ARCHIVED: Session closed
```

---

## 3. Evaluation Flow & Rule Aggregation
Evaluation operates on a strict boolean logic tree. The `RuleGroupEvaluator` recursively navigates `RuleGraph` and `RuleGroupGraph` nodes.

```mermaid
graph TD
    Root[Root RuleGroup: AND]
    Root --> Rule1[Rule: revenue < 1M]
    Root --> Nested[Nested RuleGroup: OR]
    Nested --> Rule2[Rule: employees > 50]
    Nested --> Rule3[Rule: is_tech_startup = true]
    
    Rule1 -- PASS --> Root
    Rule2 -- FAIL --> Nested
    Rule3 -- PASS --> Nested
    Nested -- PASS --> Root
    Root -- PASS --> Grant[Grant is ELIGIBLE]
```

### Aggregation Rules
- **AND Group**: 
  - If any child evaluates to `FAIL`, short-circuit and return `FAIL`.
  - If any child evaluates to `MISSING`, continue evaluating others, but the group ultimately returns `MISSING` (unless a `FAIL` is encountered later, which overrides `MISSING`).
  - If all children return `PASS`, return `PASS`.
- **OR Group**:
  - If any child evaluates to `PASS`, short-circuit and return `PASS`.
  - If all children evaluate to `FAIL`, return `FAIL`.
  - If no children `PASS` and at least one is `MISSING`, return `MISSING`.
- **Missing Propagation**: A `MISSING` state bubbles up to the Grant root, transitioning the grant state to `NEEDS_INFORMATION`.

---

## 4. Memoization Strategy
To prevent redundant evaluations across hundreds of grants sharing the same rules (e.g., "Is Company Registered in SG?"), the `GrantEngine` maintains a per-request `EngineContext` cache.

- **Rule Cache**: `Map<ruleId, EvaluationState>`. Before evaluating a `RuleGraph`, check this cache.
- **Group Cache**: `Map<groupId, EvaluationState>`. Caches whole `RuleGroupGraph` evaluations.
- **Cache Scope**: The cache is instantly destroyed at the end of the HTTP request. It does NOT persist across sessions.

---

## 5. Transaction Boundaries
To ensure database integrity during the Assessment Lifecycle:
1. **No Partial Saves**: An `AssessmentSession` document is only written to MongoDB after the *entire* Grant iteration loop completes. If the evaluator throws an unhandled error on Grant 99 of 100, the session state does not save.
2. **Immutability**: `EvaluationContext.payload` is frozen `Object.freeze()` immediately upon receiving the request to prevent side-effect mutations during rule execution.
3. **Version Locking**: Every request verifies `versionId`. If the admin publishes a new configuration while a user is in `WAITING_FOR_AI`, the user continues evaluating against the archived snapshot they started with.

---

## 6. Execution Interfaces
*See `src/engine/v2/interfaces/execution.ts` for the complete TypeScript contract definitions.*
