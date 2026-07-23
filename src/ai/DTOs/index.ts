import { IAICostEstimation, IAITokenEstimation } from '../interfaces';

export interface AIResponseDTO {
  success: boolean;
  message?: string;
  action: 'ASK_QUESTION' | 'PROVIDE_SUMMARY' | 'CLARIFY';
  structuredData: {
    questionId?: string;
    fieldPath?: string;
    suggestedAnswer?: any;
    confidence?: number;
  };
  metrics: {
    latencyMs: number;
    tokens: IAITokenEstimation;
    cost: IAICostEstimation;
    retries: number;
    provider: string;
    promptVersion: string;
  };
}
