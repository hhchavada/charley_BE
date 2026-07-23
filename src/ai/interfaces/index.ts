export interface AIProviderRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}

export interface AIProviderResponse {
  rawResponse: string;
  finishReason: string;
  providerTokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
}

export interface IAITokenEstimation {
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
}

export interface IAICostEstimation {
  estimatedCostUsd: number;
  provider: string;
  model: string;
}

export interface PromptTemplateDef {
  templateId: string;
  version: string;
  systemPrompt: string;
  variables: string[];
}
