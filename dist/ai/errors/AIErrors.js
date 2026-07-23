"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallucinationError = exports.ProviderTimeoutError = exports.SchemaValidationError = exports.AIError = void 0;
class AIError extends Error {
    message;
    code;
    isRecoverable;
    details;
    constructor(message, code, isRecoverable = false, details) {
        super(message);
        this.message = message;
        this.code = code;
        this.isRecoverable = isRecoverable;
        this.details = details;
        this.name = 'AIError';
    }
}
exports.AIError = AIError;
class SchemaValidationError extends AIError {
    constructor(message, details) {
        super(message, 'SCHEMA_VALIDATION_FAILED', true, details);
        this.name = 'SchemaValidationError';
    }
}
exports.SchemaValidationError = SchemaValidationError;
class ProviderTimeoutError extends AIError {
    constructor(provider) {
        super(`Provider ${provider} timed out.`, 'PROVIDER_TIMEOUT', true);
        this.name = 'ProviderTimeoutError';
    }
}
exports.ProviderTimeoutError = ProviderTimeoutError;
class HallucinationError extends AIError {
    constructor(message) {
        super(message, 'HALLUCINATION_DETECTED', true);
        this.name = 'HallucinationError';
    }
}
exports.HallucinationError = HallucinationError;
