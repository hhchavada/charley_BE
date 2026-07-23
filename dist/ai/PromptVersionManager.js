"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptVersionManager = void 0;
class PromptVersionManager {
    templates = new Map();
    registerTemplate(template) {
        if (!this.templates.has(template.templateId)) {
            this.templates.set(template.templateId, []);
        }
        this.templates.get(template.templateId).push(template);
        // Sort descending by version assuming semver or numeric
        this.templates.get(template.templateId).sort((a, b) => b.version.localeCompare(a.version));
    }
    getActiveTemplate(templateId, requestedVersion) {
        const versions = this.templates.get(templateId);
        if (!versions || versions.length === 0) {
            throw new Error(`Template ${templateId} not found`);
        }
        if (requestedVersion) {
            const match = versions.find(v => v.version === requestedVersion);
            if (match)
                return match;
            console.warn(`Version ${requestedVersion} of ${templateId} not found, falling back to latest.`);
        }
        return versions[0]; // Returns highest version
    }
}
exports.PromptVersionManager = PromptVersionManager;
