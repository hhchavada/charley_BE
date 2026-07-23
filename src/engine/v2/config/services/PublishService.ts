import { ConfigurationLoader } from '../loaders/ConfigurationLoader';
import { ConfigurationValidator } from '../validators/ConfigurationValidator';
import { VersionManager } from './VersionManager';
import { AuditLog } from '../../../../models/v2/AuditLog';

export class PublishService {
  /**
   * Validates the current drafted/active config and creates immutable snapshots.
   */
  static async publishConfiguration(adminId: string): Promise<{ success: boolean; errors?: string[] }> {
    // 1. Load current configuration from DB
    const bundle = await ConfigurationLoader.loadActiveConfiguration();

    // 2. Validate configuration
    const report = ConfigurationValidator.validate(bundle);
    
    if (!report.isValid) {
      return { success: false, errors: report.errors };
    }

    // 3. Freeze & Snapshot all grants (for simplicity, assuming we version Grants here)
    for (const grant of bundle.grants) {
      await VersionManager.createSnapshot('GRANT', grant.grantId, grant);
    }

    // 4. Audit Log
    await AuditLog.create({
      adminId,
      action: 'UPDATE',
      entityType: 'SYSTEM_CONFIG',
      entityId: 'ALL',
      changes: { action: 'Published full configuration bundle' },
      timestamp: new Date()
    });

    // In a real system, we might push the bundle to Redis here to activate it instantly.
    
    return { success: true };
  }
}
