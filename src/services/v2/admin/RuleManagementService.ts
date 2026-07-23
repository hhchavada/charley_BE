import { IAdminRepository, IAuditLogService } from './interfaces';

export class RuleManagementService {
  constructor(private readonly repo: IAdminRepository<any>, private readonly audit: IAuditLogService) {}
  public async createRule(data: any, userId: string) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
  public async editRule(id: string, updates: any, userId: string) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
  public async disableRule(id: string, userId: string) { return this.auditAndReturn('DISABLE', await this.repo.update(id, { active: false }), userId); }
  private async auditAndReturn(action: string, entity: any, userId: string) { await this.audit.log(action, 'RULE', entity.id, entity, userId); return entity; }
}
