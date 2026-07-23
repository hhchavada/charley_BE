# Engine Architecture

This document describes the core architecture of the Grant Matching Platform backend engines. 
The system is strictly separated by responsibility to ensure maintainability, scalability, and stability.

## Folder Structure

```
backend/src/
├── engine/
│   ├── RuleEngine.ts          # Evaluates individual logical rules
│   ├── QuestionEngine.ts      # Determines visibility of dynamic questions
│   ├── ValidationEngine.ts    # Validates payloads before matching
│   ├── ResultBuilder.ts       # Groups, sorts, and structures final responses
│   └── GrantMatchingEngine.ts # Core orchestrator
```

## Data Flow

1. **Client Request**: Frontend submits a JSON payload to `POST /api/match`.
2. **Validation (`ValidationEngine`)**: The controller runs the payload against the active `QuestionSchema` using the `ValidationEngine`. If fields are missing or types are invalid, a `400 Bad Request` is returned immediately.
3. **Orchestration (`GrantMatchingEngine`)**: If valid, the payload is passed to the orchestrator.
4. **Evaluation (`RuleEngine`)**: The orchestrator iterates over all active grants and passes their conditions to the `RuleEngine`. 
   - *Performance Optimization*: Field lookups (e.g. `companyData.annualRevenue`) are memoized per-request to ensure $O(1)$ fast lookups across 200+ grants.
5. **Formatting (`ResultBuilder`)**: The orchestrator collects the raw evaluations and passes them to the `ResultBuilder`, which buckets the results into `eligible`, `needMoreInfo`, and `notEligible`, sorts them by priority, and prepares them for the client.

## Engine Descriptions

### 1. Rule Engine
A purely deterministic module that takes an `operator` (e.g., `>`, `contains`, `==`), an `expectedValue`, and an `actualValue`, and returns a boolean. It knows nothing about Grants or Questions.

### 2. Question Engine
Uses the `RuleEngine` to evaluate `conditionLogic` (AND/OR). It handles deep recursive nesting for follow-up questions to determine exactly which fields the user was *supposed* to see.

### 3. Validation Engine
Crucial for preventing bad data from corrupting matches. It skips validation for hidden questions, but strictly enforces types (number/string) and required constraints for visible ones.

### 4. Grant Matching Engine
The orchestrator. It manages the field caching layer to ensure fast execution and dictates the overall sequence of evaluation.

### 5. Result Builder
Responsible for all DTOs and formatting before the data hits the controller.

## How to Extend the Platform

### Adding Consultant Rules Later
Consultant rules (e.g., logic that requires human override or external API checks) should NOT be added to the `RuleEngine`. Instead:
1. Create a `ConsultantEngine.ts`.
2. Update the `GrantMatchingEngine` orchestrator to pass the `MatchResult[]` through the `ConsultantEngine` before returning it to the `ResultBuilder`. The `ConsultantEngine` can mutate the `priority` or `qualificationStatus` based on external logic.

### Adding Future Grants
Do not write code for new grants. Simply add a new JSON object to `backend/src/data/grants.json` with the required `conditions`. The `GrantMatchingEngine` will automatically process it.
