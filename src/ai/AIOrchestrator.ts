import { IAIProvider } from './providers/IAIProvider';
import { PromptCompiler } from './PromptCompiler';
import { ConversationPlanner } from './ConversationPlanner';
import { ContextBuilder } from './ContextBuilder';
import { ResponseParser } from './ResponseParser';
import { SchemaValidator } from './SchemaValidator';
import { SafetyLayer } from './SafetyLayer';
import { TokenEstimator } from './TokenEstimator';
import { CostCalculator } from './CostCalculator';
import { AIResponseDTO } from './DTOs';
import { AIError } from './errors/AIErrors';

export class AIOrchestrator {
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly provider: IAIProvider,
    private readonly compiler: PromptCompiler,
    private readonly planner: ConversationPlanner,
    private readonly contextBuilder: ContextBuilder,
    private readonly parser: ResponseParser,
    private readonly validator: SchemaValidator,
    private readonly safety: SafetyLayer,
    private readonly tokenEstimator: TokenEstimator,
    private readonly costCalculator: CostCalculator
  ) {}

  public async orchestrate(
    assessmentResult: any,
    missingQuestions: any[],
    conversationHistory: any[],
    templateId: string = 'gemini-interviewer-v1',
    providerName: string = 'gemini-1.5-pro'
  ): Promise<AIResponseDTO> {
    
    // 1. Planning: What are we trying to accomplish?
    const targetQuestion = this.planner.determineNextQuestion(missingQuestions);

    // 2. Context Building: Assemble state
    const variables = this.contextBuilder.buildVariables(
      assessmentResult.assessment,
      missingQuestions,
      targetQuestion,
      conversationHistory
    );

    // 3. Compiling: Render the exact string to send
    const systemPrompt = this.compiler.compile(templateId, variables);
    const userPrompt = conversationHistory.length > 0 
      ? conversationHistory[conversationHistory.length - 1].content 
      : 'Hello, I am ready to start.';

    // 4. Pre-computation estimates
    const tokens = this.tokenEstimator.estimateTokens(systemPrompt + userPrompt, 500);

    let attempt = 0;
    let lastError: any;
    let totalLatency = 0;

    // 5. Execution Loop (Retry Strategy)
    while (attempt < this.MAX_RETRIES) {
      attempt++;
      try {
        const response = await this.provider.generateResponse({
          systemPrompt,
          userPrompt,
          responseFormat: 'json_object'
        });

        totalLatency += response.latencyMs;

        // 6. Parsing & Validation
        const rawJson = this.parser.parseJson(response.rawResponse);
        const validatedPayload = this.validator.validate(rawJson);
        const safePayload = this.safety.sanitize(validatedPayload, targetQuestion);

        // 7. Cost Calculation
        const cost = this.costCalculator.calculateCost(
          providerName,
          providerName,
          response.providerTokens.prompt,
          response.providerTokens.completion
        );

        return {
          success: true,
          action: safePayload.action,
          message: safePayload.message,
          structuredData: safePayload.structuredData || {},
          metrics: {
            latencyMs: totalLatency,
            tokens: {
              estimatedPromptTokens: response.providerTokens.prompt,
              estimatedCompletionTokens: response.providerTokens.completion
            },
            cost,
            retries: attempt - 1,
            provider: providerName,
            promptVersion: '1.0' // Should pull from compiler ideally
          }
        };

      } catch (error: any) {
        lastError = error;
        // If it's an unrecoverable error, break immediately
        if (error instanceof AIError && !error.isRecoverable) {
          break;
        }
        console.warn(`[AI Orchestrator] Attempt ${attempt} failed: ${error.message}. Retrying...`);
      }
    }

    // 8. Graceful Failure
    return {
      success: false,
      message: `I'm having trouble processing that. Please try again. (${lastError?.message})`,
      action: 'CLARIFY',
      structuredData: {},
      metrics: {
        latencyMs: totalLatency,
        tokens,
        cost: { estimatedCostUsd: 0, provider: providerName, model: providerName },
        retries: attempt,
        provider: providerName,
        promptVersion: 'unknown'
      }
    };
  }
}
