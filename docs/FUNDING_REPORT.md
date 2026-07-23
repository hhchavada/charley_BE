# Funding Calculations Implementation Report

## Overview
The complete suite of funding calculation logic and its associated display components have been integrated across the platform. The system now reliably calculates funding totals, handles edge-case exclusions, and accurately groups matching grants according to the client's ruleset.

## Funding Features Supported

### 1. Typical Funding & Official Cap
- **Implementation**: The backend `Grant` interface now supports the `typicalFunding` and `officialCap` fields.
- **Frontend Integration**: `PremiumGrantCard.tsx` has been redesigned to intelligently replace generic "Estimated Funding" with precise "Typical Funding" and explicitly highlight the "Official Cap" in a dedicated data block when present in the grant's metadata.

### 2. EIS Exclusion
- **Implementation**: Implemented via the `excludeFromTotalFunding` flag.
- **Calculation**: The frontend metrics aggregator (`useResultsMetrics.ts`) automatically strips any grant carrying this flag out of the `$X Total Funding` calculation displayed in the hero section, fully resolving the EIS requirement while still displaying the grant to the user.

### 3. Total Funding Calculation
- **Implementation**: The metrics calculator now elegantly falls back across funding properties, parsing integers directly from `typicalFunding` strings before defaulting to `estimatedFunding`, ensuring that only valid numeric data aggregates into the top-level metric.

## Categorization & Prioritization

### 4. Merge EDG & Stream Priority
- **Implementation**: Handled globally in the backend `ResultBuilder.ts`.
- **Logic**: Any grants sharing the same `mergeGroup` (e.g., EDG Strategy, EDG Marketing, etc.) are bundled during output evaluation. The engine sorts these streams by their internal `streamPriority` integer, extracting only the single highest-priority match and discarding redundant streams. This prevents UI bloat (e.g., showing 3 EDG cards simultaneously).

### 5. Prepare Next Classification
- **Implementation**: Grants configured with `prepareNext: true` (e.g., Company Training Committee) trigger a distinct categorization bypass.
- **Result**: `page.tsx` has been updated with a new "Prepare Next" rendering section. These grants skip the standard eligible/ineligible buckets entirely and format gracefully under "Strategic programmes to prepare for the future." 

## Conclusion
The funding ecosystem is fully robust, supporting the explicit client constraints completely via dynamic metadata and robust aggregator hooks without needing any hardcoded UI exceptions.
