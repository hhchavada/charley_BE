"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigRepository = void 0;
const SystemConfig_1 = require("../../../../models/v2/SystemConfig");
class ConfigRepository {
    static async findAll() {
        return SystemConfig_1.SystemConfig.find().lean();
    }
    static async findByKey(key) {
        return SystemConfig_1.SystemConfig.findOne({ key }).lean();
    }
    static async upsert(key, value) {
        return SystemConfig_1.SystemConfig.findOneAndUpdate({ key }, { $set: { value } }, { new: true, upsert: true }).lean();
    }
}
exports.ConfigRepository = ConfigRepository;
