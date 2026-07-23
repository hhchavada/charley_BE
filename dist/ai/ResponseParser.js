"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseParser = void 0;
const AIErrors_1 = require("./errors/AIErrors");
class ResponseParser {
    /**
     * Safely extracts JSON from a raw AI string which might be wrapped in markdown.
     */
    parseJson(raw) {
        let clean = raw.trim();
        // Remove markdown code blocks if present
        if (clean.startsWith('```')) {
            const firstNewline = clean.indexOf('\n');
            if (firstNewline !== -1) {
                clean = clean.substring(firstNewline + 1);
            }
            if (clean.endsWith('```')) {
                clean = clean.substring(0, clean.length - 3);
            }
        }
        try {
            return JSON.parse(clean.trim());
        }
        catch (error) {
            throw new AIErrors_1.SchemaValidationError('Response is not valid JSON.', { raw });
        }
    }
}
exports.ResponseParser = ResponseParser;
