import mongoose, { Schema, Document } from 'mongoose';

export interface IRuleGroup extends Document {
  groupId: string;
  logic: 'AND' | 'OR';
  rules: mongoose.Types.ObjectId[];
  nestedGroups: mongoose.Types.ObjectId[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RuleGroupSchema: Schema = new Schema(
  {
    groupId: { type: String, required: true, unique: true },
    logic: { 
      type: String, 
      required: true,
      enum: ['AND', 'OR'],
      default: 'AND'
    },
    rules: [{ type: Schema.Types.ObjectId, ref: 'Rule' }],
    nestedGroups: [{ type: Schema.Types.ObjectId, ref: 'RuleGroup' }],
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

RuleGroupSchema.index({ groupId: 1 });

export const RuleGroup = mongoose.models.RuleGroup || mongoose.model<IRuleGroup>('RuleGroup', RuleGroupSchema);
