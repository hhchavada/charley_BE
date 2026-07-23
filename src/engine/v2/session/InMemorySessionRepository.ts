import { AssessmentSession, ISessionRepository } from './interfaces';

export class InMemorySessionRepository implements ISessionRepository {
  private readonly store = new Map<string, AssessmentSession>();

  public async findById(sessionId: string): Promise<AssessmentSession | null> {
    const session = this.store.get(sessionId);
    return session ? structuredClone(session) : null;
  }

  public async save(session: AssessmentSession, currentUpdatedAt: Date): Promise<AssessmentSession> {
    const existing = this.store.get(session.sessionId);
    if (existing && existing.updatedAt.getTime() !== currentUpdatedAt.getTime()) {
      throw new Error('Concurrency conflict: Session has been modified.');
    }
    const newSession = { ...session, updatedAt: new Date() };
    this.store.set(newSession.sessionId, structuredClone(newSession));
    return newSession;
  }
}
