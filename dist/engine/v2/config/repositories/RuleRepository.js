"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleRepository = void 0;
const Rule_1 = require("../../../../models/v2/Rule");
class RuleRepository {
    static async findAll() {
        return Rule_1.Rule.find().lean();
    }
    static async findById(id) {
        return Rule_1.Rule.findOne({ ruleId: id }).lean();
    }
    static async upsert(ruleId, data) {
        return Rule_1.Rule.findOneAndUpdate({ ruleId }, { $set: data }, { new: true, upsert: true }).lean();
    }
}
exports.RuleRepository = RuleRepository;
