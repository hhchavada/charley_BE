# Executive Summary

**Overall Architecture Score:** 4/10  
**Overall Scalability Score:** 3/10  
**Production Readiness Score:** 2/10  
**Technical Debt Score:** 8/10 (High Debt)  

This codebase represents a solid Minimum Viable Product (MVP) or prototype, but it is **not ready** for production as a scalable SaaS application. It successfully demonstrates the core concept of rule-based grant matching and dynamic questioning. However, it relies heavily on flat data structures, hardcoded JSON files, and simplistic evaluation logic that will completely collapse under the weight of 150-200 grants, complex consultant-driven business rules, and multi-tenant SaaS requirements.

### Top Strengths
1. **Separation of Concerns:** The engine logic (`RuleEngine`, `QuestionEngine`, `GrantMatchingEngine`) is modularized and separated from the API layer.
2. **Missing Data Handling:** The core logic successfully prevents missing data from outright failing a grant (correctly routing to "Needs More Information"), which is crucial for the business requirements.
3. **Recursive Question Engine:** `QuestionEngine` supports recursive follow-up questions through a nested data structure.

### Top Weaknesses
1. **Static Data Persistence:** Grants, Rules, and (presumably) Questions are stored in static `.json` files rather than a database. Non-technical consultants cannot edit these without a developer modifying the repository and redeploying.
2. **Flat Rule Structure:** The matching engine assumes all conditions are grouped by an implicit `AND`. It does not support complex nested `AND`/`OR` logic or rule groups required for real-world government grants.
3. **No Multi-tenancy:** The database schema (`Company.ts`) lacks tenant isolation and user context, making it unusable for a SaaS platform where multiple consultants or businesses interact with the system simultaneously.

---

# Frontend Audit
*(Note: Based on standard Next.js directory structure present in the repo)*
- **State Management:** The frontend architecture needs to properly handle complex, deeply nested state for the dynamic question engine. If it relies on simple React state without a robust form library (like React Hook Form + Zod) or global state (Zustand/Redux), performance will degrade and infinite re-renders will occur as the questionnaire grows to 500+ questions.
- **Component Reusability:** The dynamic renderer must map JSON definitions to UI components seamlessly.

---

# Backend Audit
- **Architecture:** Standard Express/Node.js architecture. 
- **Modularity:** Good separation of engines (`src/engine`), but poor data access patterns (reading directly from `fs`).
- **Memory Leaks & State:** Reading static JSON files on server startup and holding them in memory (`fs.readFileSync` in `GrantMatchingEngine` constructor) is fine for 5 grants, but as the system scales to thousands of users and rules, this approach limits dynamic updates. If a consultant updates a rule, the server must be restarted to fetch the new JSON data.

---

# Database Audit
**Score: 2/10**

The current database schema **cannot** support the business goals.
- **Missing Collections:** The system lacks collections for `Grants`, `Questions`, `Rules`, and `RuleGroups`. Storing grants in `grants.json` makes admin-editable rules impossible.
- **No Versioning:** If a government agency updates a grant's rules, there is no way to version the grant. Old applications will be evaluated against new rules, corrupting historical data.
- **Formula Fields:** MongoDB does not natively support formula fields easily without pre-computation or complex aggregation pipelines. The current schema (`Company.ts`) is highly rigid and tied specifically to Singapore ACRA data (UEN, SSIC codes).
- **Extensibility:** As dynamic answers grow, storing them in a schemaless `dynamicAnswers` JSON object within the `Company` document will make querying and analytics across thousands of businesses exceptionally slow.

---

# Rule Engine Audit
**Score: 4/10**

**Status:** Semi-configurable (Data-driven for simple operations, hardcoded for logic).

The current `RuleEngine.ts` is a basic switch-statement evaluator. 
- **What works:** It can handle simple `Revenue > 50000` via data payloads.
- **What fails:** It completely lacks support for **Rule Groups** and **Complex Expressions**. 
- **Example limitation:** A consultant cannot configure: `(Revenue > 50000 AND Employees < 50) OR (Project = 'AI' AND Funding < 10000)`. The `RuleEngine` evaluates single fields against single values. It cannot evaluate a composite condition without writing new application code.

---

# Dynamic Question Engine Audit
**Score: 6/10**

**Status:** Configurable tree, but limited graph merging.

- **Branching:** The `QuestionEngine` supports recursive branching via `q.followUpQuestions`. It can theoretically branch infinitely.
- **Merging branches:** It **cannot** support multiple branches merging back into a shared question flow. Because the structure is a strict Tree (nested `followUpQuestions`), if Question A and Question B both need to lead to Question C, Question C must be duplicated in the JSON data.
- **Multi-dependency:** A question can depend on multiple previous answers (`conditionLogic: 'AND' | 'OR'`), which is a strong point.

---

# Matching Engine Audit
**Score: 5/10**

**Status:** Hardcoded implicit `AND` logic.

