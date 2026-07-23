import { Grant } from '../../../../models/v2/Grant';
import { GrantDTO } from '../dto';

export class GrantRepository {
  static async findAllActive(): Promise<GrantDTO[]> {
    return Grant.find({ status: 'ACTIVE' }).lean<GrantDTO[]>();
  }

  static async findById(id: string): Promise<GrantDTO | null> {
    return Grant.findOne({ grantId: id }).lean<GrantDTO>();
  }

  static async upsert(grantId: string, data: Partial<GrantDTO>): Promise<GrantDTO | null> {
    return Grant.findOneAndUpdate(
      { grantId },
      { $set: data },
      { new: true, upsert: true }
    ).lean<GrantDTO>();
  }
}
