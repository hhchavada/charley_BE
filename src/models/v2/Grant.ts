import mongoose, { Schema, Document } from 'mongoose';

export interface IGrant extends Document {
  grantId: string;
  name: string;
  description: string;
  agency: string;
  category: string;
  priority: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  ruleGroupId: mongoose.Types.ObjectId;
  estimatedFunding: string;
  supportPercentage: string;
  timeline: string;
  metadata: Record<string, any>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GrantSchema: Schema = new Schema(
  {
    grantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    agency: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: Number, required: true, default: 1 },
    status: { 
      type: String, 
      required: true, 
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], 
      default: 'DRAFT' 
    },
    version: { type: Number, required: true, default: 1 },
    ruleGroupId: { type: Schema.Types.ObjectId, ref: 'RuleGroup', required: true },
    estimatedFunding: { type: String },
    supportPercentage: { type: String },
    timeline: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

GrantSchema.index({ grantId: 1 });
GrantSchema.index({ status: 1, agency: 1 });
GrantSchema.index({ category: 1 });

export const Grant = mongoose.models.Grant || mongoose.model<IGrant>('Grant', GrantSchema);
