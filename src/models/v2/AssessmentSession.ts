import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentSession extends Document {
  sessionId: string;
  collectedData: Record<string, any>;
  missingFields: string[];
  matchedGrants: mongoose.Types.ObjectId[];
  chatHistory: Record<string, any>[];
  currentStep: number;
  status: 'FORM' | 'AI_CONVERSATION' | 'COMPLETED' | 'ABANDONED';
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSessionSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    collectedData: { type: Schema.Types.Mixed, default: {} },
    missingFields: [{ type: String }],
    matchedGrants: [{ type: Schema.Types.ObjectId, ref: 'Grant' }],
    chatHistory: [{ type: Schema.Types.Mixed }],
    currentStep: { type: Number, default: 1 },
    status: { 
      type: String, 
      required: true,
      enum: ['FORM', 'AI_CONVERSATION', 'COMPLETED', 'ABANDONED'],
      default: 'FORM'
    }
  },
  {
    timestamps: true,
  }
);

AssessmentSessionSchema.index({ sessionId: 1 });
AssessmentSessionSchema.index({ status: 1 });

export const AssessmentSession = mongoose.models.AssessmentSession || mongoose.model<IAssessmentSession>('AssessmentSession', AssessmentSessionSchema);
