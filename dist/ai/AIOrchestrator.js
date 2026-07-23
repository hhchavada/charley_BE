"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestrator = void 0;
const AIErrors_1 = require("./errors/AIErrors");
class AIOrchestrator {
    provider;
    compiler;
    planner;
    contextBuilder;
    parser;
    validator;
    safety;
    tokenEstimator;
    costCalculator;
    MAX_RETRIES = 3;
    constructor(provider, compiler, planner, contextBuilder, parser, validator, safety, tokenEstimator, costCalculator) {
        this.provider = provider;
        this.compiler = compiler;
        this.planner = planner;
        this.contextBuilder = contextBuilder;
        this.parser = parser;
        this.validator = validator;
        this.safety = safety;
        this.tokenEstimator = tokenEstimator;
        this.costCalculator = costCalculator;
    }
    async orchestrate(assessmentResult, missingQuestions, conversationHistory, templateId = 'gemini-interviewer-v1', providerName = 'gemini-1.5-pro') {
        // 1. Planning: What are we trying to accomplish?
        const targetQuestion = this.planner.determineNextQuestion(missingQuestions);
        // 2. Context Building: Assemble state
        const variables = this.contextBuilder.buildVariables(assessmentResult.assessment, missingQuestions, targetQuestion, conversationHistory);
        // 3. Compiling: Render the exact string to send
        const systemPrompt = this.compiler.compile(templateId, variables);
        const userPrompt = conversationHistory.length > 0
            ? conversationHistory[conversationHistory.length - 1].content
            : 'Hello, I am ready to start.';
        // 4. Pre-computation estimates
        const tokens = this.tokenEstimator.estimateTokens(systemPrompt + userPrompt, 500);
        let attempt = 0;
        let lastError;
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
                const cost = this.costCalculator.calculateCost(providerName, providerName, response.providerTokens.prompt, response.providerTokens.completion);
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
            }
            catch (error) {
                lastError = error;
                // If it's an unrecoverable error, break immediately
                if (error instanceof AIErrors_1.AIError && !error.isRecoverable) {
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
exports.AIOrchestrator = AIOrchestrator;
