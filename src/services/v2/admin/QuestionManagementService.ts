import { IAdminRepository, IAuditLogService } from './interfaces';

export class QuestionManagementService {
  constructor(private readonly repo: IAdminRepository<any>, private readonly audit: IAuditLogService) {}
  public async createQuestion(data: any, userId: string) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
  public async updateQuestion(id: string, updates: any, userId: string) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
  private async auditAndReturn(action: string, entity: any, userId: string) { await this.audit.log(action, 'QUESTION', entity.id, entity, userId); return entity; }
}
