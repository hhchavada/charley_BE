import { SystemConfig } from '../../../../models/v2/SystemConfig';
import { SystemConfigDTO } from '../dto';

export class ConfigRepository {
  static async findAll(): Promise<SystemConfigDTO[]> {
    return SystemConfig.find().lean<SystemConfigDTO[]>();
  }

  static async findByKey(key: string): Promise<SystemConfigDTO | null> {
    return SystemConfig.findOne({ key }).lean<SystemConfigDTO>();
  }

  static async upsert(key: string, value: any): Promise<SystemConfigDTO | null> {
    return SystemConfig.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true }
    ).lean<SystemConfigDTO>();
  }
}
