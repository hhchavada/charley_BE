import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE';
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    adminId: { type: String, required: true },
    action: { 
      type: String, 
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'MERGE']
    },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  {
    // Explicitly defining timestamp since we override default createdAt name to timestamp
    timestamps: false 
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
