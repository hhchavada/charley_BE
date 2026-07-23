import { IAIProvider } from './IAIProvider';
import { AIProviderRequest, AIProviderResponse } from '../interfaces';
import { ProviderTimeoutError, AIError } from '../errors/AIErrors';

export class GeminiProvider implements IAIProvider {
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || 'MOCK_KEY', modelName: string = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  public async generateResponse(request: AIProviderRequest): Promise<AIProviderResponse> {
    const startTime = performance.now();
    
    // Safety check - do not actually hit real API if in mock mode for testing
    if (this.apiKey === 'MOCK_KEY') {
      return this.mockExecution(request, startTime);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      
      const payload = {
        contents: [
          { role: 'user', parts: [{ text: request.systemPrompt + '\n\n' + request.userPrompt }] }
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 2000,
          responseMimeType: request.responseFormat === 'json_object' ? 'application/json' : 'text/plain'
        }
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new AIError(`Gemini API Error: ${response.statusText}`, 'API_ERROR', true);
      }

      const data: any = await response.json();
      
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        rawResponse: rawText,
        finishReason: data.candidates?.[0]?.finishReason || 'STOP',
        providerTokens: {
          prompt: data.usageMetadata?.promptTokenCount || 0,
          completion: data.usageMetadata?.candidatesTokenCount || 0,
          total: data.usageMetadata?.totalTokenCount || 0
        },
        latencyMs: performance.now() - startTime
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ProviderTimeoutError('Gemini');
      }
      throw new AIError(error.message, 'PROVIDER_FAILED', true);
    }
  }

  private async mockExecution(request: AIProviderRequest, startTime: number): Promise<AIProviderResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Return a mocked JSON structure for tests
    const mockJson = {
      action: 'ASK_QUESTION',
      message: 'Can you provide more details?',
      structuredData: {
        questionId: 'mock_q1'
      }
    };

    return {
      rawResponse: JSON.stringify(mockJson),
      finishReason: 'STOP',
      providerTokens: { prompt: 100, completion: 50, total: 150 },
      latencyMs: performance.now() - startTime
    };
  }
}
