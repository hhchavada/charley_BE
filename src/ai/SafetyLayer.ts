import { HallucinationError } from './errors/AIErrors';

export class SafetyLayer {
  /**
   * Scans the parsed response to ensure it doesn't violate safety policies.
   * - Hallucinated fields
   * - Prompt injection flags
   */
  public sanitize(parsedResponse: any, targetQuestion: any): any {
    // 1. Hallucination check
    if (parsedResponse.action === 'ASK_QUESTION' && parsedResponse.structuredData) {
      if (
        parsedResponse.structuredData.questionId &&
        targetQuestion && 
        parsedResponse.structuredData.questionId !== targetQuestion.questionId
      ) {
        throw new HallucinationError(`AI attempted to ask an unauthorized question ID: ${parsedResponse.structuredData.questionId}`);
      }
    }

    // 2. Prompt Injection heuristics (placeholder for complex logic)
    if (parsedResponse.message && parsedResponse.message.toLowerCase().includes('ignore previous instructions')) {
       throw new HallucinationError('Potential prompt injection detected in AI output.');
    }

    return parsedResponse;
  }
}
