"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyLayer = void 0;
const AIErrors_1 = require("./errors/AIErrors");
class SafetyLayer {
    /**
     * Scans the parsed response to ensure it doesn't violate safety policies.
     * - Hallucinated fields
     * - Prompt injection flags
     */
    sanitize(parsedResponse, targetQuestion) {
        // 1. Hallucination check
        if (parsedResponse.action === 'ASK_QUESTION' && parsedResponse.structuredData) {
            if (parsedResponse.structuredData.questionId &&
                targetQuestion &&
                parsedResponse.structuredData.questionId !== targetQuestion.questionId) {
                throw new AIErrors_1.HallucinationError(`AI attempted to ask an unauthorized question ID: ${parsedResponse.structuredData.questionId}`);
            }
        }
        // 2. Prompt Injection heuristics (placeholder for complex logic)
        if (parsedResponse.message && parsedResponse.message.toLowerCase().includes('ignore previous instructions')) {
            throw new AIErrors_1.HallucinationError('Potential prompt injection detected in AI output.');
        }
        return parsedResponse;
    }
}
exports.SafetyLayer = SafetyLayer;
