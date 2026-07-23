import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionFlow extends Document {
  flowId: string;
  step: number;
  title: string;
  description: string;
  questions: mongoose.Types.ObjectId[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionFlowSchema: Schema = new Schema(
  {
    flowId: { type: String, required: true, unique: true },
    step: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

QuestionFlowSchema.index({ flowId: 1 });
QuestionFlowSchema.index({ step: 1 });

export const QuestionFlow = mongoose.models.QuestionFlow || mongoose.model<IQuestionFlow>('QuestionFlow', QuestionFlowSchema);
