"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionManagementService = void 0;
class QuestionManagementService {
    repo;
    audit;
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
    }
    async createQuestion(data, userId) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
    async updateQuestion(id, updates, userId) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
    async auditAndReturn(action, entity, userId) { await this.audit.log(action, 'QUESTION', entity.id, entity, userId); return entity; }
}
exports.QuestionManagementService = QuestionManagementService;
