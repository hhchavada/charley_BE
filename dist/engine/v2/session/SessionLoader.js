"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLoader = void 0;
class SessionLoader {
    repository;
    validator;
    constructor(repository, validator) {
        this.repository = repository;
        this.validator = validator;
    }
    /**
     * Loads the session and validates it.
     */
    async load(sessionId, activeConfigVersion) {
        const session = await this.repository.findById(sessionId);
        this.validator.validateUpdate(session);
        this.validator.validateConfiguration(session.configVersionId, activeConfigVersion);
        return session;
    }
}
exports.SessionLoader = SessionLoader;
