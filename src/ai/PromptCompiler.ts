import { PromptVersionManager } from './PromptVersionManager';
import { PromptRenderer } from './PromptRenderer';

export class PromptCompiler {
  constructor(
    private readonly versionManager: PromptVersionManager,
    private readonly renderer: PromptRenderer
  ) {}

  public compile(templateId: string, variables: Record<string, string>, version?: string): string {
    const template = this.versionManager.getActiveTemplate(templateId, version);
    return this.renderer.render(template, variables);
  }
}
