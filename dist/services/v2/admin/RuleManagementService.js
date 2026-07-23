"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleManagementService = void 0;
class RuleManagementService {
    repo;
    audit;
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
    }
    async createRule(data, userId) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
    async editRule(id, updates, userId) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
    async disableRule(id, userId) { return this.auditAndReturn('DISABLE', await this.repo.update(id, { active: false }), userId); }
    async auditAndReturn(action, entity, userId) { await this.audit.log(action, 'RULE', entity.id, entity, userId); return entity; }
}
exports.RuleManagementService = RuleManagementService;
