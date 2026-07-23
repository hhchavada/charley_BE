import { MemoryCacheProvider } from '../MemoryCacheProvider';
import { ConfigurationCacheBuilder, IConfigRepository } from '../ConfigurationCacheBuilder';
import { ConfigurationCacheValidator } from '../ConfigurationCacheValidator';
import { ConfigurationCacheLoader } from '../ConfigurationCacheLoader';
import { ConfigurationInvalidator } from '../ConfigurationInvalidator';

describe('Enterprise Configuration Cache Layer', () => {
  let provider: MemoryCacheProvider;
  let mockRepo: jest.Mocked<IConfigRepository>;
  let builder: ConfigurationCacheBuilder;
  let validator: ConfigurationCacheValidator;
  let loader: ConfigurationCacheLoader;
  let invalidator: ConfigurationInvalidator;

  const mockGrant = {
    grantId: 'g1',
    ruleGroup: {
      groupId: 'rg1',
      rules: [{ ruleId: 'r1', question: {} }],
      nestedGroups: []
    }
  } as any;

  beforeEach(() => {
    provider = new MemoryCacheProvider();
    
    mockRepo = {
      fetchActiveGrants: jest.fn().mockResolvedValue([mockGrant]),
      fetchQuestionFlows: jest.fn().mockResolvedValue([]),
      fetchPromptTemplates: jest.fn().mockResolvedValue({}),
      fetchSystemConfigs: jest.fn().mockResolvedValue({})
    };

    builder = new ConfigurationCacheBuilder(mockRepo);
    validator = new ConfigurationCacheValidator();
    loader = new ConfigurationCacheLoader(provider, builder, validator, 'latest');
    invalidator = new ConfigurationInvalidator(provider);
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
        rules: [{ /* missing ruleId */ }]
      }
    }] as any);

    await expect(loader.loadActiveConfiguration('v1')).rejects.toThrow('Cache Validation Failed: Rule missing ID');
    
    // Because it failed validation, it should NOT be cached
    const bundle = await provider.get('v1');
    expect(bundle).toBeNull();
  });
});
