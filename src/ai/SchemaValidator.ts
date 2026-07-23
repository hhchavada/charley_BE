import { z } from 'zod';
import { SchemaValidationError } from './errors/AIErrors';

export class SchemaValidator {
  
  // The expected JSON structure from the AI provider
  private readonly AIResponseSchema = z.object({
    action: z.enum(['ASK_QUESTION', 'PROVIDE_SUMMARY', 'CLARIFY']),
    message: z.string().optional(),
    structuredData: z.object({
      questionId: z.string().optional(),
      fieldPath: z.string().optional(),
      suggestedAnswer: z.any().optional(),
      confidence: z.number().min(0).max(100).optional()
    }).optional()
  });

  public validate(jsonPayload: any): any {
    try {
      return this.AIResponseSchema.parse(jsonPayload);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        throw new SchemaValidationError(`JSON violates schema rules.`, error.issues);
      }
      throw new SchemaValidationError(`Unknown validation error`, error);
    }
  }
}
