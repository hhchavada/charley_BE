"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionTraceBuilder = void 0;
class DecisionTraceBuilder {
    /**
     * Translates the highly nested internal Result graphs into a serializable,
     * frontend-friendly execution trace tree.
     */
    build(grantResult) {
        return {
            type: 'GRANT',
            id: grantResult.grant.grantId,
            result: grantResult.state,
            details: grantResult.explanation,
            children: grantResult.rootGroupResult
                ? [this.buildGroup(grantResult.rootGroupResult)]
                : []
        };
    }
    buildGroup(groupResult) {
        const children = [];
        if (groupResult.nestedGroupResults) {
            groupResult.nestedGroupResults.forEach((g) => children.push(this.buildGroup(g)));
        }
        if (groupResult.ruleResults) {
            groupResult.ruleResults.forEach((r) => children.push(this.buildRule(r)));
        }
        return {
            type: 'GROUP',
            id: groupResult.groupId,
            operator: groupResult.operator || 'AND',
            result: groupResult.state,
            children
        };
    }
    buildRule(ruleResult) {
        return {
            type: 'RULE',
            id: ruleResult.ruleId,
            result: ruleResult.state,
            details: `Expected: ${ruleResult.expectedValue}, Actual: ${ruleResult.actualValue}`
        };
    }
}
exports.DecisionTraceBuilder = DecisionTraceBuilder;
