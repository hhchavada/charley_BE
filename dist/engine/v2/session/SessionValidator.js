"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionValidator = void 0;
const errors_1 = require("./errors");
class SessionValidator {
    /**
     * Validates that the session exists and is in a state that can be updated.
     */
    validateUpdate(session) {
        if (!session) {
            throw new errors_1.SessionValidationError('Session does not exist.');
        }
        if (session.state === 'ARCHIVED') {
            throw new errors_1.SessionValidationError('Cannot modify an archived session.');
        }
    }
    /**
     * Validates that the configuration version matches or handles migrations.
     */
    validateConfiguration(sessionVersion, activeVersion) {
        // In a real scenario, this might trigger a migration if versions differ.
        // For now, we enforce strict matching to avoid breaking rule evaluations.
        if (sessionVersion !== activeVersion) {
            throw new errors_1.SessionValidationError(`Session configuration version (${sessionVersion}) differs from active version (${activeVersion}).`);
        }
    }
}
exports.SessionValidator = SessionValidator;
