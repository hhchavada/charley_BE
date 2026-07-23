"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionRepository = void 0;
const Question_1 = require("../../../../models/v2/Question");
class QuestionRepository {
    static async findAll() {
        return Question_1.Question.find().lean();
    }
    static async findById(id) {
        return Question_1.Question.findOne({ questionId: id }).lean();
    }
    static async upsert(questionId, data) {
        return Question_1.Question.findOneAndUpdate({ questionId }, { $set: data }, { new: true, upsert: true }).lean();
    }
}
exports.QuestionRepository = QuestionRepository;
