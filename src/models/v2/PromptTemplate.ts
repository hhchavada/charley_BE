import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptTemplate extends Document {
  templateId: string;
  name: string;
  systemPrompt: string;
  variables: string[];
  version: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PromptTemplateSchema: Schema = new Schema(
  {
    templateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    systemPrompt: { type: String, required: true },
    variables: [{ type: String }],
    version: { type: Number, required: true, default: 1 },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
  }
);

PromptTemplateSchema.index({ templateId: 1 });

export const PromptTemplate = mongoose.models.PromptTemplate || mongoose.model<IPromptTemplate>('PromptTemplate', PromptTemplateSchema);
