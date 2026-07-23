"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptRenderer = void 0;
class PromptRenderer {
    /**
     * Replaces {{variable}} placeholders in the template with actual values.
     */
    render(template, variables) {
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
exports.PromptRenderer = PromptRenderer;
