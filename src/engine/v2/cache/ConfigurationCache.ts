import { ICacheProvider } from './interfaces';

export class ConfigurationCache {
  constructor(private readonly provider: ICacheProvider) {}

  /**
   * Health Check endpoint service exposing cache diagnostic data.
   */
  public async getDiagnostics(versionId: string): Promise<any> {
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
