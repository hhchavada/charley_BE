import { ICacheProvider, CacheBundle } from './interfaces';

export class MemoryCacheProvider implements ICacheProvider {
  private readonly store = new Map<string, CacheBundle>();

  public async get(versionId: string): Promise<CacheBundle | null> {
    return this.store.get(versionId) || null;
  }

  public async set(versionId: string, bundle: CacheBundle): Promise<void> {
    this.store.set(versionId, bundle);
  }

  public async delete(versionId: string): Promise<void> {
    this.store.delete(versionId);
  }

  public async clear(): Promise<void> {
    this.store.clear();
  }

  public async getDiagnostics(): Promise<any> {
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
