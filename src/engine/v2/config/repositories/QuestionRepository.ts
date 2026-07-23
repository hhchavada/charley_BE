import { Question } from '../../../../models/v2/Question';
import { QuestionDTO } from '../dto';

export class QuestionRepository {
  static async findAll(): Promise<QuestionDTO[]> {
    return Question.find().lean<QuestionDTO[]>();
  }

  static async findById(id: string): Promise<QuestionDTO | null> {
    return Question.findOne({ questionId: id }).lean<QuestionDTO>();
  }

  static async upsert(questionId: string, data: Partial<QuestionDTO>): Promise<QuestionDTO> {
    return Question.findOneAndUpdate(
      { questionId },
      { $set: data },
      { new: true, upsert: true }
    ).lean<QuestionDTO>();
  }
}
