"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionManager = void 0;
const Version_1 = require("../../../../models/v2/Version");
class VersionManager {
    /**
     * Creates a new frozen snapshot version of any configuration entity
     */
    static async createSnapshot(entityType, entityId, snapshot) {
        // Find latest version number
        const latest = await Version_1.Version.findOne({ entityId, entityType })
            .sort({ versionNumber: -1 })
            .select('versionNumber')
            .lean();
        const nextVersion = latest ? latest.versionNumber + 1 : 1;
        const newVersion = await Version_1.Version.create({
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
    static async getSnapshot(entityId, versionNumber) {
        return Version_1.Version.findOne({ entityId, versionNumber }).lean();
    }
}
exports.VersionManager = VersionManager;
