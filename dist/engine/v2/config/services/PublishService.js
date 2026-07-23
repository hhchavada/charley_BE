"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishService = void 0;
const ConfigurationLoader_1 = require("../loaders/ConfigurationLoader");
const ConfigurationValidator_1 = require("../validators/ConfigurationValidator");
const VersionManager_1 = require("./VersionManager");
const AuditLog_1 = require("../../../../models/v2/AuditLog");
class PublishService {
    /**
     * Validates the current drafted/active config and creates immutable snapshots.
     */
    static async publishConfiguration(adminId) {
        // 1. Load current configuration from DB
        const bundle = await ConfigurationLoader_1.ConfigurationLoader.loadActiveConfiguration();
        // 2. Validate configuration
        const report = ConfigurationValidator_1.ConfigurationValidator.validate(bundle);
        if (!report.isValid) {
            return { success: false, errors: report.errors };
        }
        // 3. Freeze & Snapshot all grants (for simplicity, assuming we version Grants here)
        for (const grant of bundle.grants) {
            await VersionManager_1.VersionManager.createSnapshot('GRANT', grant.grantId, grant);
        }
        // 4. Audit Log
        await AuditLog_1.AuditLog.create({
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
exports.PublishService = PublishService;
