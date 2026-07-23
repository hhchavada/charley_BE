"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationLoader = void 0;
const GraphBuilder_1 = require("../services/GraphBuilder");
const GrantRepository_1 = require("../repositories/GrantRepository");
const RuleGroupRepository_1 = require("../repositories/RuleGroupRepository");
const RuleRepository_1 = require("../repositories/RuleRepository");
const QuestionRepository_1 = require("../repositories/QuestionRepository");
const PromptRepository_1 = require("../repositories/PromptRepository");
const ConfigRepository_1 = require("../repositories/ConfigRepository");
// Note: QuestionFlowRepository not explicitly defined yet, but assuming it would exist
// We will stub its call for now since we only made QuestionRepository earlier.
class ConfigurationLoader {
    static async loadActiveConfiguration() {
        // 1. Fetch raw data from Repositories
        const [grants, ruleGroups, rules, questions, prompts, configs] = await Promise.all([
            GrantRepository_1.GrantRepository.findAllActive(),
            RuleGroupRepository_1.RuleGroupRepository.findAll(),
            RuleRepository_1.RuleRepository.findAll(),
            QuestionRepository_1.QuestionRepository.findAll(),
            PromptRepository_1.PromptRepository.findAll(),
            ConfigRepository_1.ConfigRepository.findAll(),
        ]);
        // 2. Build the Grant Graph
        const grantGraphs = GraphBuilder_1.GraphBuilder.build(grants, ruleGroups, rules, questions);
        // 3. Build QuestionFlow Graph (stub since repo isn't made in this exact step, but logic is here)
        const questionFlows = [];
        // In reality, we would fetch flows and map questions.
        // 4. Map Prompts & Configs
        const promptTemplates = prompts.reduce((acc, p) => {
            acc[p.templateId] = p;
            return acc;
        }, {});
        const systemConfigs = configs.reduce((acc, c) => {
            acc[c.key] = c;
            return acc;
        }, {});
        return {
            grants: grantGraphs,
            questionFlows,
            promptTemplates,
            systemConfigs,
        };
    }
}
exports.ConfigurationLoader = ConfigurationLoader;
