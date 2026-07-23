export class ContextBuilder {
  /**
   * Combines various pieces of context into a flat variables map for the PromptCompiler.
   */
  public buildVariables(
    assessmentContext: any,
    missingQuestions: any[],
    targetQuestion: any | null,
    conversationHistory: any[]
  ): Record<string, string> {
    
    // Stringify conversation history for prompt injection
    const historyString = conversationHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    // Context on grants we are trying to unlock
    const unlockingGrants = targetQuestion?.affectedGrantIds?.join(', ') || 'Various';

    return {
      BUSINESS_NAME: assessmentContext.companyName || 'the business',
      MISSING_DATA_SUMMARY: `Missing ${missingQuestions.length} total data points.`,
      TARGET_QUESTION_ID: targetQuestion?.questionId || '',
      TARGET_QUESTION_HINT: targetQuestion?.systemHint || '',
      TARGET_EXPECTED_TYPE: targetQuestion?.expectedAnswerType || 'string',
      UNLOCKING_GRANTS: unlockingGrants,
      CONVERSATION_HISTORY: historyString
    };
  }
}
