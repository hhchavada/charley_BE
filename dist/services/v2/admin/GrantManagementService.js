"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantManagementService = void 0;
class GrantManagementService {
    repository;
    audit;
    constructor(repository, audit) {
        this.repository = repository;
        this.audit = audit;
    }
    async createDraftGrant(data, userId) {
        const grant = await this.repository.create({ ...data, status: 'DRAFT' });
        await this.audit.log('CREATE', 'GRANT', grant.id, data, userId);
        return grant;
    }
    async updateDraftGrant(id, updates, userId) {
        const grant = await this.repository.update(id, updates);
        await this.audit.log('UPDATE', 'GRANT', id, updates, userId);
        return grant;
    }
    async cloneGrant(id, userId) {
        const original = await this.repository.findById(id);
        if (!original)
            throw new Error('Grant not found');
        const { id: _, ...rest } = original;
        const cloned = await this.repository.create({ ...rest, name: `${original.name} (Copy)`, status: 'DRAFT' });
        await this.audit.log('CLONE', 'GRANT', cloned.id, { fromId: id }, userId);
        return cloned;
    }
    async archiveGrant(id, userId) {
        const grant = await this.repository.update(id, { status: 'ARCHIVED' });
        await this.audit.log('ARCHIVE', 'GRANT', id, {}, userId);
        return grant;
    }
}
exports.GrantManagementService = GrantManagementService;
