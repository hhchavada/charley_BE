"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEvaluator = void 0;
const EngineError_1 = require("../errors/EngineError");
class RuleEvaluator {
    /**
     * Evaluates a single rule statelessly against an immutable payload.
     */
    static evaluate(rule, payload) {
        try {
            const fieldValue = this.getNestedValue(payload, rule.fieldPath);
            const isMissing = fieldValue === undefined || fieldValue === null || fieldValue === '';
            // The exists/not_exists operators are the only ones that handle missing data internally.
            if (rule.operator === 'exists') {
                return !isMissing ? "PASS" : "FAIL";
            }
            if (rule.operator === 'not_exists') {
                return isMissing ? "PASS" : "FAIL";
            }
            // For all other operators, missing data triggers a MISSING state
            if (isMissing) {
                return "MISSING";
            }
            // Perform operator evaluation
            switch (rule.operator) {
                case 'equals':
                    return this.isEqual(fieldValue, rule.value) ? "PASS" : "FAIL";
                case 'not_equals':
                    return !this.isEqual(fieldValue, rule.value) ? "PASS" : "FAIL";
                case 'greater_than':
                    return this.compareNumeric(fieldValue, rule.value, (a, b) => a > b);
                case 'greater_than_or_equals':
                    return this.compareNumeric(fieldValue, rule.value, (a, b) => a >= b);
                case 'less_than':
                    return this.compareNumeric(fieldValue, rule.value, (a, b) => a < b);
                case 'less_than_or_equals':
                    return this.compareNumeric(fieldValue, rule.value, (a, b) => a <= b);
                case 'contains':
                    return this.checkContains(fieldValue, rule.value) ? "PASS" : "FAIL";
                case 'not_contains':
                    return !this.checkContains(fieldValue, rule.value) ? "PASS" : "FAIL";
                case 'regex':
                    return this.checkRegex(fieldValue, rule.value) ? "PASS" : "FAIL";
                default:
                    throw new EngineError_1.EngineError('UNKNOWN_OPERATOR', `Unknown operator: ${rule.operator}`);
            }
        }
        catch (err) {
            if (err instanceof EngineError_1.EngineError)
                throw err;
            return "ERROR";
        }
    }
    /**
     * Retrieves a nested value from an object using a dot-notation path (e.g., 'company.revenue').
     */
    static getNestedValue(obj, path) {
        if (!path)
            return undefined;
        if (obj[path] !== undefined)
            return obj[path];
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
    }
    /**
     * Performs a loose but safe equality check. Handles Date strings properly.
     */
    static isEqual(actual, expected) {
        if (actual instanceof Date || expected instanceof Date) {
            return new Date(actual).getTime() === new Date(expected).getTime();
        }
        if (Array.isArray(actual) && Array.isArray(expected)) {
            if (actual.length !== expected.length)
                return false;
            return actual.every((val, index) => this.isEqual(val, expected[index]));
        }
        return actual === expected;
    }
    /**
     * Safely parses values to floats and compares them.
     */
    static compareNumeric(actual, expected, comparator) {
        const a = parseFloat(actual);
        const b = parseFloat(expected);
        if (isNaN(a) || isNaN(b)) {
            return "ERROR";
        }
        return comparator(a, b) ? "PASS" : "FAIL";
    }
    /**
     * Checks if an array contains a value, or if a string contains a substring.
     */
    static checkContains(actual, expected) {
        if (Array.isArray(actual)) {
            return actual.some(item => this.isEqual(item, expected));
        }
        if (typeof actual === 'string') {
            return actual.includes(String(expected));
        }
        return false;
    }
    /**
     * Checks if a string matches a regex pattern.
     */
    static checkRegex(actual, expected) {
        try {
            if (typeof actual !== 'string')
                return false;
            const regex = new RegExp(expected);
            return regex.test(actual);
        }
        catch (e) {
            return false;
        }
    }
}
exports.RuleEvaluator = RuleEvaluator;
