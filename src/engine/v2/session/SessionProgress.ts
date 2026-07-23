import { AssessmentSession } from './interfaces';

export interface ProgressMetrics {
  completionPercentage: number;
  answeredQuestions: number;
  remainingQuestions: number;
  skippedQuestions: number;
  missingRules: number;
}

export class SessionProgress {
  /**
   * Calculates dynamic progress metrics.
   * This is heavily abstracted because the exact number of remaining questions
   * depends on the Evaluation engine's Rule graphs.
   */
  public calculate(session: AssessmentSession, missingRulesCount: number, totalExpectedRules: number): ProgressMetrics {
    const answeredKeys = Object.keys(session.payload).length; // Rough heuristic

    let completionPercentage = 0;
    if (totalExpectedRules > 0) {
      completionPercentage = Math.round(((totalExpectedRules - missingRulesCount) / totalExpectedRules) * 100);
    } else {
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
