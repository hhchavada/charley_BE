"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleGroupRepository = void 0;
const RuleGroup_1 = require("../../../../models/v2/RuleGroup");
class RuleGroupRepository {
    static async findAll() {
        return RuleGroup_1.RuleGroup.find().lean();
    }
    static async findById(id) {
        return RuleGroup_1.RuleGroup.findOne({ groupId: id }).lean();
    }
    static async upsert(groupId, data) {
        return RuleGroup_1.RuleGroup.findOneAndUpdate({ groupId }, { $set: data }, { new: true, upsert: true }).lean();
    }
}
exports.RuleGroupRepository = RuleGroupRepository;
