import { ConfigurationBundle, GrantGraph } from '../config/interfaces';
import { CacheBundle } from './interfaces';

export interface IConfigRepository {
  fetchActiveGrants(versionId: string): Promise<GrantGraph[]>;
  fetchQuestionFlows(versionId: string): Promise<any[]>;
  fetchPromptTemplates(versionId: string): Promise<any>;
  fetchSystemConfigs(versionId: string): Promise<any>;
}

export class ConfigurationCacheBuilder {
  constructor(private readonly repository: IConfigRepository) {}

  /**
   * Queries the database, resolves all nested references, and builds the monolithic bundle.
   */
  public async build(versionId: string): Promise<CacheBundle> {
    const startTime = performance.now();

    // In a real implementation, these would perform heavy aggregations / recursive lookups
    const [grants, questionFlows, promptTemplates, systemConfigs] = await Promise.all([
      this.repository.fetchActiveGrants(versionId),
      this.repository.fetchQuestionFlows(versionId),
      this.repository.fetchPromptTemplates(versionId),
      this.repository.fetchSystemConfigs(versionId)
    ]);

    const configuration: ConfigurationBundle = {
      grants,
      questionFlows,
      promptTemplates,
      systemConfigs
    };

    // Calculate diagnostics
    let ruleCount = 0;
    let questionCount = 0;
    
    // Simple heuristic for counting
    const traverse = (node: any) => {
      if (!node) return;
      if (node.rules) ruleCount += node.rules.length;
      if (node.rules) {
        node.rules.forEach((r: any) => {
          if (r.question) questionCount++;
        });
      }
      if (node.nestedGroups) node.nestedGroups.forEach(traverse);
    };

    grants.forEach(g => traverse(g.ruleGroup));

    return {
      metadata: {
        versionId,
        loadedAt: new Date(),
        buildTimeMs: performance.now() - startTime,
        grantCount: grants.length,
        ruleCount,
        questionCount
      },
      configuration
    };
  }
}
