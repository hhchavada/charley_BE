import { AssessmentSession, ISessionRepository, SessionState } from './interfaces';
import { SessionValidator } from './SessionValidator';

export class SessionLoader {
  constructor(
    private readonly repository: ISessionRepository,
    private readonly validator: SessionValidator
  ) {}

  /**
   * Loads the session and validates it.
   */
  public async load(sessionId: string, activeConfigVersion: string): Promise<AssessmentSession> {
    const session = await this.repository.findById(sessionId);
    
    this.validator.validateUpdate(session);
    this.validator.validateConfiguration(session.configVersionId, activeConfigVersion);
    
    return session;
  }
}
