# CCP Implementation Report

## Overview
The Career Conversion Programme (CCP) grant logic has been fully implemented into the configuration engine. No architectural changes were made, and all business rules have been successfully represented via metadata mapping.

## Grants Configured
The CCP configuration has been modeled using 3 independent streams sharing the `"CCP"` `mergeGroup` and a base priority of 4. This ensures that the engine evaluates all conditions but only outputs the single highest-priority eligible stream to the user.

1. **CCP - Mature Worker** (`streamPriority: 1`): Maps to the 90% salary support tier for candidates aged 40 and above.
2. **CCP - Long-Term Unemployed** (`streamPriority: 2`): Maps to the 90% salary support tier for candidates unemployed for 6 months or more.
3. **CCP - Standard** (`streamPriority: 3`): Maps to the baseline 70% salary support tier for candidates meeting all basic requirements but neither of the advanced age or unemployment duration metrics.

## Business Rules Implemented (Configuration Driven)

### Core Eligibility
- **Citizen / PR**: Configured via `isCitizenOrPR` equals "Yes" across all streams.
- **Age >= 21**: Configured via `candidateAge >= 21` (Standard and LTU streams).
- **Age 40+**: Enforced using `candidateAge >= 40` strictly on the "Mature Worker" stream to trigger the 90% tier.
- **Unemployed 6 months**: Checked via `unemployedMonths >= 6` specifically on the "Long-Term Unemployed" stream.

### Restrictions
- **Not shareholder**: Checked using `isShareholder` equals "No" across all streams.
- **Not ex employee**: Enforced using `isExEmployee` equals "No" across all streams.

### Funding Display
- **Salary support**: Accurately modeled using the `estimatedFunding: "Salary Support"` flag. 
- **70% / 90% Support**: Hardcoded dynamically on the respective stream configurations via the `supportPercentage` field. `typicalFunding` and `officialCap` provide detailed context (e.g., "$6,000 per month" cap for 90% vs "$4,000 per month" for 70%).

## Dynamic Follow-up Questions
The `questions.json` schema has been appended to dynamically probe for CCP prerequisites if the user indicates they are hiring a mid-career professional:
- Is the candidate a Singapore Citizen or PR?
- What is the candidate's age?
- How many months has the candidate been unemployed?
- Is the candidate a shareholder of the company?
- Has the candidate been previously employed by the company?

The system will intelligently route the candidate's profile to the correct salary tier (70% vs 90%) entirely through the rule engine's prioritization merge logic.
