import { PromptTemplateDef } from './interfaces';

export class PromptRenderer {
  /**
   * Replaces {{variable}} placeholders in the template with actual values.
   */
  public render(template: PromptTemplateDef, variables: Record<string, string>): string {
    let rendered = template.systemPrompt;
    
    for (const variable of template.variables) {
      const value = variables[variable] || '';
      // Safe regex replacement for multiple occurrences
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value);
    }
    
    return rendered;
  }
}
