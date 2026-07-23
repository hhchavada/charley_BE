import { PromptTemplate } from '../../../../models/v2/PromptTemplate';
import { PromptDTO } from '../dto';

export class PromptRepository {
  static async findAll(): Promise<PromptDTO[]> {
    return PromptTemplate.find().lean<PromptDTO[]>();
  }

  static async findById(id: string): Promise<PromptDTO | null> {
    return PromptTemplate.findOne({ templateId: id }).lean<PromptDTO>();
  }

  static async upsert(templateId: string, data: Partial<PromptDTO>): Promise<PromptDTO> {
    return PromptTemplate.findOneAndUpdate(
      { templateId },
      { $set: data },
      { new: true, upsert: true }
    ).lean<PromptDTO>();
  }
}
