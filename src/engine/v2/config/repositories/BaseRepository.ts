import { Model, Document, FilterQuery } from 'mongoose';
import { AuditLog } from '../../../../models/v2/AuditLog';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BaseRepository<T extends Document, DTO> {
  constructor(
    protected readonly model: Model<T>,
    protected readonly entityType: string
  ) {}

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    searchFields: string[] = [],
    filter: FilterQuery<T> = {},
    sort: any = { createdAt: -1 }
  ): Promise<PaginatedResult<DTO>> {
    const query: FilterQuery<T> = { ...filter, deletedAt: null };

    if (search && searchFields.length > 0) {
      query.$or = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      })) as any;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(query)
    ]);

    return {
      data: data as unknown as DTO[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string, idField: string = '_id'): Promise<DTO | null> {
    const query: FilterQuery<T> = { [idField]: id, deletedAt: null } as any;
    return this.model.findOne(query).lean() as unknown as Promise<DTO | null>;
  }

  async create(data: Partial<DTO>, adminId: string, idField: string): Promise<DTO> {
    const doc = await this.model.create(data);
    const dto = doc.toObject() as unknown as DTO;
    
    await this.logAudit(adminId, 'CREATE', (dto as any)[idField] || doc._id.toString(), { newData: dto });
    return dto;
  }

  async update(id: string, data: Partial<DTO>, adminId: string, idField: string = '_id'): Promise<DTO | null> {
    const query: FilterQuery<T> = { [idField]: id, deletedAt: null } as any;
    const oldDoc = await this.model.findOne(query).lean();
    if (!oldDoc) return null;

    const newDoc = await this.model.findOneAndUpdate(
      query,
      { $set: data },
      { new: true }
    ).lean();

    if (newDoc) {
      await this.logAudit(adminId, 'UPDATE', id, { oldData: oldDoc, newData: newDoc });
      return newDoc as unknown as DTO;
    }
    return null;
  }

  async softDelete(id: string, adminId: string, idField: string = '_id'): Promise<boolean> {
    const query: FilterQuery<T> = { [idField]: id, deletedAt: null } as any;
    const doc = await this.model.findOneAndUpdate(
      query,
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).lean();

    if (doc) {
      await this.logAudit(adminId, 'DELETE', id, { deletedAt: (doc as any).deletedAt });
      return true;
    }
    return false;
  }

  protected async logAudit(adminId: string, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE', entityId: string, changes: any) {
    await AuditLog.create({
      adminId,
      action,
      entityType: this.entityType,
      entityId,
      changes,
      timestamp: new Date()
    });
  }
}
