"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionEngine = void 0;
const RuleEngine_1 = require("./RuleEngine");
class QuestionEngine {
    static isQuestionVisible(q, formData) {
        if (q.isHidden)
            return false;
        if (!q.conditions || q.conditions.length === 0) {
            return true;
        }
        const logic = q.conditionLogic || 'AND';
        const results = q.conditions.map(cond => {
            const actual = RuleEngine_1.RuleEngine.getFieldValue(formData, cond.field);
            return RuleEngine_1.RuleEngine.evaluate(cond.operator, cond.value, actual);
        });
        if (logic === 'AND') {
            return results.every(res => res === true);
        }
        else {
            return results.some(res => res === true);
        }
    }
    static getVisibleQuestions(questions, formData) {
        const visible = [];
        for (const q of questions) {
            if (this.isQuestionVisible(q, formData)) {
                visible.push(q);
                if (q.followUpQuestions && q.followUpQuestions.length > 0) {
                    visible.push(...this.getVisibleQuestions(q.followUpQuestions, formData));
                }
            }
        }
        return visible;
    }
}
exports.QuestionEngine = QuestionEngine;
