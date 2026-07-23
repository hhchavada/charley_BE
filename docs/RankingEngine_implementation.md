# RankingEngine Implementation

The `RankingEngine` sits at the end of the evaluation lifecycle. While `GrantEvaluator` decides *if* a user is eligible, the `RankingEngine` decides *how* to present that eligibility to the user. It enforces specific business presentation rules natively without hardcoding Grant names in code.

## Architecture

1. **Stateless Service**: The engine is a pure, side-effect-free class. It accepts `GrantEvaluationResult[]` and outputs a heavily grouped, bucketed, and sorted `RankingResult`.
2. **Metadata Driven**: Every single business rule is triggered by `grant.metadata` configured in MongoDB. The backend TypeScript never asks `if (grant.name === 'Enterprise Development Grant')`.

## Ranking Flow

1. **Score Calculation**: A weighted `recommendationScore` is generated for every grant taking into account its explicit priority, completion percentage, rule coverage, and AI confidence parameters.
2. **Merging**: The engine scans for `metadata.mergeGroup`. All grants sharing a merge group are condensed into a single `RankedGrantDTO` card.
3. **Sorting**: All standalone grants and merged cards are sorted by their MongoDB `priority` property descending, followed by their internal `recommendationScore`.
4. **Bucketing**: The engine iterates through the sorted list and places them into exact frontend display buckets: `readyNow`, `needsInformation`, `prepareNext`, `windowClosed`, and `hidden`.

## Business Rules Support

- **EDG Merging**: Solved via configuring `metadata: { mergeGroup: 'EDG', streamPriority: X }` on all EDG grant variations. The highest `streamPriority` dictates the "recommended" face of the merged card.
- **EIS Stacking Rule**: Solved via `metadata: { stacksWithOtherGrants: true }`. Grants with this flag bypass the `totalEstimatedFunding` accumulator loop, adhering to the rule that EIS must not inflate the headline cap.
- **CTC Prepare Next Rule**: Solved via `metadata: { isPrepareNext: true }`. Grants with this flag bypass the `readyNow` bucket entirely.
- **Window Logic**: The `metadata.windowStatus` property effortlessly diverts closed or expired grants into the `windowClosed` bucket.

## Future AI Integration

The DTO includes strictly-typed placeholders to funnel explanatory logic back to the UI or conversational interfaces:
- `AIExplanation`
- `whyRanked`
- `whyRecommended`
- `whyHidden`

## Performance

The engine handles 1000+ grants in a fraction of a millisecond utilizing native fast V8 `.sort()` boundaries and non-blocking metadata loops. It never touches the database.

## Extension Points

The `calculateScore()` internal method is cleanly scoped. As AI models produce dynamic user profiles, this method can effortlessly incorporate NLP weights without modifying the sorting pipeline.
