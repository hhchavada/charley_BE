"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationPlanner = void 0;
class ConversationPlanner {
    /**
     * Evaluates the missing questions and determines the optimal next question.
     * Priority -> Affected Grants -> Sequence
     */
    determineNextQuestion(missingQuestions) {
        if (!missingQuestions || missingQuestions.length === 0) {
            return null;
        }
        // Since MissingDataResolver already sorts them by priority and affected grants,
        // the first item is inherently the most optimal.
        return missingQuestions[0];
    }
}
exports.ConversationPlanner = ConversationPlanner;