- **AND / OR groups:** **NOT SUPPORTED.** The `Grant` interface defines `conditions: Rule[]`. It iterates through them and fails the grant if *any* rule fails. There is no way to specify an `OR` condition for a grant.
- **Nested conditions:** **NOT SUPPORTED.** 
- **Unknown values:** **SUPPORTED.** Handled gracefully and mapped to 'Needs More Information'.
- **Partial matches:** **SUPPORTED.** Represented by a basic percentage score.
- **Confidence/Weighted scoring:** **NOT SUPPORTED.** All rules carry equal weight (`totalRules === 0 ? 0 : Math.round((matchedRules.length / totalRules) * 100)`). You cannot define "Rule A is worth 80% of the match, Rule B is 20%".

---

# API Audit
*(Inferred from structure)*
- Lacks a robust validation layer. The system relies on custom `ValidationEngine` instead of standard, battle-tested validation libraries like Zod or Joi.
- No dynamic endpoints for CRUD operations on Grants/Rules, preventing the Admin Panel from functioning.

---

# Scalability Audit
**Can it support the 2-year vision?**
**NO.**

**Bottlenecks:**
1. **JSON File I/O:** Relying on `grants.json` means the system must be rebooted for every rule change. It cannot scale to hundreds of grants.
2. **Evaluation Complexity:** Running 5,000 businesses against 200 grants (where each grant has 20 rules) results in 20,000,000 evaluations. Doing this in memory synchronously on the Node thread will block the event loop, causing API timeouts for other users.
3. **Database Lookups:** Storing dynamic answers in a nested object prevents indexing. Finding "all companies eligible for Grant X" requires pulling all companies into memory and running the `GrantMatchingEngine`, rather than executing an optimized database query.

---

# Maintainability & Extensibility Audit
- Highly rigid. Adding a new operator (e.g., `regex_match` or `date_before`) requires modifying `RuleEngine.ts` and deploying the backend.
- Lacks a Domain-Specific Language (DSL) or an Abstract Syntax Tree (AST) parser to allow consultants to write math formulas (e.g., `(Assets - Liabilities) / Revenue`).

---

# Immediate Bugs & Critical Design Problems
1. **Missing Data False Positives:** If a grant requires a value to *not exist* (`operator: 'not_exists'`), but the user leaves it blank, the engine correctly passes the rule. However, if a rule requires a specific value and it's missing, it flags it as `MISSING_DATA`. This is mostly correct, but complex conditional intersections might yield false 'Needs More Information' states for grants the user inherently doesn't qualify for.
2. **Implicit AND limitation:** Real government grants always have complex OR conditions (e.g., "Must be a citizen OR permanent resident for 5 years"). The engine currently cannot model this without writing duplicate grants.

---

# Recommended Architecture

To achieve a fully dynamic, consultant-editable rule engine that scales, you must transition to a **Data-Driven Rules Graph** Architecture:

1. **Database-Backed Rules Engine (JSONata or AST):** 
   - Store all rules, grants, and questions in PostgreSQL (preferred for complex relational tracking and JSONB support) or structured MongoDB collections.
   - Use an AST (Abstract Syntax Tree) evaluator or a proven library like `json-rules-engine` or `JSONata`. This allows storing complex nested `AND/OR` structures directly in the database as JSON strings, which the engine evaluates dynamically.
2. **Asynchronous Matching Worker:**
   - Move the matching logic off the main Node.js event loop. When a company updates its profile, trigger a message queue (e.g., RabbitMQ, Redis/BullMQ).
   - A background worker computes the eligibility matrix and writes the results back to the database. This prevents API timeouts and allows horizontal scaling of the matching engine.
3. **Directed Acyclic Graph (DAG) for Questions:**
   - Move away from the nested tree structure for questions. Store questions as nodes in a DAG. This allows multiple branch paths to converge on a single follow-up question without data duplication.

---

# Refactoring Roadmap

### High Priority
1. **Migrate Grants and Rules to the Database:** Build MongoDB schemas for `Grant`, `Rule`, and `RuleGroup`. Expose CRUD APIs so an Admin Panel can update them without code deployments.
2. **Refactor Matching Logic to Support Groups:** Modify `GrantMatchingEngine` and the `Rule` interface to support nested `AND/OR` arrays.
3. **Adopt a Standard Rules Library:** Replace `RuleEngine.ts` with `json-rules-engine` to instantly gain support for complex conditions and fact processing.

### Medium Priority
1. **Implement Background Workers:** Move the `GrantMatchingEngine.match()` execution to a background job to prevent blocking the main thread during high load.
2. **DAG Question Engine:** Flatten the nested `followUpQuestions` array into a flat table of questions, using dependency arrays (edges) to determine the next visible question.

### Low Priority
1. **Versioning System:** Implement a historical versioning table for Grants so past matches can be audited against the rules as they existed at the time of application.
2. **Weighted Scoring Engine:** Add `weight` properties to Rule schemas and update `ResultBuilder` to calculate exact confidence scores.

---

# Final Verdict

**Can this architecture realistically support 150–200 grants with consultant-editable business rules?**

### **NO.**

**Why:** The current system is a hardcoded, file-system-bound prototype. It relies on implicit logic that cannot model the complexity of real-world grants. Consultants cannot edit `.json` files in a source code repository, and the lack of nested `OR` conditions makes accurate grant modeling impossible. To succeed as a SaaS, the system must undergo a significant architectural rewrite to decouple business logic from the codebase, moving rules into the database and adopting a robust AST/Rule Engine framework.
