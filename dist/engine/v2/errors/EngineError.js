"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineError = void 0;
class EngineError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'EngineError';
    }
}
exports.EngineError = EngineError;
