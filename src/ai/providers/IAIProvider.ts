import { AIProviderRequest, AIProviderResponse } from '../interfaces';

export interface IAIProvider {
  /**
   * Generates a response from the underlying AI model.
   * 
   * This is the ONLY method the AI provider should expose.
   * It handles the network request, the retry handshake, and returns the raw response.
   */
  generateResponse(request: AIProviderRequest): Promise<AIProviderResponse>;
}
