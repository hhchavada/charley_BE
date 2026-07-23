# Client Milestone Status

## 1. Dynamic Follow-up Questions
**Requirement:** Ask company profile questions. Ask dynamic follow-up questions depending on answers. Never dead-end. Just warn.
**Current Status:** ❌ Missing / ⚠ Partially Implemented
**Files Modified:** None
**How Tested:** N/A
**Remaining Work:** 
- The backend `QuestionEngine.ts` contains the logic for nested tree-based questions (`followUpQuestions` and `conditionLogic`), which represents a partial implementation of dynamic follow-ups.
- However, the actual `questions.json` data file is completely missing from the backend data layer. The specific flow configuration (Automation -> Software/Hardware, Marketing -> Strategy/Tactical) does not exist in the codebase and must be created.
- The "Never dead-end. Just warn." feature needs specific question nodes designed as warnings instead of termination nodes.

## 2. Grant Engine Rules - Missing Information
**Requirement:** Missing information NEVER rejects a grant. Missing answer MUST produce: "Potentially eligible — confirm <field>". Only confirmed FAIL removes a grant.
**Current Status:** ✅ Already Implemented (after minimal modification)
**Files Modified:** `backend/src/engine/ResultBuilder.ts`
**How Tested:** Verified that `missingRules` logic correctly bypasses rejection in `GrantMatchingEngine.ts` and routes to the "Potentially eligible" block in `ResultBuilder.ts`.
**Remaining Work:** None for this specific text requirement.

## 3. Ranking Configuration
**Requirement:** Ranking comes entirely from configuration. Priority: 1 EDG, 2 MRA, 3 PSG, 4 CCP, 5 WDG.
**Current Status:** ⚠ Partially Implemented
**Files Modified:** None
**How Tested:** N/A
**Remaining Work:**
- The logic to sort by `grant.priority` is correctly implemented in `ResultBuilder.ts` (`const sortByPriority = (a, b) => a.priority - b.priority`).
- The `grants.json` file has incorrect, dummy data with hardcoded priorities (1, 2, 3) that do not align with the required client configuration (EDG, MRA, PSG, CCP, WDG). The JSON file needs to be completely rewritten to match the client's grants.

## 4. Enterprise Development Grant Merge Logic
**Requirement:** Only ONE EDG card even if multiple streams match. Merge automatically. Everything configurable. No merge logic hardcoded.
**Current Status:** ❌ Missing
**Files Modified:** None
**How Tested:** N/A
**Remaining Work:**
- `GrantMatchingEngine.ts` currently evaluates all grants in `grants.json` as completely independent entities. It returns a flat array of `MatchResult` objects.
- There is absolutely no configuration schema or engine logic designed to define "Grant Groups" or "Streams" and merge them into a single card based on priority. This requires adding a `groupId` or `streamPriority` property to the JSON configuration and modifying `GrantMatchingEngine.ts` or `ResultBuilder.ts` to group and deduplicate the results dynamically.

## 5. Funding Display
**Requirement:** Card headline -> Typical funding. Details -> Official caps. Enterprise Innovation Scheme -> Never included inside funding totals.
**Current Status:** ❌ Missing
**Files Modified:** None
**How Tested:** N/A
**Remaining Work:**
- The backend `Grant` interface only has a single `estimatedFunding` string field. It lacks the data structure for separate `typicalFunding` and `officialCaps` properties.
- The logic to explicitly exclude specific grants (like "Enterprise Innovation Scheme") from frontend or backend aggregation totals does not exist and needs a configuration flag (e.g., `excludeFromTotals: true`).

---

## Milestone Completion %
**Estimated Completion:** 20%
*(Based strictly on the fact that the underlying evaluation engines exist, but all configurations are missing, and EDG merging/funding display logic is completely absent).*
