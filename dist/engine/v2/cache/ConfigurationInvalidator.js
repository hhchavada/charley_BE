"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationInvalidator = void 0;
class ConfigurationInvalidator {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * Invoked by the PublishService when a new configuration version goes live.
     * Flushes the old version from cache so it will be rebuilt on the next request.
     */
    async invalidate(versionId) {
        await this.provider.delete(versionId);
    }
    /**
     * Flushes all cached configurations. Useful for catastrophic resets.
     */
    async invalidateAll() {
        await this.provider.clear();
    }
}
exports.ConfigurationInvalidator = ConfigurationInvalidator;
