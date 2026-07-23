"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionRepository = void 0;
class InMemorySessionRepository {
    store = new Map();
    async findById(sessionId) {
        const session = this.store.get(sessionId);
        return session ? structuredClone(session) : null;
    }
    async save(session, currentUpdatedAt) {
        const existing = this.store.get(session.sessionId);
        if (existing && existing.updatedAt.getTime() !== currentUpdatedAt.getTime()) {
            throw new Error('Concurrency conflict: Session has been modified.');
        }
        const newSession = { ...session, updatedAt: new Date() };
        this.store.set(newSession.sessionId, structuredClone(newSession));
        return newSession;
    }
}
exports.InMemorySessionRepository = InMemorySessionRepository;
