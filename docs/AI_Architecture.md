# AI Orchestration Layer Architecture

The Grant Engine V2 AI Layer is a completely decoupled, provider-agnostic orchestration system. It ensures that the core Business Engine never communicates directly with LLMs (like Gemini or OpenAI), and strictly enforces that AI models **never** make eligibility or financial decisions.

## Responsibilities

- **Grant Engine**: Calculates eligibility, merges streams, buckets grants into `readyNow` or `prepareNext`, and extracts missing questions.
- **AI Orchestration Layer**: Receives the missing questions, formats a prompt, securely queries an LLM, validates the structured output, and returns the next conversation step to the user.

## Provider Pattern

The system uses the `IAIProvider` interface. This allows us to hot-swap LLM providers without touching the core engine.
Currently, `GeminiProvider` is implemented using Node's native `fetch` to Google's REST API, but it can be seamlessly replaced with an `OpenAIProvider` or `ClaudeProvider`.

## Execution Pipeline

1. **Conversation Planner**: Scans the `MissingDataBundle` and selects the single most impactful question to ask next based on priority and affected grant count.
2. **Context Builder**: Flattens the Grant Context, Session State, and Conversation History into variables.
3. **Prompt Compiler & Renderer**: Loads a version-controlled prompt template (`PromptVersionManager`) and injects the variables.
4. **Execution (Retry Loop)**: The orchestrator invokes the `IAIProvider`. It wraps this in a `while` loop (max 3 retries).
5. **Response Parser**: Strips markdown formatting (e.g., ` ```json ` blocks) from the raw LLM output.
6. **Schema Validator (Zod)**: Enforces that the output is exactly structurally sound. If it fails Zod validation, a `SchemaValidationError` is thrown, which immediately triggers the orchestrator retry loop.
7. **Safety Layer**: Scans for hallucinated question IDs or prompt injection keywords ("ignore previous instructions"). If found, throws a `HallucinationError` (triggering a retry or graceful failure).
8. **Token & Cost Estimation**: Logs the estimated token usage and US dollar cost per transaction for observability.

## Strict Structured Output

AI models in this system are **banned** from returning conversational plaintext. They must return a strict JSON payload:
```json
{
  "action": "ASK_QUESTION",
  "message": "Can you clarify your annual revenue?",
  "structuredData": {
    "questionId": "q_revenue_annual"
  }
}
```
If the LLM breaks this schema, the `SchemaValidator` rejects it.

## Future RAG Integration

The architecture is pre-wired to support RAG (Retrieval-Augmented Generation). The `TargetQuestion` DTOs passed from the Grant Engine contain `knowledgeBaseReference` and `embeddingId` placeholders. In the future, the `ContextBuilder` can use these IDs to query a vector database and append similarity-matched chunks directly into the prompt variables before compilation.
