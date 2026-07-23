"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheProvider = void 0;
class RedisCacheProvider {
    redisClient;
    constructor(redisClient) {
        this.redisClient = redisClient;
        if (!redisClient) {
            console.warn('Redis client not provided. RedisCacheProvider is running in degraded mode.');
        }
    }
    async get(versionId) {
        throw new Error('RedisCacheProvider not fully implemented in this phase. Use MemoryCacheProvider.');
    }
    async set(versionId, bundle) {
        throw new Error('RedisCacheProvider not fully implemented in this phase.');
    }
    async delete(versionId) {
        throw new Error('RedisCacheProvider not fully implemented in this phase.');
    }
    async clear() {
        throw new Error('RedisCacheProvider not fully implemented in this phase.');
    }
    async getDiagnostics() {
        return {
            provider: 'RedisCacheProvider',
            status: 'NOT_IMPLEMENTED'
        };
    }
}
exports.RedisCacheProvider = RedisCacheProvider;
