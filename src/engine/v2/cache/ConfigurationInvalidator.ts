import { ICacheProvider } from './interfaces';

export class ConfigurationInvalidator {
  constructor(private readonly provider: ICacheProvider) {}

  /**
   * Invoked by the PublishService when a new configuration version goes live.
   * Flushes the old version from cache so it will be rebuilt on the next request.
   */
  public async invalidate(versionId: string): Promise<void> {
    await this.provider.delete(versionId);
  }

  /**
   * Flushes all cached configurations. Useful for catastrophic resets.
   */
  public async invalidateAll(): Promise<void> {
    await this.provider.clear();
  }
}
