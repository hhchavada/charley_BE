import { Rule } from '../../../../models/v2/Rule';
import { RuleDTO } from '../dto';

export class RuleRepository {
  static async findAll(): Promise<RuleDTO[]> {
    return Rule.find().lean<RuleDTO[]>();
  }

  static async findById(id: string): Promise<RuleDTO | null> {
    return Rule.findOne({ ruleId: id }).lean<RuleDTO>();
  }

  static async upsert(ruleId: string, data: Partial<RuleDTO>): Promise<RuleDTO | null> {
    return Rule.findOneAndUpdate(
      { ruleId },
      { $set: data },
      { new: true, upsert: true }
    ).lean<RuleDTO>();
  }
}
