import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  name: string;
  fieldPath: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value: any;
  questionId: mongoose.Types.ObjectId;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  message: string;
  weight: number;
  semanticDescription: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema: Schema = new Schema(
  {
    ruleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fieldPath: { type: String, required: true },
    operator: { 
      type: String, 
      required: true,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains', 'exists', 'not_exists']
    },
    value: { type: Schema.Types.Mixed },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    severity: { 
      type: String, 
      enum: ['BLOCKING', 'WARNING', 'INFO'],
      default: 'BLOCKING'
    },
    message: { type: String },
    weight: { type: Number, default: 1 },
    semanticDescription: { type: String },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

RuleSchema.index({ ruleId: 1 });
RuleSchema.index({ fieldPath: 1 });

export const Rule = mongoose.models.Rule || mongoose.model<IRule>('Rule', RuleSchema);
