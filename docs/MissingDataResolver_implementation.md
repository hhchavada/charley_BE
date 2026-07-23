# MissingDataResolver Implementation

The `MissingDataResolver` is the critical bridge between raw grant evaluations and the intelligent conversational UI (Frontend Forms, Gemini AI, WhatsApp). It translates thousands of disjointed "MISSING" boolean states into an optimized, prioritized, and deduplicated `MissingDataBundle`.

## Architecture Overview

1. **Stateless Transformation**: The resolver acts as a pure function. It accepts the `GrantEvaluationResult` list alongside the frozen `ConfigurationBundle` and returns a DTO. It does not write to the database or rely on global state.
2. **O(N) Complexity Constraint**: Instead of nesting loops (e.g., checking every grant against every rule against every question), the resolver executes a strict 2-pass indexing strategy. 
   - *Pass 1*: Indexes the `ConfigurationBundle` into Maps.
   - *Pass 2*: Scans the evaluation result tree, registering hits in `Set()` lookup tables to natively prevent duplicates.

## Lifecycle

1. **Indexing**: It scans the incoming `configBundle` to create a strict relationship map between `RuleId` -> `QuestionGraph`.
2. **Missing Extraction**: It crawls the deep boolean tree of every evaluated grant that resulted in `POTENTIALLY_ELIGIBLE`.
3. **Deduplication**: When rule `R1` (for Grant A) and rule `R5` (for Grant B) both require the question "Annual Revenue", the resolver merges them into a single `MissingQuestionDTO`. It tracks that answering this *one* question will unlock multiple grants and rules simultaneously.
4. **Sorting**: Questions are sorted strictly by `priority` first. If priority is identical, it sorts by `affectedGrantCount` descending (ensuring the user is asked the most impactful questions first).
5. **Grouping**: Questions are clustered by `semanticCategory` (e.g., "Company Financials") to allow frontend apps to render logical form pages immediately.
6. **Diagnostics**: Missing data relationships are validated. If an evaluation throws a missing rule that cannot be traced back to a QuestionGraph in the config, a warning is added to `diagnostics.brokenReferences` without crashing the process.

## AI Preparation & RAG Expose

The generated `MissingQuestionDTO` serves as the sole source of truth for the Gemini AI. We have exposed and mapped:
- `systemHint`, `aiContext`, and `confidenceWeight` to guide Gemini's conversational style per question.
- `embeddingId`, `knowledgeBaseReference`, and `promptTemplateId` as placeholders for the future RAG engine integration.
- `expectedAnswerType` to allow the AI to coerce unstructured conversational replies into rigid JSON objects.

## Future Conversation Flow (Extension Point)

Because this module deduplicates and sorts questions by impact (`affectedGrantCount`), the engine guarantees the shortest possible assessment path. If 50 grants all require ACRA UEN registration, the AI will ask for it first, potentially pruning down the remaining question tree massively on the next evaluation pass.

## Performance Notes

By utilizing `Map` and `Set` collections extensively, we guarantee that processing 500+ grants with 5000+ rules does not suffer from quadratic `O(N^2)` degradation. The extraction scales linearly with the number of missing rules.
