"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationPublishService = void 0;
class ConfigurationPublishService {
    versionRepo;
    validationService;
    audit;
    constructor(versionRepo, validationService, audit) {
        this.versionRepo = versionRepo;
        this.validationService = validationService;
        this.audit = audit;
    }
    async publishDraft(userId) {
        const draftData = await this.versionRepo.getDraftVersion();
        // 1. Strict Pre-flight Validation
        const validation = await this.validationService.validateDraft(draftData.grants, draftData.rules, draftData.ruleGroups, draftData.questions);
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
exports.ConfigurationPublishService = ConfigurationPublishService;
