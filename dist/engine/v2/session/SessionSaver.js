"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSaver = void 0;
const errors_1 = require("./errors");
class SessionSaver {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Saves the session using optimistic locking.
     * Compares the current memory 'updatedAt' with the database.
     * If it fails, throws OptimisticLockError to prevent overwriting answers.
     */
    async save(session) {
        const memoryUpdatedAt = session.updatedAt;
        // We update the timestamp right before saving
        session.updatedAt = new Date();
        try {
            // The repository MUST implement the logic: 
            // UPDATE ... WHERE sessionId = ? AND updatedAt = memoryUpdatedAt
            const saved = await this.repository.save(session, memoryUpdatedAt);
            return saved;
        }
        catch (error) {
            if (error.name === 'OptimisticLockError') {
                throw new errors_1.OptimisticLockError(session.sessionId);
            }
            throw error;
        }
    }
}
exports.SessionSaver = SessionSaver;
