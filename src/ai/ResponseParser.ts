import { SchemaValidationError } from './errors/AIErrors';

export class ResponseParser {
  /**
   * Safely extracts JSON from a raw AI string which might be wrapped in markdown.
   */
  public parseJson(raw: string): any {
    let clean = raw.trim();

    // Remove markdown code blocks if present
    if (clean.startsWith('```')) {
      const firstNewline = clean.indexOf('\n');
      if (firstNewline !== -1) {
        clean = clean.substring(firstNewline + 1);
      }
      if (clean.endsWith('```')) {
        clean = clean.substring(0, clean.length - 3);
      }
    }

    try {
      return JSON.parse(clean.trim());
    } catch (error) {
      throw new SchemaValidationError('Response is not valid JSON.', { raw });
    }
  }
}
