"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCacheProvider = void 0;
class MemoryCacheProvider {
    store = new Map();
    async get(versionId) {
        return this.store.get(versionId) || null;
    }
    async set(versionId, bundle) {
        this.store.set(versionId, bundle);
    }
    async delete(versionId) {
        this.store.delete(versionId);
    }
    async clear() {
        this.store.clear();
    }
    async getDiagnostics() {
        const activeVersions = Array.from(this.store.keys());
        let estimatedMemoryBytes = 0;
        // Very rough heuristic for object size in JS
        for (const bundle of this.store.values()) {
            estimatedMemoryBytes += JSON.stringify(bundle).length * 2; // ~2 bytes per char
        }
        return {
            provider: 'MemoryCacheProvider',
            activeVersions,
            totalCachedVersions: activeVersions.length,
            estimatedMemoryUsageMb: (estimatedMemoryBytes / 1024 / 1024).toFixed(2)
        };
    }
}
exports.MemoryCacheProvider = MemoryCacheProvider;
