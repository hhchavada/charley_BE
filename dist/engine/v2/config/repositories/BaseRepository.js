"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const AuditLog_1 = require("../../../../models/v2/AuditLog");
class BaseRepository {
    model;
    entityType;
    constructor(model, entityType) {
        this.model = model;
        this.entityType = entityType;
    }
    async findPaginated(page = 1, limit = 10, search = '', searchFields = [], filter = {}, sort = { createdAt: -1 }) {
        const query = { ...filter, deletedAt: null };
        if (search && searchFields.length > 0) {
            query.$or = searchFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }));
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model.find(query).sort(sort).skip(skip).limit(limit).lean(),
            this.model.countDocuments(query)
        ]);
        return {
            data: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async findById(id, idField = '_id') {
        const query = { [idField]: id, deletedAt: null };
        return this.model.findOne(query).lean();
    }
    async create(data, adminId, idField) {
        const doc = await this.model.create(data);
        const dto = doc.toObject();
        await this.logAudit(adminId, 'CREATE', dto[idField] || doc._id.toString(), { newData: dto });
        return dto;
    }
    async update(id, data, adminId, idField = '_id') {
        const query = { [idField]: id, deletedAt: null };
        const oldDoc = await this.model.findOne(query).lean();
        if (!oldDoc)
            return null;
        const newDoc = await this.model.findOneAndUpdate(query, { $set: data }, { new: true }).lean();
        if (newDoc) {
            await this.logAudit(adminId, 'UPDATE', id, { oldData: oldDoc, newData: newDoc });
            return newDoc;
        }
        return null;
    }
    async softDelete(id, adminId, idField = '_id') {
        const query = { [idField]: id, deletedAt: null };
        const doc = await this.model.findOneAndUpdate(query, { $set: { deletedAt: new Date() } }, { new: true }).lean();
        if (doc) {
            await this.logAudit(adminId, 'DELETE', id, { deletedAt: doc.deletedAt });
            return true;
        }
        return false;
    }
    async logAudit(adminId, action, entityId, changes) {
        await AuditLog_1.AuditLog.create({
            adminId,
            action,
            entityType: this.entityType,
            entityId,
            changes,
            timestamp: new Date()
        });
    }
}
exports.BaseRepository = BaseRepository;
