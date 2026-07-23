export class ConversationPlanner {
  /**
   * Evaluates the missing questions and determines the optimal next question.
   * Priority -> Affected Grants -> Sequence
   */
  public determineNextQuestion(missingQuestions: any[]): any | null {
    if (!missingQuestions || missingQuestions.length === 0) {
      return null;
    }

    // Since MissingDataResolver already sorts them by priority and affected grants,
    // the first item is inherently the most optimal.
    return missingQuestions[0];
  }
}
