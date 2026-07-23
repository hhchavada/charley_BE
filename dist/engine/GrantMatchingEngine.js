"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrantMatchingEngine = void 0;
const RuleEngine_1 = require("./RuleEngine");
const ResultBuilder_1 = require("./ResultBuilder");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class GrantMatchingEngine {
    grants;
    constructor() {
        const grantsFilePath = path_1.default.join(__dirname, '../data/grants.json');
        const data = fs_1.default.readFileSync(grantsFilePath, 'utf-8');
        this.grants = JSON.parse(data);
    }
    match(company) {
        // Memoize field lookups for this matching cycle to optimize performance for 200+ grants
        const fieldCache = new Map();
        return this.grants.map(grant => this.evaluateGrant(grant, company, fieldCache));
    }
    evaluateGrant(grant, company, fieldCache) {
        const matchedRules = [];
        const failedRules = [];
        const missingRules = [];
        for (const rule of grant.conditions) {
            const { field, operator, value } = rule;
            let actualValue;
            if (fieldCache.has(field)) {
                actualValue = fieldCache.get(field);
            }
            else {
                actualValue = RuleEngine_1.RuleEngine.getFieldValue(company, field);
                fieldCache.set(field, actualValue);
            }
            const result = {
                ruleId: rule.id || `rule_${field}_${operator}`,
                ruleName: rule.name || `Rule for ${field}`,
                field,
                operator,
                expectedValue: value,
                actualValue,
                status: 'FAIL' // Default, overridden below
            };
            if (actualValue === undefined || actualValue === null || actualValue === '') {
                result.status = 'MISSING_DATA';
                missingRules.push(result);
                continue;
            }
            const passed = RuleEngine_1.RuleEngine.evaluate(operator, value, actualValue);
            result.status = passed ? 'PASS' : 'FAIL';
            if (passed) {
                matchedRules.push(result);
            }
            else {
                failedRules.push(result);
            }
        }
        return ResultBuilder_1.ResultBuilder.build(grant, matchedRules, failedRules, missingRules);
    }
}
exports.GrantMatchingEngine = GrantMatchingEngine;
