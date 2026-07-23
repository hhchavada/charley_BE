"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCacheLoader = void 0;
class ConfigurationCacheLoader {
    provider;
    builder;
    validator;
    defaultVersionId;
    // A local lock to prevent multiple concurrent builds of the same version
    pendingBuilds = new Map();
    constructor(provider, builder, validator, defaultVersionId = 'latest') {
        this.provider = provider;
        this.builder = builder;
        this.validator = validator;
        this.defaultVersionId = defaultVersionId;
    }
    async loadActiveConfiguration(versionId) {
        const targetVersion = versionId || this.defaultVersionId;
        // 1. Try Cache First
        const cached = await this.provider.get(targetVersion);
        if (cached) {
            return cached.configuration;
        }
        // 2. Prevent Thundering Herd (Concurrent cache misses building the same bundle)
        if (this.pendingBuilds.has(targetVersion)) {
            return this.pendingBuilds.get(targetVersion);
        }
        // 3. Build & Cache
        const buildPromise = this.buildAndCache(targetVersion);
        this.pendingBuilds.set(targetVersion, buildPromise);
        try {
            return await buildPromise;
        }
        finally {
            this.pendingBuilds.delete(targetVersion);
        }
    }
    async buildAndCache(versionId) {
        const bundle = await this.builder.build(versionId);
        this.validator.validate(bundle);
        await this.provider.set(versionId, bundle);
        return bundle.configuration;
    }
}
exports.ConfigurationCacheLoader = ConfigurationCacheLoader;
