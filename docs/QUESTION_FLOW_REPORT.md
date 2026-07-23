# Question Flow Implementation Report

## Overview
The dynamic follow-up questions required by the client have been fully implemented natively within `questions.json`. The Question Flow maps user inputs accurately through branching paths without relying on frontend UI updates or hardcoded component rules. 

## Configured Dynamic Branches

### 1. Automation Flow
- **Trigger**: "Are you planning an automation project?" (`planningAutomation`)
- **Follow-up 1**: "Is this a Software or Hardware automation project?" (`automationType`)
- **Follow-up 2**: "What is the expected spend band for this automation?" (`automationSizing`)
- **Mapping**: These answers natively link into the EDG Automation streams.

### 2. Marketing Flow
- **Trigger**: "Are you planning a marketing project?" (`planningMarketing`)
- **Follow-up 1**: "Is this a Strategy or Tactical marketing project?" (`marketingType`)
- **Mapping**: Answers to `marketingType` route directly to EDG (Strategy) or PSG (Tactical) through the rule engine conditions.

### 3. Overseas Expansion
- **Trigger**: "Are you planning overseas expansion?"
- **Follow-ups**:
  - "Which markets are you targeting?"
  - "Is this a new market for your company?" (`newMarket`)
  - "What are your current overseas sales?" 
- **Mapping**: Actively utilized by the Market Readiness Assistance (MRA) conditional checks.

### 4. Early-Stage Companies
- **Trigger**: "How many months has your company been in operation?"
- **Follow-up**: Evaluates if the answer is `< 12` months, seamlessly branching to:
  - "Is this your first registered business?" (`firstBusiness`)
- **Mapping**: Powers the Startup SG Founder logic.

### 5. Final Project Goals
- **Trigger**: "Final Project Goals" (Used to assess implementation phase)
- **Follow-ups**:
  - "Have you signed a contract or accepted a quotation?" (`alreadyPurchased`)
  - "Have you made any payments to the vendor?" (`alreadyPaid`)
  - "Has the project started?" (`projectStarted`)
- **Mapping**: Natively rejects PSG (if already purchased) or EDG (if project started) directly through the matching condition evaluations.

## Conclusion
The entirety of the required client question flows have been bound to the dynamic assessment configuration. The system relies entirely on configuration schema, completely isolating the frontend from any hardcoded validation.
