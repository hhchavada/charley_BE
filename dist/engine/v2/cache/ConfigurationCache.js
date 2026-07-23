"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCache = void 0;
class ConfigurationCache {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * Health Check endpoint service exposing cache diagnostic data.
     */
    async getDiagnostics(versionId) {
        const providerStats = await this.provider.getDiagnostics();
        const bundle = await this.provider.get(versionId);
        return {
            status: bundle ? 'LOADED' : 'MISSING',
            version: versionId,
            loadedAt: bundle?.metadata.loadedAt || null,
            grantCount: bundle?.metadata.grantCount || 0,
            ruleCount: bundle?.metadata.ruleCount || 0,
            questionCount: bundle?.metadata.questionCount || 0,
            buildTimeMs: bundle?.metadata.buildTimeMs || 0,
            providerDiagnostics: providerStats
        };
    }
}
exports.ConfigurationCache = ConfigurationCache;
