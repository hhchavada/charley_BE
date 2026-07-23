export interface IAdminRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, any>): Promise<T[]>;
}

export interface IAuditLogService {
  log(action: string, entityType: string, entityId: string, changes: any, userId: string): Promise<void>;
}

export interface IVersionRepository {
  createVersionSnapshot(draftData: any): Promise<string>;
  setActiveVersion(versionId: string): Promise<void>;
  getActiveVersion(): Promise<string>;
  getDraftVersion(): Promise<any>;
}

export interface ISessionStatsRepository {
  getActiveSessionsCount(versionId: string): Promise<number>;
}
