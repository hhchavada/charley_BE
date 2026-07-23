import { AssessmentSession, ISessionRepository } from './interfaces';
import { OptimisticLockError } from './errors';

export class SessionSaver {
  constructor(private readonly repository: ISessionRepository) {}

  /**
   * Saves the session using optimistic locking.
   * Compares the current memory 'updatedAt' with the database.
   * If it fails, throws OptimisticLockError to prevent overwriting answers.
   */
  public async save(session: AssessmentSession): Promise<AssessmentSession> {
    const memoryUpdatedAt = session.updatedAt;
    
    // We update the timestamp right before saving
    session.updatedAt = new Date();
    
    try {
      // The repository MUST implement the logic: 
      // UPDATE ... WHERE sessionId = ? AND updatedAt = memoryUpdatedAt
      const saved = await this.repository.save(session, memoryUpdatedAt);
      return saved;
    } catch (error: any) {
      if (error.name === 'OptimisticLockError') {
        throw new OptimisticLockError(session.sessionId);
      }
      throw error;
    }
  }
}
