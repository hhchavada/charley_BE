# Explainability Engine & Simulation Architecture (Phase 13)

This layer sits completely on top of `GrantEngine`, `RankingEngine`, and `ResultBuilder`. It does not modify their logic, but instead inspects their highly complex, nested outputs to generate human-readable explanations.

## The Problem
A user submits a form and is told they are "Not Eligible" for the EDG grant. Why? 
If the engine just returns `NOT_ELIGIBLE`, the system is a black box. If support staff try to debug it, they have to read the raw database configuration to figure out what went wrong.

## The Solution: The Explainer Modules

### `RuleExplanationBuilder`
Translates internal rules into plain English sentences.
- **Internal**: `{ operator: 'GREATER_THAN', expected: 1000, actual: 500, state: 'FAIL' }`
- **Output**: `"Your revenue is 500, but it needs to be more than 1000."`

### `GrantExplanationBuilder`
Aggregates all the Rule Explanations into a single, comprehensive summary for the Grant.
It groups them into `passedRules`, `failedRules`, and `missingRules`, and generates a high-level reasoning string:
- `"You do not qualify for the EDG Grant because you failed 2 requirements."`

### `DecisionTraceBuilder`
Transforms the engine's internal execution graph into a clean, hierarchical `DecisionTraceNode` tree. This is designed to be easily rendered in the UI as an expandable/collapsible debug tree for administrators.

## The What-If Simulator (`SimulationEngine`)
The Simulation Engine allows administrators to run test payloads against specific configuration versions without writing any data to the database or affecting live analytics.
It wraps the normal execution pipeline in a mock `EvaluationContext`, runs it, and attaches the Explanations.

## Scenario Comparisons
By running the `SimulationEngine` twice (Scenario A vs Scenario B), the `ScenarioComparator` calculates the exact delta:
- "If we lower the revenue requirement from 5M to 1M, we will unlock 43 newly qualified grants and inject an additional $5.2M in funding into the ecosystem."
