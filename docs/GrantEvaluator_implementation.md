# GrantEvaluator Implementation

The `GrantEvaluator` operates at the highest level of a single grant's assessment lifecycle. It acts as the bridge between the boolean `RuleGroupEvaluator` tree and the final business representations of eligibility.

## Design Principles

1. **Pure Mapping Function**: It does not interact with the database, session states, APIs, or cache logic beyond passing it down. It is purely designed to translate a boolean tree state into structured metrics.
2. **Mandatory Missing Data Rules**: The evaluator hardcodes a crucial business rule: **Missing data never rejects a Grant**. If the underlying group evaluator returns `MISSING`, the Grant is automatically flagged as `POTENTIALLY_ELIGIBLE`, preventing premature rejections.
3. **Stateless Metrics Collector**: Uses a custom recursive traversal `collectMetrics` to crawl the deep output tree of `RuleGroupEvaluationResult` to extract flattened counts without side effects.

## State Mapping Flow

The translation from the boolean `EvaluationState` returned by the `RuleGroupEvaluator` to the `GrantState` is strictly defined:
- `PASS` → `ELIGIBLE`
- `FAIL` → `NOT_ELIGIBLE`
- `MISSING` → `POTENTIALLY_ELIGIBLE`
- `ERROR` → `ERROR`

## Computed Metrics

The evaluator enriches the response with real-time computational metrics:
- **Rule Coverage**: `(matchedCount + failedCount) / totalRules * 100` (identifies how much of the tree we had data for).
- **Completion Percentage**: `1 - (missingCount / totalRules) * 100` (identifies how far along the user is in qualifying).
- **Execution Time**: The latency of executing the entire tree.

## Explainability Generation

Because we require the engine to be transparent and ready for an AI Consultant, the `GrantEvaluator` constructs human-readable explanations based on the extracted metrics:
- **`reasonSummary`**: High-level conversational explanation of the state.
- **`failureSummary`**: Specific metric-driven explanation of why they failed.
- **`missingSummary`**: Specific summary of how many data points are pending.

## Testing & Coverage

Exhaustive unit tests were created (`__tests__/GrantEvaluator.test.ts`) covering:
- State translation matrix (PASS -> ELIGIBLE, etc.).
- The recursive traversal collector functioning correctly on deep nested trees.
- Decimal precision checking on completion percentage.
- The generation logic behind human-readable summaries.
