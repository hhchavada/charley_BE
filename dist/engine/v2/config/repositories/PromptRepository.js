"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptRepository = void 0;
const PromptTemplate_1 = require("../../../../models/v2/PromptTemplate");
class PromptRepository {
    static async findAll() {
        return PromptTemplate_1.PromptTemplate.find().lean();
    }
    static async findById(id) {
        return PromptTemplate_1.PromptTemplate.findOne({ templateId: id }).lean();
    }
    static async upsert(templateId, data) {
        return PromptTemplate_1.PromptTemplate.findOneAndUpdate({ templateId }, { $set: data }, { new: true, upsert: true }).lean();
    }
}
exports.PromptRepository = PromptRepository;
