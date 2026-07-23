"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCacheBuilder = void 0;
class ConfigurationCacheBuilder {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Queries the database, resolves all nested references, and builds the monolithic bundle.
     */
    async build(versionId) {
        const startTime = performance.now();
        // In a real implementation, these would perform heavy aggregations / recursive lookups
        const [grants, questionFlows, promptTemplates, systemConfigs] = await Promise.all([
            this.repository.fetchActiveGrants(versionId),
            this.repository.fetchQuestionFlows(versionId),
            this.repository.fetchPromptTemplates(versionId),
            this.repository.fetchSystemConfigs(versionId)
        ]);
        const configuration = {
            grants,
            questionFlows,
            promptTemplates,
            systemConfigs
        };
        // Calculate diagnostics
        let ruleCount = 0;
        let questionCount = 0;
        // Simple heuristic for counting
        const traverse = (node) => {
            if (!node)
                return;
            if (node.rules)
                ruleCount += node.rules.length;
            if (node.rules) {
                node.rules.forEach((r) => {
                    if (r.question)
                        questionCount++;
                });
            }
            if (node.nestedGroups)
                node.nestedGroups.forEach(traverse);
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
exports.ConfigurationCacheBuilder = ConfigurationCacheBuilder;
