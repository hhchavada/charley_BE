import { IVersionRepository, IAuditLogService } from './interfaces';

export class RollbackService {
  constructor(
    private readonly versionRepo: IVersionRepository,
    private readonly audit: IAuditLogService
  ) {}

  /**
   * Instantly rolls back the live engine to a previous configuration snapshot.
   * Because snapshots are immutable, no data is lost; we just move the active pointer.
   */
  public async rollback(targetVersionId: string, userId: string, reason: string): Promise<void> {
    const currentActive = await this.versionRepo.getActiveVersion();
    
    if (currentActive === targetVersionId) {
      throw new Error(`System is already running on version ${targetVersionId}`);
    }

    await this.versionRepo.setActiveVersion(targetVersionId);
    
    await this.audit.log('ROLLBACK', 'SYSTEM_VERSION', targetVersionId, { 
      fromVersion: currentActive,
      reason 
    }, userId);
  }
}
