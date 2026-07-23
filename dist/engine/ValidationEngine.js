"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationEngine = void 0;
const RuleEngine_1 = require("./RuleEngine");
const QuestionEngine_1 = require("./QuestionEngine");
class ValidationEngine {
    static validate(formData, questionsSchema) {
        const errors = [];
        const visibleQuestions = QuestionEngine_1.QuestionEngine.getVisibleQuestions(questionsSchema, formData);
        for (const q of visibleQuestions) {
            const actualValue = RuleEngine_1.RuleEngine.getFieldValue(formData, q.fieldName);
            // 1. Missing Required Check
            if (q.required) {
                if (actualValue === undefined || actualValue === null || actualValue === '') {
                    errors.push({
                        field: q.fieldName,
                        errorType: 'MISSING_REQUIRED',
                        message: `${q.title} is required.`
                    });
                    continue; // skip type validation if missing
                }
            }
            if (actualValue === undefined || actualValue === null || actualValue === '') {
                continue; // skip type validation if optional and missing
            }
            // 2. Data Type Check
            if (q.type === 'number' || q.type === 'currency') {
                if (isNaN(Number(actualValue))) {
                    errors.push({
                        field: q.fieldName,
                        errorType: 'INVALID_TYPE',
                        message: `${q.title} must be a valid number.`
                    });
                }
            }
            // 3. Selection Check
            if (q.type === 'dropdown' || q.type === 'radio') {
                if (q.options && !q.options.includes(actualValue)) {
                    errors.push({
                        field: q.fieldName,
                        errorType: 'INVALID_SELECTION',
                        message: `Selected value for ${q.title} is not a valid option.`
                    });
                }
            }
            if (q.type === 'multiselect' || q.type === 'checkbox') {
                if (!Array.isArray(actualValue)) {
                    errors.push({
                        field: q.fieldName,
                        errorType: 'INVALID_TYPE',
                        message: `${q.title} must be an array of selections.`
                    });
                }
                else if (q.options) {
                    for (const val of actualValue) {
                        if (!q.options.includes(val)) {
                            errors.push({
                                field: q.fieldName,
                                errorType: 'INVALID_SELECTION',
                                message: `Selection '${val}' for ${q.title} is not a valid option.`
                            });
                        }
                    }
                }
            }
            // Additional logic for specific validations could go here
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.ValidationEngine = ValidationEngine;
