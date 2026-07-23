import { IConfigurationLoader } from '../interfaces/dependencies';
import { ConfigurationBundle } from '../config/interfaces';
import { ICacheProvider } from './interfaces';
import { ConfigurationCacheBuilder } from './ConfigurationCacheBuilder';
import { ConfigurationCacheValidator } from './ConfigurationCacheValidator';

export class ConfigurationCacheLoader implements IConfigurationLoader {
  // A local lock to prevent multiple concurrent builds of the same version
  private pendingBuilds = new Map<string, Promise<ConfigurationBundle>>();

  constructor(
    private readonly provider: ICacheProvider,
    private readonly builder: ConfigurationCacheBuilder,
    private readonly validator: ConfigurationCacheValidator,
    private readonly defaultVersionId: string = 'latest'
  ) {}

  public async loadActiveConfiguration(versionId?: string): Promise<ConfigurationBundle> {
    const targetVersion = versionId || this.defaultVersionId;

    // 1. Try Cache First
    const cached = await this.provider.get(targetVersion);
    if (cached) {
      return cached.configuration;
    }

    // 2. Prevent Thundering Herd (Concurrent cache misses building the same bundle)
    if (this.pendingBuilds.has(targetVersion)) {
      return this.pendingBuilds.get(targetVersion)!;
    }

    // 3. Build & Cache
    const buildPromise = this.buildAndCache(targetVersion);
    this.pendingBuilds.set(targetVersion, buildPromise);

    try {
      return await buildPromise;
    } finally {
      this.pendingBuilds.delete(targetVersion);
    }
  }

  private async buildAndCache(versionId: string): Promise<ConfigurationBundle> {
    const bundle = await this.builder.build(versionId);
    
    this.validator.validate(bundle);
    
    await this.provider.set(versionId, bundle);
    
    return bundle.configuration;
  }
}
