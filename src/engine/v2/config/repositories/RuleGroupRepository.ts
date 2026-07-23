import { RuleGroup } from '../../../../models/v2/RuleGroup';
import { RuleGroupDTO } from '../dto';

export class RuleGroupRepository {
  static async findAll(): Promise<RuleGroupDTO[]> {
    return RuleGroup.find().lean<RuleGroupDTO[]>();
  }

  static async findById(id: string): Promise<RuleGroupDTO | null> {
    return RuleGroup.findOne({ groupId: id }).lean<RuleGroupDTO>();
  }

  static async upsert(groupId: string, data: Partial<RuleGroupDTO>): Promise<RuleGroupDTO | null> {
    return RuleGroup.findOneAndUpdate(
      { groupId },
      { $set: data },
      { new: true, upsert: true }
    ).lean<RuleGroupDTO>();
  }
}
