import { AssessmentSession } from './interfaces';
import { SessionValidationError } from './errors';

export class SessionValidator {
  /**
   * Validates that the session exists and is in a state that can be updated.
   */
  public validateUpdate(session: AssessmentSession | null): asserts session is AssessmentSession {
    if (!session) {
      throw new SessionValidationError('Session does not exist.');
    }
    if (session.state === 'ARCHIVED') {
      throw new SessionValidationError('Cannot modify an archived session.');
    }
  }

  /**
   * Validates that the configuration version matches or handles migrations.
   */
  public validateConfiguration(sessionVersion: string, activeVersion: string): void {
    // In a real scenario, this might trigger a migration if versions differ.
    // For now, we enforce strict matching to avoid breaking rule evaluations.
    if (sessionVersion !== activeVersion) {
      throw new SessionValidationError(
        `Session configuration version (${sessionVersion}) differs from active version (${activeVersion}).`
      );
    }
  }
}
