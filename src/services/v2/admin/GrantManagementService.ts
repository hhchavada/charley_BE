import { IAdminRepository, IAuditLogService } from './interfaces';

export class GrantManagementService {
  constructor(
    private readonly repository: IAdminRepository<any>,
    private readonly audit: IAuditLogService
  ) {}

  public async createDraftGrant(data: any, userId: string): Promise<any> {
    const grant = await this.repository.create({ ...data, status: 'DRAFT' });
    await this.audit.log('CREATE', 'GRANT', grant.id, data, userId);
    return grant;
  }

  public async updateDraftGrant(id: string, updates: any, userId: string): Promise<any> {
    const grant = await this.repository.update(id, updates);
    await this.audit.log('UPDATE', 'GRANT', id, updates, userId);
    return grant;
  }

  public async cloneGrant(id: string, userId: string): Promise<any> {
    const original = await this.repository.findById(id);
    if (!original) throw new Error('Grant not found');
    
    const { id: _, ...rest } = original;
    const cloned = await this.repository.create({ ...rest, name: `${original.name} (Copy)`, status: 'DRAFT' });
    await this.audit.log('CLONE', 'GRANT', cloned.id, { fromId: id }, userId);
    return cloned;
  }

  public async archiveGrant(id: string, userId: string): Promise<any> {
    const grant = await this.repository.update(id, { status: 'ARCHIVED' });
    await this.audit.log('ARCHIVE', 'GRANT', id, {}, userId);
    return grant;
  }
}
