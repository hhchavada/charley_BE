# MRA Implementation Report

## Overview
The Market Readiness Assistance (MRA) grant has been successfully implemented exclusively through configuration metadata. No hardcoded logic or architecture changes were required. The grant rules and dynamic follow-up questions evaluate the client's business logic autonomously.

## Grants Configured
The MRA configuration has been split into 3 distinct streams, all linked by `mergeGroup: "MRA"` to ensure only one MRA card is output per application, prioritized dynamically:

1. **MRA - Promotion** (`streamPriority: 1`)
2. **MRA - Business Development** (`streamPriority: 2`)
3. **MRA - Market Setup** (`streamPriority: 3`)

## Business Rules Implemented
All MRA conditions are successfully mapped in `grants.json`:

- **New market only**: Checked using `newMarket` `equals` "Yes".
- **Overseas sales <100,000**: Enforced using `overseasSales` `<` 100000.
- **70% support**: `supportPercentage` statically configured as `"70%"`.
- **Promotion, Business Development, Market Setup**: Divided into distinct grant streams, validated via the `mraActivityType` field mapping to the respective activity type.
- **$100,000 per market**: Displayed using the `officialCap` field set to `"$100,000 per market"`. `typicalFunding` is also set to `"Up to $100,000"`.
- **One activity per application**: Enforced using `activityCount` `<=` 1.

## Dynamic Follow-up Questions
The `questions.json` file has been created to support the MRA assessment with recursive logic. 

If the user answers "Yes" to planning overseas expansion, the engine dynamically triggers follow-up questions for the required MRA fields:
- Which markets are you targeting? (`targetMarket`)
- Is this a new market for your company? (`newMarket`)
- What are your current overseas sales in this market? (`overseasSales`)
- What type of overseas activity are you planning? (`mraActivityType`)
- How many activities per application? (`activityCount`)

These questions map directly to the engine operators, enabling the grant logic to compute flawlessly without dead-ending users who leave inputs blank (falling back to "Potentially Eligible - confirm").
