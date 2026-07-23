"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCacheValidator = void 0;
class ConfigurationCacheValidator {
    /**
     * Scans the constructed bundle for severe structural errors.
     * If the bundle is corrupted, it should not be cached.
     */
    validate(bundle) {
        if (!bundle || !bundle.configuration) {
            throw new Error('Cache Validation Failed: Bundle is empty');
        }
        const { grants } = bundle.configuration;
        if (!Array.isArray(grants)) {
            throw new Error('Cache Validation Failed: Grants must be an array');
        }
        const ruleIds = new Set();
        // Deep check for circular references (simplified depth check)
        const traverse = (node, depth) => {
            if (depth > 50) {
                throw new Error('Cache Validation Failed: Circular or overly deep RuleGroup nesting detected');
            }
            if (node.rules) {
                node.rules.forEach((r) => {
                    if (!r.ruleId)
                        throw new Error('Cache Validation Failed: Rule missing ID');
                    if (ruleIds.has(r.ruleId)) {
                        // Duplicate rules across different groups are fine as long as they are identical,
                        // but in a strict normalized graph, this might be a warning.
                    }
                    ruleIds.add(r.ruleId);
                });
            }
            if (node.nestedGroups) {
                node.nestedGroups.forEach((g) => traverse(g, depth + 1));
            }
        };
        grants.forEach(g => traverse(g.ruleGroup, 0));
    }
}
exports.ConfigurationCacheValidator = ConfigurationCacheValidator;
