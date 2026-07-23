"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantRepository = void 0;
const Grant_1 = require("../../../../models/v2/Grant");
class GrantRepository {
    static async findAllActive() {
        return Grant_1.Grant.find({ status: 'ACTIVE' }).lean();
    }
    static async findById(id) {
        return Grant_1.Grant.findOne({ grantId: id }).lean();
    }
    static async upsert(grantId, data) {
        return Grant_1.Grant.findOneAndUpdate({ grantId }, { $set: data }, { new: true, upsert: true }).lean();
    }
}
exports.GrantRepository = GrantRepository;
