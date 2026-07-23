# RuleGroupEvaluator Implementation

The `RuleGroupEvaluator` is the recursive boolean logic engine for Grant Engine V2. It is responsible for orchestrating atomic rule evaluations across complex nested trees while strictly adhering to short-circuit and state-propagation rules.

## Design Principles

1. **Purely Recursive**: Evaluates infinitely deep `RuleGroupGraph` objects, restricted only by a configurable `MAX_DEPTH` (default 10) to prevent circular dependency stack overflows.
2. **Dependency Injection**: It depends entirely on `RuleEvaluator.evaluate()` for atomic evaluations. It never mutates the payload or talks to the database.
3. **Memoization First**: Relies heavily on the `EngineContext` cache. If a rule's result is already in the `cache.rules` map, it bypasses evaluation and reuses the state immediately, resolving the N+1 redundant evaluation problem.
4. **Execution Profiling**: Returns `executionTimeMs` to track latency of deep evaluations.

## Aggregation & Short-Circuit Logic

The evaluator enforces strict boolean short-circuiting to save compute cycles:

### AND Logic
- If any rule/group returns `FAIL`, the group immediately breaks the loop and returns `FAIL`.
- If all rules/groups return `PASS`, the group returns `PASS`.
- If there is a mix of `PASS` and `MISSING`, the group returns `MISSING` (bubbles up the request for info).
- `FAIL` always takes precedence over `MISSING`.

### OR Logic
- If any rule/group returns `PASS`, the group immediately breaks the loop and returns `PASS`.
- If all rules/groups return `FAIL`, the group returns `FAIL`.
- If there is a mix of `FAIL` and `MISSING`, the group returns `MISSING` (user might pass if they provide the missing info).

## Testing & Coverage

Exhaustive unit tests were created (`__tests__/RuleGroupEvaluator.test.ts`) covering:
- Correct aggregation for both `AND` and `OR` logic gates.
- Missing and Fail priority matrices.
- Correct short-circuiting behavior (verified via Jest spies that subsequent rules are NOT evaluated).
- Nested group evaluation and propagation.
- Memoization guarantees (verified via Jest spies that duplicated rules only trigger `RuleEvaluator` once).
- Circular reference depth limits throwing `EngineError`.
