"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculator = void 0;
class CostCalculator {
    // Hardcoded rates for demonstration. Production should fetch from config.
    rates = {
        'gemini-1.5-pro': {
            prompt: 0.0000035, // per token
            completion: 0.0000105
        }
    };
    calculateCost(provider, model, promptTokens, completionTokens) {
        const rate = this.rates[model] || this.rates['gemini-1.5-pro'];
        const cost = (promptTokens * rate.prompt) + (completionTokens * rate.completion);
        return {
            estimatedCostUsd: Number(cost.toFixed(6)),
            provider,
            model
        };
    }
}
exports.CostCalculator = CostCalculator;
