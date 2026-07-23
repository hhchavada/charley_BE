"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbackService = void 0;
class RollbackService {
    versionRepo;
    audit;
    constructor(versionRepo, audit) {
        this.versionRepo = versionRepo;
        this.audit = audit;
    }
    /**
     * Instantly rolls back the live engine to a previous configuration snapshot.
     * Because snapshots are immutable, no data is lost; we just move the active pointer.
     */
    async rollback(targetVersionId, userId, reason) {
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
exports.RollbackService = RollbackService;
