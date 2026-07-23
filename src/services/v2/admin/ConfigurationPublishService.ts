import { IVersionRepository, IAuditLogService } from './interfaces';
import { ConfigurationValidationService } from './ConfigurationValidationService';

export class ConfigurationPublishService {
  constructor(
    private readonly versionRepo: IVersionRepository,
    private readonly validationService: ConfigurationValidationService,
    private readonly audit: IAuditLogService
  ) {}

  public async publishDraft(userId: string): Promise<string> {
    const draftData = await this.versionRepo.getDraftVersion();
    
    // 1. Strict Pre-flight Validation
    const validation = await this.validationService.validateDraft(
      draftData.grants,
      draftData.rules,
      draftData.ruleGroups,
      draftData.questions
    );

    if (!validation.isValid) {
      throw new Error(`Publish failed due to validation errors: ${validation.report.join(', ')}`);
    }

    // 2. Atomic Transaction: Create immutable snapshot
    const newVersionId = await this.versionRepo.createVersionSnapshot(draftData);

    // 3. Set Active Pointer
    await this.versionRepo.setActiveVersion(newVersionId);

    // 4. Audit
    await this.audit.log('PUBLISH', 'SYSTEM_VERSION', newVersionId, {}, userId);

    return newVersionId;
  }
}
