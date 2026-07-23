import { ISessionStatsRepository } from './interfaces';

export class ImpactAnalysisService {
  constructor(private readonly sessionStatsRepo: ISessionStatsRepository) {}

  /**
   * Calculates the operational impact of publishing the current Draft configuration.
   */
  public async analyze(
    activeVersionId: string,
    draftGrants: any[],
    draftRules: any[]
  ): Promise<any> {
    
    // In a real scenario, this would compare the draft array against the active array
    // using a deep diff to find exactly what changed.
    const affectedGrants = draftGrants.filter(g => g.updatedAt > g.lastPublishedAt).length;
    const affectedRules = draftRules.filter(r => r.updatedAt > r.lastPublishedAt).length;
    
    const activeSessions = await this.sessionStatsRepo.getActiveSessionsCount(activeVersionId);

    return {
      affectedGrants,
      affectedRules,
      activeSessionsOnOldVersion: activeSessions,
      warning: activeSessions > 100 
        ? `Warning: ${activeSessions} users are actively completing assessments on the old version.` 
        : 'Safe to publish'
    };
  }
}
