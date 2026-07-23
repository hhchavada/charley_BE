"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MemoryCacheProvider_1 = require("../MemoryCacheProvider");
const ConfigurationCacheBuilder_1 = require("../ConfigurationCacheBuilder");
const ConfigurationCacheValidator_1 = require("../ConfigurationCacheValidator");
const ConfigurationCacheLoader_1 = require("../ConfigurationCacheLoader");
const ConfigurationInvalidator_1 = require("../ConfigurationInvalidator");
describe('Enterprise Configuration Cache Layer', () => {
    let provider;
    let mockRepo;
    let builder;
    let validator;
    let loader;
    let invalidator;
    const mockGrant = {
        grantId: 'g1',
        ruleGroup: {
            groupId: 'rg1',
            rules: [{ ruleId: 'r1', question: {} }],
            nestedGroups: []
        }
    };
    beforeEach(() => {
        provider = new MemoryCacheProvider_1.MemoryCacheProvider();
        mockRepo = {
            fetchActiveGrants: jest.fn().mockResolvedValue([mockGrant]),
            fetchQuestionFlows: jest.fn().mockResolvedValue([]),
            fetchPromptTemplates: jest.fn().mockResolvedValue({}),
            fetchSystemConfigs: jest.fn().mockResolvedValue({})
        };
        builder = new ConfigurationCacheBuilder_1.ConfigurationCacheBuilder(mockRepo);
        validator = new ConfigurationCacheValidator_1.ConfigurationCacheValidator();
        loader = new ConfigurationCacheLoader_1.ConfigurationCacheLoader(provider, builder, validator, 'latest');
        invalidator = new ConfigurationInvalidator_1.ConfigurationInvalidator(provider);
    });
    it('ConfigurationCacheLoader queries DB only ONCE per version (Cache Hit)', async () => {
        // Request 1: Should hit DB
        await loader.loadActiveConfiguration('v1');
        expect(mockRepo.fetchActiveGrants).toHaveBeenCalledTimes(1);
        // Request 2: Should hit memory cache
        const cachedConfig = await loader.loadActiveConfiguration('v1');
        expect(mockRepo.fetchActiveGrants).toHaveBeenCalledTimes(1);
        expect(cachedConfig.grants[0].grantId).toBe('g1');
    });
    it('ConfigurationCacheLoader prevents Thundering Herd (concurrent builds)', async () => {
        // Simulate slow DB query
        mockRepo.fetchActiveGrants.mockImplementation(async () => {
            await new Promise(r => setTimeout(r, 50));
            return [mockGrant];
        });
        // Fire 5 requests simultaneously
        await Promise.all([
            loader.loadActiveConfiguration('v1'),
            loader.loadActiveConfiguration('v1'),
            loader.loadActiveConfiguration('v1'),
            loader.loadActiveConfiguration('v1'),
            loader.loadActiveConfiguration('v1')
        ]);
        // DB should only be queried exactly ONCE despite 5 concurrent requests
        expect(mockRepo.fetchActiveGrants).toHaveBeenCalledTimes(1);
    });
    it('ConfigurationInvalidator flushes cache forcing a rebuild', async () => {
        await loader.loadActiveConfiguration('v1');
        expect(mockRepo.fetchActiveGrants).toHaveBeenCalledTimes(1);
        // Invalidate
        await invalidator.invalidate('v1');
        // Request again: Should hit DB
        await loader.loadActiveConfiguration('v1');
        expect(mockRepo.fetchActiveGrants).toHaveBeenCalledTimes(2);
    });
    it('ConfigurationCacheValidator rejects structurally broken bundles', async () => {
        mockRepo.fetchActiveGrants.mockResolvedValueOnce([{
                grantId: 'bad_grant',
                ruleGroup: {
                    rules: [{ /* missing ruleId */}]
                }
            }]);
        await expect(loader.loadActiveConfiguration('v1')).rejects.toThrow('Cache Validation Failed: Rule missing ID');
        // Because it failed validation, it should NOT be cached
        const bundle = await provider.get('v1');
        expect(bundle).toBeNull();
    });
});
