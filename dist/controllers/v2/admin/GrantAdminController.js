"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantAdminController = void 0;
const BaseRepository_1 = require("../../../engine/v2/config/repositories/BaseRepository");
const Grant_1 = require("../../../models/v2/Grant");
const grantRepo = new BaseRepository_1.BaseRepository(Grant_1.Grant, 'GRANT');
class GrantAdminController {
    static async listGrants(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const sortField = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
            const result = await grantRepo.findPaginated(page, limit, search, ['name', 'grantId', 'description'], {}, { [sortField]: sortOrder });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getGrant(req, res) {
        try {
            const grant = await grantRepo.findById(req.params.id, 'grantId');
            if (!grant)
                return res.status(404).json({ error: 'Grant not found' });
            res.json(grant);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createGrant(req, res) {
        try {
            const adminId = req.headers['x-admin-id'] || 'system';
            const grant = await grantRepo.create(req.body, adminId, 'grantId');
            res.status(201).json(grant);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateGrant(req, res) {
        try {
            const adminId = req.headers['x-admin-id'] || 'system';
            const grant = await grantRepo.update(req.params.id, req.body, adminId, 'grantId');
            if (!grant)
                return res.status(404).json({ error: 'Grant not found' });
            res.json(grant);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteGrant(req, res) {
        try {
            const adminId = req.headers['x-admin-id'] || 'system';
            const success = await grantRepo.softDelete(req.params.id, adminId, 'grantId');
            if (!success)
                return res.status(404).json({ error: 'Grant not found' });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async cloneGrant(req, res) {
        try {
            const adminId = req.headers['x-admin-id'] || 'system';
            const grant = await grantRepo.findById(req.params.id, 'grantId');
            if (!grant)
                return res.status(404).json({ error: 'Grant not found' });
            // Strip IDs and specific metadata
            const cloneData = {
                ...grant,
                grantId: `${grant.grantId}_clone_${Date.now()}`,
                name: `${grant.name} (Clone)`,
                status: 'DRAFT'
            };
            delete cloneData._id;
            delete cloneData.createdAt;
            delete cloneData.updatedAt;
            const newGrant = await grantRepo.create(cloneData, adminId, 'grantId');
            res.status(201).json(newGrant);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.GrantAdminController = GrantAdminController;
