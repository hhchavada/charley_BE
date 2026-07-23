export class AIError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly isRecoverable: boolean = false,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class SchemaValidationError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'SCHEMA_VALIDATION_FAILED', true, details);
    this.name = 'SchemaValidationError';
  }
}

export class ProviderTimeoutError extends AIError {
  constructor(provider: string) {
    super(`Provider ${provider} timed out.`, 'PROVIDER_TIMEOUT', true);
    this.name = 'ProviderTimeoutError';
  }
}

export class HallucinationError extends AIError {
  constructor(message: string) {
    super(message, 'HALLUCINATION_DETECTED', true);
    this.name = 'HallucinationError';
  }
}
