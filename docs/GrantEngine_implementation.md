# GrantEngine Implementation

The `GrantEngine` is the centralized, public-facing orchestrator for the Grant Engine V2 matching pipeline. It manages the entire lifecycle of an evaluation request, acting as a facade for the complex inner workings of the engine.

## Architecture Overview

1. **Configuration-Driven**: The engine contains zero business logic. It does not know what a "grant" is, nor what the rules are. It strictly coordinates dependencies and data flow.
2. **Strict Dependency Injection**: To ensure maximum testability and modularity, the engine receives all 7 of its dependencies (Loader, Validation, Ranking, AI resolvers, etc.) via its constructor. There are no singletons or static coupling.
3. **Immutability First**: The incoming `context.payload` is structurally frozen (`Object.freeze`). Evaluators downstream cannot mutate the state of the user's application, preventing race conditions during parallel processing.

## Execution Lifecycle

The evaluation follows a rigid, synchronous pipeline up to the Grant evaluation phase, which executes in parallel:

1. **Setup**: Freeze payload → Resolve active configuration version → Load full configuration graph → Validate payload.
2. **Parallel Evaluation**: A shared memoization cache is created. All active grants from the configuration are evaluated simultaneously using `Promise.all()`.
3. **Post-Processing**: Grant evaluation results are categorized. If any grants resulted in `POTENTIALLY_ELIGIBLE`, the engine scans the deeply nested boolean trees to extract every `MISSING` rule ID.
4. **AI & Ranking Handoff**: Missing rules are passed to the `MissingDataResolver`. All grants are passed to the `RankingEngine`. Finally, the `ResultBuilder` maps everything to a unified client response.

## Error Handling & Resiliency

A fundamental requirement of the engine is that one malformed grant configuration must never crash the entire user session.
If the `GrantEvaluator` throws an unexpected exception during execution, the engine catches it, safely constructs a `GrantState.ERROR` node with the stack trace, and proceeds with the rest of the grants. This ensures users always get partial results.

## Performance Notes

- The `ConfigurationLoader` is invoked exactly once per request.
- Grants are evaluated asynchronously and concurrently.
- The memoization cache is shared across *all* grants in the cycle, ensuring that if 50 grants all check "Annual Revenue > 1M", the engine only parses and evaluates that rule once.

## Metrics

The engine produces an `EngineMetrics` struct containing:
- `executionTimeMs`
- Aggregate grant counts (`totalGrants`, `eligibleCount`, `potentialCount`, `rejectedCount`, `errorCount`)
- Missing question counts
- The exact configuration version string used for the evaluation.

## Future Extension Points (Interfaces Prepared)

The following interfaces have been declared and injected, ready to be implemented in future phases:
- `IMissingDataResolver` (for AI / Gemini integration)
- `IRankingEngine` (for complex scoring and sorting)
- `IResultBuilder` (for final client formatting)
- `IVersionResolver` (for locking sessions to historical snapshots)
