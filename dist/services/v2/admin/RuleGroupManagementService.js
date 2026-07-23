"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleGroupManagementService = void 0;
class RuleGroupManagementService {
    repo;
    audit;
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
    }
    async createGroup(data, userId) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
    async updateGroup(id, updates, userId) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
    async auditAndReturn(action, entity, userId) { await this.audit.log(action, 'RULE_GROUP', entity.id, entity, userId); return entity; }
}
exports.RuleGroupManagementService = RuleGroupManagementService;
