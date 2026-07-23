# WDG Implementation Report

## Overview
The Workforce Development Grant (WDG) module has been fully implemented exclusively using configuration metadata without any code changes to the underlying engine.

## Grants Configured
The WDG configuration is separated into 3 independent streams sharing the `"WDG"` `mergeGroup` and a base priority of 5:

1. **WDG - Consultancy** (`streamPriority: 1`)
2. **WDG - Capability** (`streamPriority: 2`)
3. **WDG - Technology** (`streamPriority: 3`)

## Business Rules Implemented (Configuration Driven)

### Core Eligibility
- **Minimum 3 local employees**: Configured strictly via `localEmployees >= 3`.
- **Consultant requirement**: Enforced using `useConsultant` equals "Yes" across all WDG streams.

### Stream Distribution
- **Consultancy / Capability / Technology**: Handled dynamically using the `wdgProjectType` answer, which accurately maps the applicant to one of the three distinct streams using standard conditional `equals` mapping.

### Funding Display
- **Typical funding**: Successfully configured via `typicalFunding: "Up to $15,000"` mapping, displaying explicitly within the UI.

## Dynamic Follow-up Questions
The `questions.json` dataset has been updated to prompt for WDG prerequisites if the user indicates they are planning a workforce development project.
- How many local employees do you have? (`localEmployees`)
- Will you be engaging an external consultant? (`useConsultant`)
- What type of workforce project is this? (`wdgProjectType`: Consultancy, Capability, Technology)

The engine will capture these inputs and intelligently route the business into the correct WDG classification stream.
