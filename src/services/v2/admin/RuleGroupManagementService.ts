import { IAdminRepository, IAuditLogService } from './interfaces';

export class RuleGroupManagementService {
  constructor(private readonly repo: IAdminRepository<any>, private readonly audit: IAuditLogService) {}
  public async createGroup(data: any, userId: string) { return this.auditAndReturn('CREATE', await this.repo.create(data), userId); }
  public async updateGroup(id: string, updates: any, userId: string) { return this.auditAndReturn('UPDATE', await this.repo.update(id, updates), userId); }
  private async auditAndReturn(action: string, entity: any, userId: string) { await this.audit.log(action, 'RULE_GROUP', entity.id, entity, userId); return entity; }
}
