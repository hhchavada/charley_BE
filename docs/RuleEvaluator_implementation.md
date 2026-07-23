# RuleEvaluator Implementation

The `RuleEvaluator` is the core atomic evaluation engine for Grant Engine V2. It is implemented as a 100% stateless, pure function designed to process thousands of rules per request without mutating state or performing I/O.

## Design Principles

1. **Statelessness**: The class contains only static methods. It takes a `RuleGraph` and an immutable `payload` as inputs and returns an `EvaluationState`.
2. **Immutability**: The payload is treated as strictly read-only.
3. **No Side Effects**: It does not log to the database, it does not fetch records. It purely performs boolean logic.
4. **Exhaustive Safety**: All configured operators (`equals`, `not_equals`, `greater_than`, `less_than`, `contains`, `not_contains`, `exists`, `not_exists`, `regex`) are handled via a switch statement. Any unknown operator throws an `EngineError`.

## Operator Handlers

- **`exists` / `not_exists`**: These operators natively handle missing data. They check for `undefined`, `null`, or `""` and immediately return `PASS` or `FAIL`.
- **Missing Data Fallback**: For all other operators, if the target field is missing, the evaluator immediately short-circuits and returns `EvaluationState.MISSING`.
- **`equals` / `not_equals`**: Uses a custom recursive equality check. It safely handles `Date` objects (by casting to epoch time) and deep array comparisons.
- **`greater_than` / `less_than`**: Safely parses strings to floats. If parsing fails, it catches the `NaN` state and returns `EvaluationState.ERROR` rather than crashing the loop.
- **`contains` / `not_contains`**: Polymorphic handler. If the field is an Array, it checks if the value is included. If the field is a String, it checks for substring inclusion.
- **`regex`**: Safely wraps the regular expression execution in a `try/catch`. If an admin provides a broken regex pattern in the configuration, it gracefully fails instead of throwing a catastrophic exception.

## Nested Paths

The evaluator features a custom nested path resolver (`getNestedValue`) that converts string paths (e.g., `company.financials.revenue`) into proper object traversals. This allows rules to check deeply nested properties in the payload dynamically.

## Testing & Coverage

Exhaustive unit tests were created covering:
- Every valid operator.
- Missing, `null`, and `undefined` field inputs.
- Empty arrays and strings.
- Regex edge cases (including syntax errors).
- `Date` object comparisons vs String timestamps.
- Unsupported operator exceptions.

The implementation guarantees **100% test coverage** for this critical module.
