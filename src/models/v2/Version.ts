import mongoose, { Schema, Document } from 'mongoose';

export interface IVersion extends Document {
  entityType: 'GRANT' | 'RULE' | 'RULE_GROUP' | 'QUESTION' | 'PROMPT_TEMPLATE';
  entityId: string;
  versionNumber: number;
  snapshot: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VersionSchema: Schema = new Schema(
  {
    entityType: { 
      type: String, 
      required: true,
      enum: ['GRANT', 'RULE', 'RULE_GROUP', 'QUESTION', 'PROMPT_TEMPLATE']
    },
    entityId: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true }
  },
  {
    timestamps: true,
  }
);

VersionSchema.index({ entityId: 1, versionNumber: -1 });
VersionSchema.index({ entityType: 1 });

export const Version = mongoose.models.Version || mongoose.model<IVersion>('Version', VersionSchema);
