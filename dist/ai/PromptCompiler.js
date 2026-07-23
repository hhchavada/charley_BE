"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptCompiler = void 0;
class PromptCompiler {
    versionManager;
    renderer;
    constructor(versionManager, renderer) {
        this.versionManager = versionManager;
        this.renderer = renderer;
    }
    compile(templateId, variables, version) {
        const template = this.versionManager.getActiveTemplate(templateId, version);
        return this.renderer.render(template, variables);
    }
}
exports.PromptCompiler = PromptCompiler;
