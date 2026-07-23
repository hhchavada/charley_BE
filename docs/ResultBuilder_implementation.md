# ResultBuilder Implementation

The `ResultBuilder` acts as the definitive Anti-Corruption Layer (ACL) and Presentation Layer between the internal complexities of the Grant Engine V2 and external clients (Frontend, AI, API consumers). It ensures that the frontend receives exactly what it needs to render, completely decoupled from how evaluation actually works.

## Architecture & DTO Design

1. **Information Hiding (Encapsulation)**: Internally, the engine deals with `GrantGraph`, `RuleGraph`, `RuleGroupEvaluationResult`, boolean trees, MongoDB ObjectIds, and nested arrays. The `ResultBuilder` strips all of this away. The returned `AssessmentResultDTO` contains zero internal logic representations. 
2. **Flattened Presentation**: The `RecommendationDTO` flattens the complex grant result into simple, strings and numbers directly readable by UI components (e.g., `headline`, `processingTime`, `badges`).
3. **Stateless Transformation**: The module performs synchronous, O(N) mapping operations on the provided data without querying the DB or mutating the input variables.

## Security Model

The builder aggressively strips sensitive and internal data:
- `ruleResults` and `nestedGroupResults` are deleted to prevent exposing proprietary evaluation logic boundaries.
- `affectedRuleIds` from `MissingDataBundle` are stripped before being returned as `PresentationQuestionDTO`.
- System diagnostics are hidden by default.

### Debug Mode
If the incoming `context.payload._debugMode` is `true`, the builder opens up the `diagnostics` and `errors` payloads. This exposes `performanceMetrics`, `brokenReferences`, and configuration warnings strictly to admins or automated tests.

## Frontend Integration

The `AssessmentResultDTO` is purposefully designed to require **zero transformation** on the client side:
- `recommendations.readyNow`: Frontend can loop through this array and directly map properties to the UI Grant Card component.
- `questions`: Directly maps to the dynamic form rendering component, grouped logically by `section`.
- `funding`: Provides pre-calculated headline numbers (`EstimatedFunding`, `FundingRange`) for dashboards.

## Future AI & Conversation Flow

The returned payload includes an `aiSupport` object. This is designed to act as the initialization payload for a Gemini or RAG sub-agent:
- `nextBestQuestion`: Guides the AI on exactly what to ask the user next.
- `AIContextBundle`: Provides the AI with the semantic rules required to understand why the question is being asked.
- It prepares the context entirely server-side, preventing the need for the AI to query the engine itself.

## Performance Analysis

Since the builder does not perform evaluation, recursion, or DB lookups, building the final DTO takes less than `1ms` even for datasets comprising hundreds of grants. The mapping relies on shallow object spreads and native `Array.map` operations.
