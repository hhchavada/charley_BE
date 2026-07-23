"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionProgress = void 0;
class SessionProgress {
    /**
     * Calculates dynamic progress metrics.
     * This is heavily abstracted because the exact number of remaining questions
     * depends on the Evaluation engine's Rule graphs.
     */
    calculate(session, missingRulesCount, totalExpectedRules) {
        const answeredKeys = Object.keys(session.payload).length; // Rough heuristic
        let completionPercentage = 0;
        if (totalExpectedRules > 0) {
            completionPercentage = Math.round(((totalExpectedRules - missingRulesCount) / totalExpectedRules) * 100);
        }
        else {
            // If we haven't evaluated yet, or there are no rules
            completionPercentage = answeredKeys > 0 ? 10 : 0;
        }
        // Clamp percentage
        completionPercentage = Math.max(0, Math.min(100, completionPercentage));
        return {
            completionPercentage,
            answeredQuestions: answeredKeys,
            remainingQuestions: missingRulesCount,
            skippedQuestions: 0, // Need skipped tracking logic in payload if required
            missingRules: missingRulesCount
        };
    }
}
exports.SessionProgress = SessionProgress;
