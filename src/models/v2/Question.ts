import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  questionId: string;
  title: string;
  subtitle: string;
  type: 'text' | 'number' | 'currency' | 'dropdown' | 'multiselect' | 'radio' | 'checkbox';
  fieldMapping: string;
  placeholder: string;
  options: string[];
  validation: Record<string, any>;
  aiContext: string;
  followupQuestion: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    questionId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    type: { 
      type: String, 
      required: true,
      enum: ['text', 'number', 'currency', 'dropdown', 'multiselect', 'radio', 'checkbox']
    },
    fieldMapping: { type: String, required: true },
    placeholder: { type: String },
    options: [{ type: String }],
    validation: { type: Schema.Types.Mixed, default: {} },
    aiContext: { type: String },
    followupQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ questionId: 1 });
QuestionSchema.index({ fieldMapping: 1 });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
