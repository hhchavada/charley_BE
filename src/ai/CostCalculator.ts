import { IAICostEstimation } from './interfaces';

export class CostCalculator {
  // Hardcoded rates for demonstration. Production should fetch from config.
  private readonly rates: Record<string, { prompt: number; completion: number }> = {
    'gemini-1.5-pro': {
      prompt: 0.0000035, // per token
      completion: 0.0000105
    }
  };

  public calculateCost(provider: string, model: string, promptTokens: number, completionTokens: number): IAICostEstimation {
    const rate = this.rates[model] || this.rates['gemini-1.5-pro'];
    
    const cost = (promptTokens * rate.prompt) + (completionTokens * rate.completion);

    return {
      estimatedCostUsd: Number(cost.toFixed(6)),
      provider,
      model
    };
  }
}
