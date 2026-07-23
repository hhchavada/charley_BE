"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidator = void 0;
const zod_1 = require("zod");
const AIErrors_1 = require("./errors/AIErrors");
class SchemaValidator {
    // The expected JSON structure from the AI provider
    AIResponseSchema = zod_1.z.object({
        action: zod_1.z.enum(['ASK_QUESTION', 'PROVIDE_SUMMARY', 'CLARIFY']),
        message: zod_1.z.string().optional(),
        structuredData: zod_1.z.object({
            questionId: zod_1.z.string().optional(),
            fieldPath: zod_1.z.string().optional(),
            suggestedAnswer: zod_1.z.any().optional(),
            confidence: zod_1.z.number().min(0).max(100).optional()
        }).optional()
    });
    validate(jsonPayload) {
        try {
            return this.AIResponseSchema.parse(jsonPayload);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new AIErrors_1.SchemaValidationError(`JSON violates schema rules.`, error.issues);
            }
            throw new AIErrors_1.SchemaValidationError(`Unknown validation error`, error);
        }
    }
}
exports.SchemaValidator = SchemaValidator;
