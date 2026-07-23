import { Version } from '../../../../models/v2/Version';
import { VersionDTO } from '../dto';

export class VersionManager {
  /**
   * Creates a new frozen snapshot version of any configuration entity
   */
  static async createSnapshot(
    entityType: VersionDTO['entityType'],
    entityId: string,
    snapshot: Record<string, any>
  ): Promise<VersionDTO> {
    
    // Find latest version number
    const latest = await Version.findOne({ entityId, entityType })
      .sort({ versionNumber: -1 })
      .select('versionNumber')
      .lean();

    const nextVersion = latest ? latest.versionNumber + 1 : 1;

    const newVersion = await Version.create({
      entityType,
      entityId,
      versionNumber: nextVersion,
      snapshot
    });

    return newVersion.toObject();
  }

  /**
   * Retrieves a specific version of an entity, used for locking assessments
   */
  static async getSnapshot(entityId: string, versionNumber: number): Promise<VersionDTO | null> {
    return Version.findOne({ entityId, versionNumber }).lean<VersionDTO>();
  }
}
